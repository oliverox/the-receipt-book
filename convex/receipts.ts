import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Generates a new receipt ID based on the organization's counter and format.
 */
const generateReceiptId = async (ctx: any, organizationId: string) => {
  // Get organization
  const organization = await ctx.db.get(organizationId);
  if (!organization) {
    throw new ConvexError("Organization not found");
  }

  // Get organization settings
  const settings = await ctx.db
    .query("organizationSettings")
    .withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId))
    .unique();

  // Increment the counter
  const newCounter = organization.receiptCounter + 1;
  await ctx.db.patch(organizationId, {
    receiptCounter: newCounter,
  });

  // Generate receipt ID with format
  const format = settings?.receiptNumberingFormat || "RCP-{YEAR}-{NUMBER}";
  
  const year = new Date().getFullYear();
  const paddedCounter = newCounter.toString().padStart(4, "0");
  
  return format
    .replace("{YEAR}", year.toString())
    .replace("{NUMBER}", paddedCounter)
    .replace("{ORG}", organization.name.substring(0, 3).toUpperCase());
};

/**
 * Finds or creates a contact for a receipt.
 */
const findOrCreateContact = async (ctx: any, user: any, recipientData: any) => {
  // If we have an email, try to find a contact by email
  if (recipientData.recipientEmail) {
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q: any) => 
        q.eq("email", recipientData.recipientEmail).eq("organizationId", user.organizationId)
      )
      .first();

    if (existingContact) {
      // Contact exists, update it if needed
      const updates: Record<string, any> = {
        updatedAt: Date.now(),
      };

      let shouldUpdate = false;
      if (recipientData.recipientName && existingContact.name !== recipientData.recipientName) {
        updates.name = recipientData.recipientName;
        shouldUpdate = true;
      }
      if (recipientData.recipientPhone && existingContact.phone !== recipientData.recipientPhone) {
        updates.phone = recipientData.recipientPhone;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await ctx.db.patch(existingContact._id, updates);
      }

      return existingContact._id;
    }
  }

  // Try to find by name (less precise, but useful for matching)
  if (recipientData.recipientName) {
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_name", (q: any) => 
        q.eq("name", recipientData.recipientName).eq("organizationId", user.organizationId)
      )
      .first();

    if (existingContact) {
      // Contact exists, update it if needed
      const updates: Record<string, any> = {
        updatedAt: Date.now(),
      };

      let shouldUpdate = false;
      if (recipientData.recipientEmail && !existingContact.email) {
        updates.email = recipientData.recipientEmail;
        shouldUpdate = true;
      }
      if (recipientData.recipientPhone && !existingContact.phone) {
        updates.phone = recipientData.recipientPhone;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await ctx.db.patch(existingContact._id, updates);
      }

      return existingContact._id;
    }
  }

  // No contact found, create a new one
  // First, get the default "Individual" contact type
  let individualContactType = await ctx.db
    .query("contactTypes")
    .withIndex("by_name_and_org", (q: any) => 
      q.eq("name", "Individual").eq("organizationId", user.organizationId)
    )
    .first();

  // If no default contact types exist, create them
  if (!individualContactType) {
    // Create default contact types
    const defaultTypeId = await ctx.db.insert("contactTypes", {
      name: "Individual",
      description: "Individual person",
      organizationId: user.organizationId,
      isDefault: true,
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    
    // Also create other default types
    await ctx.db.insert("contactTypes", {
      name: "Institution",
      description: "Organizations, companies, etc.",
      organizationId: user.organizationId,
      isDefault: true,
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    
    individualContactType = { _id: defaultTypeId };
  }

  // Create the new contact
  const timestamp = Date.now();
  const contactId = await ctx.db.insert("contacts", {
    name: recipientData.recipientName,
    email: recipientData.recipientEmail,
    phone: recipientData.recipientPhone,
    contactTypeId: individualContactType._id,
    organizationId: user.organizationId,
    totalContributions: 0, // Will be updated when receipt is saved
    createdBy: user._id,
    createdAt: timestamp,
    updatedAt: timestamp,
    active: true,
  });

  // Log activity
  await ctx.db.insert("activityLogs", {
    organizationId: user.organizationId,
    userId: user._id,
    action: "create_contact",
    resourceType: "contacts",
    resourceId: contactId,
    timestamp,
  });

  return contactId;
};

/**
 * Updates a contact's contribution total and last receipt date.
 */
const updateContactContributionStats = async (ctx: any, contactId: string, amount: number, date: number) => {
  const contact = await ctx.db.get(contactId);
  if (!contact) return;

  // Update total contributions and last receipt date
  await ctx.db.patch(contactId, {
    totalContributions: (contact.totalContributions || 0) + amount,
    lastReceiptDate: date,
    updatedAt: Date.now(),
  });
};

/**
 * Creates a new receipt.
 */
export const createReceipt = mutation({
  args: {
    templateId: v.id("receiptTemplates"),
    recipientName: v.string(),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")), // Optional - can be provided if contact is known
    totalAmount: v.number(),
    currency: v.string(),
    date: v.number(),
    notes: v.optional(v.string()),
    contributions: v.array(
      v.object({
        fundCategoryId: v.id("fundCategories"),
        amount: v.number(),
        description: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    receiptId: v.id("receipts"),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || !user.organizationId) {
      throw new ConvexError("User or organization not found");
    }

    // Validate total amount matches sum of contributions
    const totalContributions = args.contributions.reduce(
      (sum, contribution) => sum + contribution.amount,
      0
    );

    if (totalContributions !== args.totalAmount) {
      throw new ConvexError(
        "Sum of contributions must equal total amount"
      );
    }

    // Find or create contact
    let contactId = args.contactId;
    if (!contactId) {
      // If contact ID not provided, find or create one
      contactId = await findOrCreateContact(ctx, user, args);
    }

    // Generate receipt ID
    const receiptId = await generateReceiptId(ctx, user.organizationId);

    // Create receipt
    const newReceiptId = await ctx.db.insert("receipts", {
      receiptId,
      organizationId: user.organizationId,
      createdBy: user._id,
      templateId: args.templateId,
      recipientName: args.recipientName,
      recipientEmail: args.recipientEmail,
      recipientPhone: args.recipientPhone,
      contactId,
      totalAmount: args.totalAmount,
      currency: args.currency,
      date: args.date,
      status: "draft",
      notes: args.notes,
      metadata: {},
    });

    // Create contributions
    for (const contribution of args.contributions) {
      await ctx.db.insert("receiptContributions", {
        receiptId: newReceiptId,
        fundCategoryId: contribution.fundCategoryId,
        amount: contribution.amount,
        description: contribution.description,
      });
    }

    // Update contact's contribution statistics
    if (contactId) {
      await updateContactContributionStats(ctx, contactId, args.totalAmount, args.date);
    }

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "create_receipt",
      resourceType: "receipt",
      resourceId: newReceiptId,
      timestamp: Date.now(),
    });

    return {
      receiptId: newReceiptId,
    };
  },
});

/**
 * Gets a receipt by ID with all its details.
 */
export const getReceipt = query({
  args: {
    receiptId: v.id("receipts"),
  },
  returns: v.object({
    receipt: v.object({
      _id: v.id("receipts"),
      receiptId: v.string(),
      recipientName: v.string(),
      recipientEmail: v.optional(v.string()),
      recipientPhone: v.optional(v.string()),
      totalAmount: v.number(),
      currency: v.string(),
      date: v.number(),
      status: v.string(),
      sentVia: v.optional(v.string()),
      sentDate: v.optional(v.number()),
      notes: v.optional(v.string()),
      contact: v.optional(v.object({
        _id: v.id("contacts"),
        name: v.string(),
        contactType: v.object({
          name: v.string(),
        }),
      })),
    }),
    contributions: v.array(
      v.object({
        _id: v.id("receiptContributions"),
        fundCategory: v.object({
          _id: v.id("fundCategories"),
          name: v.string(),
        }),
        amount: v.number(),
        description: v.optional(v.string()),
      })
    ),
    template: v.object({
      _id: v.id("receiptTemplates"),
      name: v.string(),
      content: v.string(),
    }),
    createdBy: v.object({
      _id: v.id("users"),
      name: v.string(),
    }),
  }),
  handler: async (ctx, args) => {
    // Get receipt
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) {
      throw new ConvexError("Receipt not found");
    }

    // Get contributions
    const contributions = await ctx.db
      .query("receiptContributions")
      .withIndex("by_receipt", (q: any) => q.eq("receiptId", args.receiptId))
      .collect();

    // Get template
    const template = await ctx.db.get(receipt.templateId);
    if (!template) {
      throw new ConvexError("Template not found");
    }

    // Get creator
    const creator = await ctx.db.get(receipt.createdBy);
    if (!creator) {
      throw new ConvexError("Creator not found");
    }

    // Get contact information if available
    let contactInfo = undefined;
    if (receipt.contactId) {
      const contact = await ctx.db.get(receipt.contactId);
      if (contact) {
        const contactType = await ctx.db.get(contact.contactTypeId);
        contactInfo = {
          _id: contact._id,
          name: contact.name,
          contactType: {
            name: contactType?.name || "Unknown",
          },
        };
      }
    }

    // Get fund categories
    const enrichedContributions = await Promise.all(
      contributions.map(async (contribution) => {
        const fundCategory = await ctx.db.get(contribution.fundCategoryId);
        if (!fundCategory) {
          throw new ConvexError("Fund category not found");
        }
        
        return {
          _id: contribution._id,
          fundCategory: {
            _id: fundCategory._id,
            name: fundCategory.name,
          },
          amount: contribution.amount,
          description: contribution.description,
        };
      })
    );

    return {
      receipt: {
        _id: receipt._id,
        receiptId: receipt.receiptId,
        recipientName: receipt.recipientName,
        recipientEmail: receipt.recipientEmail,
        recipientPhone: receipt.recipientPhone,
        totalAmount: receipt.totalAmount,
        currency: receipt.currency,
        date: receipt.date,
        status: receipt.status,
        sentVia: receipt.sentVia,
        sentDate: receipt.sentDate,
        notes: receipt.notes,
        contact: contactInfo,
      },
      contributions: enrichedContributions,
      template: {
        _id: template._id,
        name: template.name,
        content: template.content,
      },
      createdBy: {
        _id: creator._id,
        name: creator.name,
      },
    };
  },
});

/**
 * Lists receipts for the current user's organization.
 */
export const listReceipts = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("receipts")),
  },
  returns: v.object({
    receipts: v.array(
      v.object({
        _id: v.id("receipts"),
        receiptId: v.string(),
        recipientName: v.string(),
        recipientEmail: v.optional(v.string()),
        totalAmount: v.number(),
        currency: v.string(),
        date: v.number(),
        status: v.string(),
        contactId: v.optional(v.id("contacts")),
        createdBy: v.object({
          _id: v.id("users"),
          name: v.string(),
        }),
      })
    ),
    cursor: v.optional(v.id("receipts")),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get user and organization
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || !user.organizationId) {
      throw new ConvexError("User or organization not found");
    }

    // Build query
    let baseQuery;
    
    // Filter by contact if provided
    if (args.contactId) {
      baseQuery = ctx.db
        .query("receipts")
        .withIndex("by_contact", (q: any) => 
          q.eq("contactId", args.contactId!).eq("organizationId", user.organizationId)
        );
    } else {
      baseQuery = ctx.db
        .query("receipts")
        .withIndex("by_organization", (q: any) => q.eq("organizationId", user.organizationId));
    }

    // Filter by status if provided
    let filteredQuery = args.status 
      ? baseQuery.filter((q: any) => q.eq(q.field("status"), args.status))
      : baseQuery;

    // Filter by search if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filteredQuery = filteredQuery.filter((q: any) => 
        q.or(
          q.where((doc: any) => q.includes(q.lower(doc.recipientName), searchLower)),
          q.where((doc: any) => doc.recipientEmail && q.includes(q.lower(doc.recipientEmail), searchLower)),
          q.where((doc: any) => q.includes(q.lower(doc.receiptId), searchLower))
        )
      );
    }

    // Order by date descending - apply order before pagination
    const receiptsQuery = filteredQuery.order("desc");

    // Implement cursor-based pagination
    const limit = args.limit ?? 10;
    let receiptsWithPagination = receiptsQuery;
    if (args.cursor) {
      receiptsWithPagination = receiptsQuery.filter((q: any) => 
        q.lt(q.field("_id"), args.cursor!)
      );
    }

    // Execute query
    const receipts = await receiptsWithPagination.take(limit + 1);

    // Set up next cursor
    let nextCursor;
    if (receipts.length > limit) {
      nextCursor = receipts.pop()?._id;
    }

    // Enrich with creator information
    const enrichedReceipts = await Promise.all(
      receipts.map(async (receipt) => {
        const creator = await ctx.db.get(receipt.createdBy);
        if (!creator) {
          throw new ConvexError("Creator not found");
        }
        return {
          _id: receipt._id,
          receiptId: receipt.receiptId,
          recipientName: receipt.recipientName,
          recipientEmail: receipt.recipientEmail,
          totalAmount: receipt.totalAmount,
          currency: receipt.currency,
          date: receipt.date,
          status: receipt.status,
          contactId: receipt.contactId,
          createdBy: {
            _id: creator._id,
            name: creator.name,
          },
        };
      })
    );

    return {
      receipts: enrichedReceipts,
      cursor: nextCursor,
    };
  },
});

/**
 * Marks a receipt as sent via a specific channel.
 */
export const markReceiptAsSent = mutation({
  args: {
    receiptId: v.id("receipts"),
    sentVia: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get receipt
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) {
      throw new ConvexError("Receipt not found");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Validate user is from the same organization
    if (receipt.organizationId !== user.organizationId) {
      throw new ConvexError("Unauthorized");
    }

    // Update receipt
    await ctx.db.patch(args.receiptId, {
      status: "sent",
      sentVia: args.sentVia,
      sentDate: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "send_receipt",
      resourceType: "receipt",
      resourceId: args.receiptId,
      details: `Sent via ${args.sentVia}`,
      timestamp: Date.now(),
    });

    return null;
  },
});