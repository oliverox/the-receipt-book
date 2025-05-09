import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getDefaultReceiptTypes } from "./receiptTypes";
import { checkItemCategories } from "./itemCategories";

/**
 * Generates a new receipt ID based on the organization's counter and format.
 */
const generateReceiptId = async (ctx: any, organizationId: string, receiptType: any) => {
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
  let format = settings?.receiptNumberingFormat || "{PREFIX}-{YEAR}-{NUMBER}";

  // Always prioritize the user-defined receipt prefix from settings
  // Only fall back to receipt type-based prefixes if no prefix is set in settings
  let prefix = "RCP";

  if (settings?.receiptPrefix) {
    // Use the user-defined prefix from settings if available
    prefix = settings.receiptPrefix;
  } else if (receiptType) {
    // Fall back to using the first 3 letters of receipt type name
    prefix = receiptType.name.substring(0, 3).toUpperCase();
  }

  const year = new Date().getFullYear();
  const paddedCounter = newCounter.toString().padStart(4, "0");
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

  // Replace placeholders
  return format
    .replace("{PREFIX}", prefix)
    .replace("{YEAR}", year.toString())
    .replace("{MONTH}", month)
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
    address: recipientData.address, // Include address if provided
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
    receiptTypeId: v.id("receiptTypes"),
    recipientName: v.string(),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    address: v.optional(v.string()), // Added address field for contact creation
    contactId: v.optional(v.id("contacts")), // Optional - can be provided if contact is known
    totalAmount: v.number(),
    currency: v.string(),
    date: v.number(),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        itemCategoryId: v.id("itemCategories"),
        name: v.optional(v.string()),
        quantity: v.optional(v.number()),
        unitPrice: v.optional(v.number()),
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

    // Check if we have receipt types
    const receiptTypes = await getDefaultReceiptTypes(ctx, user);
    if (receiptTypes.length === 0) {
      throw new ConvexError("No receipt types available. Please initialize receipt types first.");
    }

    // Get receipt type
    const receiptType = await ctx.db.get(args.receiptTypeId);
    if (!receiptType) {
      throw new ConvexError("Receipt type not found");
    }

    // Check if categories exist for this receipt type
    const categories = await checkItemCategories(ctx, user, args.receiptTypeId);
    if (categories.length === 0) {
      throw new ConvexError("No item categories available. Please initialize categories first.");
    }

    // For sales receipts, check if tax should be applied
    let subtotalAmount = 0;
    let taxAmount = 0;
    let taxPercentage = 0;
    let taxName = "";
    
    // Get the sum of all items
    const totalItems = args.items.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    
    // Get organization settings for tax settings
    const orgSettings = await ctx.db
      .query("organizationSettings")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .unique();
      
    // Apply sales tax if this is a sales receipt and tax is enabled
    if (receiptType.name === "Sales" && 
        orgSettings?.salesTaxSettings?.enabled === true) {
      
      subtotalAmount = totalItems;
      taxPercentage = orgSettings.salesTaxSettings.percentage;
      taxName = orgSettings.salesTaxSettings.name;
      taxAmount = Math.round(subtotalAmount * (taxPercentage / 100) * 100) / 100; // Round to 2 decimal places
      
      // Check if the total matches the subtotal + tax
      if (Math.abs((subtotalAmount + taxAmount) - args.totalAmount) > 0.01) {
        throw new ConvexError(
          "For sales receipts with tax, total amount must equal subtotal plus tax"
        );
      }
    } else {
      // For non-sales receipts or sales without tax, validate total equals sum of items
      if (totalItems !== args.totalAmount) {
        throw new ConvexError(
          "Sum of items must equal total amount"
        );
      }
    }

    // Find or create contact
    let contactId = args.contactId;
    if (!contactId) {
      // If contact ID not provided, find or create one
      contactId = await findOrCreateContact(ctx, user, args);
    }

    // Generate receipt ID
    const receiptId = await generateReceiptId(ctx, user.organizationId, receiptType);

    // Create receipt
    const receiptData: any = {
      receiptId,
      organizationId: user.organizationId,
      createdBy: user._id,
      templateId: args.templateId,
      receiptTypeId: args.receiptTypeId,
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
    };
    
    // Add tax information for sales receipts with tax
    if (receiptType.name === "Sales" && 
        orgSettings?.salesTaxSettings?.enabled === true) {
      receiptData.subtotalAmount = subtotalAmount;
      receiptData.taxAmount = taxAmount;
      receiptData.taxPercentage = taxPercentage;
      receiptData.taxName = taxName;
    }
    
    const newReceiptId = await ctx.db.insert("receipts", receiptData);

    // Create receipt items
    for (const item of args.items) {
      await ctx.db.insert("receiptItems", {
        receiptId: newReceiptId,
        itemCategoryId: item.itemCategoryId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        description: item.description,
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
      subtotalAmount: v.optional(v.number()),
      taxAmount: v.optional(v.number()),
      taxPercentage: v.optional(v.number()),
      taxName: v.optional(v.string()),
      taxDisabled: v.optional(v.boolean()),
      currency: v.string(),
      date: v.number(),
      status: v.string(),
      sentVia: v.optional(v.string()),
      sentDate: v.optional(v.number()),
      notes: v.optional(v.string()),
      receiptType: v.object({
        _id: v.id("receiptTypes"),
        name: v.string(),
      }),
      contact: v.optional(v.object({
        _id: v.id("contacts"),
        name: v.string(),
        contactType: v.object({
          name: v.string(),
        }),
      })),
    }),
    items: v.array(
      v.object({
        _id: v.id("receiptItems"),
        itemCategory: v.object({
          _id: v.id("itemCategories"),
          name: v.string(),
        }),
        name: v.optional(v.string()),
        quantity: v.optional(v.number()),
        unitPrice: v.optional(v.number()),
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

    // Get receipt type
    const receiptType = await ctx.db.get(receipt.receiptTypeId);
    if (!receiptType) {
      throw new ConvexError("Receipt type not found");
    }

    // Get items
    const items = await ctx.db
      .query("receiptItems")
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

    // Get item categories
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const itemCategory = await ctx.db.get(item.itemCategoryId);
        if (!itemCategory) {
          throw new ConvexError("Item category not found");
        }
        
        return {
          _id: item._id,
          itemCategory: {
            _id: itemCategory._id,
            name: itemCategory.name,
          },
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          description: item.description,
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
        receiptType: {
          _id: receiptType._id,
          name: receiptType.name,
        },
        contact: contactInfo,
      },
      items: enrichedItems,
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
    receiptTypeId: v.optional(v.id("receiptTypes")),
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
        receiptType: v.object({
          _id: v.id("receiptTypes"),
          name: v.string(),
        }),
        createdBy: v.object({
          _id: v.id("users"),
          name: v.string(),
        }),
      })
    ),
    cursor: v.optional(v.id("receipts")),
  }),
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        // Return empty results instead of throwing when not authenticated
        return { receipts: [], cursor: undefined };
      }

      // Get user and organization
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user || !user.organizationId) {
        // Return empty results if user or org not found
        return { receipts: [], cursor: undefined };
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
      }
      // Filter by receipt type if provided
      else if (args.receiptTypeId) {
        baseQuery = ctx.db
          .query("receipts")
          .withIndex("by_receipt_type", (q: any) =>
            q.eq("organizationId", user.organizationId).eq("receiptTypeId", args.receiptTypeId!)
          );
      }
      // Otherwise, get all receipts for the organization
      else {
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

      // If no receipts found, return empty array early
      if (receipts.length === 0) {
        return { receipts: [], cursor: undefined };
      }

      // Enrich with creator and receipt type information
      const enrichedReceipts = await Promise.all(
        receipts.map(async (receipt) => {
          // Handle missing creator gracefully
          let creator;
          try {
            creator = await ctx.db.get(receipt.createdBy);
          } catch (e) {
            console.error("Error getting creator:", e);
          }

          // Handle missing receipt type gracefully
          let receiptType;
          try {
            receiptType = await ctx.db.get(receipt.receiptTypeId);
          } catch (e) {
            console.error("Error getting receipt type:", e);
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
            receiptType: receiptType
              ? { _id: receiptType._id, name: receiptType.name }
              : { _id: receipt.receiptTypeId, name: "Unknown" },
            createdBy: creator
              ? { _id: creator._id, name: creator.name }
              : { _id: receipt.createdBy, name: "Unknown" },
          };
        })
      );

      return {
        receipts: enrichedReceipts,
        cursor: nextCursor,
      };
    } catch (error) {
      console.error("Error in listReceipts:", error);
      // Return empty result set instead of throwing
      return { receipts: [], cursor: undefined };
    }
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