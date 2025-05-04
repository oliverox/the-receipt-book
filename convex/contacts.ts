import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Creates default contact types for a new organization.
 */
export const createDefaultContactTypes = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    success: v.boolean(),
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

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.organizationId !== args.organizationId && user.role !== "admin") {
      throw new ConvexError("Unauthorized");
    }

    // Check if there are already contact types for this organization
    const existingTypes = await ctx.db
      .query("contactTypes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    if (existingTypes.length > 0) {
      return { success: true }; // Already have default types
    }

    // Create default contact types
    const defaultTypes = [
      { name: "Individual", description: "Individual person", isDefault: true },
      { name: "Institution", description: "Organizations, companies, etc.", isDefault: true },
      { name: "Foundation", description: "Charitable foundation or trust", isDefault: true },
    ];

    const timestamp = Date.now();

    for (const type of defaultTypes) {
      await ctx.db.insert("contactTypes", {
        name: type.name,
        description: type.description,
        organizationId: args.organizationId,
        isDefault: type.isDefault,
        active: true,
        createdBy: user._id,
        createdAt: timestamp,
      });
    }

    return { success: true };
  },
});

/**
 * Creates a new contact type.
 */
export const createContactType = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    contactTypeId: v.optional(v.id("contactTypes")),
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

    // Check if a contact type with this name already exists
    const existingType = await ctx.db
      .query("contactTypes")
      .withIndex("by_name_and_org", (q) => 
        q.eq("name", args.name).eq("organizationId", user.organizationId)
      )
      .first();

    if (existingType) {
      throw new ConvexError(`Contact type "${args.name}" already exists`);
    }

    // Create contact type
    const contactTypeId = await ctx.db.insert("contactTypes", {
      name: args.name,
      description: args.description,
      organizationId: user.organizationId,
      isDefault: false,
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "create_contact_type",
      resourceType: "contactTypes",
      resourceId: contactTypeId,
      timestamp: Date.now(),
    });

    return {
      success: true,
      contactTypeId,
    };
  },
});

/**
 * Lists all contact types for the organization.
 */
export const listContactTypes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("contactTypes"),
      name: v.string(),
      description: v.optional(v.string()),
      isDefault: v.boolean(),
      active: v.boolean(),
    })
  ),
  handler: async (ctx) => {
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

    // Get contact types
    const contactTypes = await ctx.db
      .query("contactTypes")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    return contactTypes.map((type) => ({
      _id: type._id,
      name: type.name,
      description: type.description,
      isDefault: type.isDefault,
      active: type.active,
    }));
  },
});

/**
 * Creates a new contact.
 */
export const createContact = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    contactTypeId: v.id("contactTypes"),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    contactId: v.optional(v.id("contacts")),
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

    // Check if contact type exists and belongs to organization
    const contactType = await ctx.db.get(args.contactTypeId);
    if (!contactType || contactType.organizationId !== user.organizationId) {
      throw new ConvexError("Invalid contact type");
    }

    // Check if contact with this email already exists (if email provided)
    if (args.email) {
      const existingContact = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => 
          q.eq("email", args.email!).eq("organizationId", user.organizationId)
        )
        .first();

      if (existingContact) {
        throw new ConvexError(`Contact with email "${args.email}" already exists`);
      }
    }

    const timestamp = Date.now();

    // Create contact
    const contactId = await ctx.db.insert("contacts", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      contactTypeId: args.contactTypeId,
      notes: args.notes,
      organizationId: user.organizationId,
      totalContributions: 0, // Starting value
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

    return {
      success: true,
      contactId,
    };
  },
});

/**
 * Updates a contact.
 */
export const updateContact = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    contactTypeId: v.optional(v.id("contactTypes")),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
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

    // Get contact
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.organizationId !== user.organizationId) {
      throw new ConvexError("Contact not found or access denied");
    }

    // Check if contact type exists and belongs to organization (if provided)
    if (args.contactTypeId) {
      const contactType = await ctx.db.get(args.contactTypeId);
      if (!contactType || contactType.organizationId !== user.organizationId) {
        throw new ConvexError("Invalid contact type");
      }
    }

    // Update fields
    const updateFields: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateFields.name = args.name;
    if (args.email !== undefined) updateFields.email = args.email;
    if (args.phone !== undefined) updateFields.phone = args.phone;
    if (args.address !== undefined) updateFields.address = args.address;
    if (args.contactTypeId !== undefined) updateFields.contactTypeId = args.contactTypeId;
    if (args.notes !== undefined) updateFields.notes = args.notes;

    // Update contact
    await ctx.db.patch(args.contactId, updateFields);

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "update_contact",
      resourceType: "contacts",
      resourceId: args.contactId,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Lists contacts with pagination.
 */
export const listContacts = query({
  args: {
    search: v.optional(v.string()),
    contactTypeId: v.optional(v.id("contactTypes")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("contacts")),
  },
  returns: v.object({
    contacts: v.array(
      v.object({
        _id: v.id("contacts"),
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        contactType: v.object({
          _id: v.id("contactTypes"),
          name: v.string(),
        }),
        totalContributions: v.number(),
        lastReceiptDate: v.optional(v.number()),
      })
    ),
    cursor: v.optional(v.id("contacts")),
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

    // Base query for organization's contacts
    let contactsQuery;
    
    // Filter by contact type if provided
    if (args.contactTypeId) {
      contactsQuery = ctx.db
        .query("contacts")
        .withIndex("by_contact_type", (q) => 
          q.eq("contactTypeId", args.contactTypeId!).eq("organizationId", user.organizationId)
        )
        .filter((q) => q.eq(q.field("active"), true));
    } else {
      contactsQuery = ctx.db
        .query("contacts")
        .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
        .filter((q) => q.eq(q.field("active"), true));
    }

    // Order by most recent receipt
    contactsQuery = contactsQuery.order("desc");

    // Apply search filter if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      const searchResults = await contactsQuery.collect();
      
      // Manually filter the results in memory
      const filteredResults = searchResults.filter(doc => {
        const nameMatch = doc.name.toLowerCase().includes(searchLower);
        const emailMatch = doc.email ? doc.email.toLowerCase().includes(searchLower) : false;
        return nameMatch || emailMatch;
      });
      
      // Manually implement cursor-based pagination if needed
      let paginatedResults = filteredResults;
      if (args.cursor) {
        const cursorIndex = filteredResults.findIndex(c => c._id === args.cursor);
        if (cursorIndex !== -1) {
          paginatedResults = filteredResults.slice(cursorIndex + 1);
        }
      }
      
      // Apply limit
      const limit = args.limit || 10;
      let contacts = paginatedResults.slice(0, limit + 1);
      
      // Prepare cursor for next page
      let nextCursor;
      if (contacts.length > limit) {
        nextCursor = contacts[limit - 1]?._id;
        contacts = contacts.slice(0, limit);
      }
      
      // Enrich with contact type information
      const enrichedContacts = await Promise.all(
        contacts.map(async (contact) => {
          const contactType = await ctx.db.get(contact.contactTypeId);
          return {
            _id: contact._id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            contactType: {
              _id: contactType!._id,
              name: contactType!.name,
            },
            totalContributions: contact.totalContributions,
            lastReceiptDate: contact.lastReceiptDate,
          };
        })
      );
      
      return {
        contacts: enrichedContacts,
        cursor: nextCursor,
      };
    } else {
      // Apply cursor if provided
      if (args.cursor) {
        contactsQuery = contactsQuery.filter((q) => q.lt(q.field("_id"), args.cursor!));
      }
  
      // Set limit
      const limit = args.limit || 10;
      const contacts = await contactsQuery.take(limit + 1);
  
      // Prepare cursor for next page
      let nextCursor;
      if (contacts.length > limit) {
        nextCursor = contacts.pop()?._id;
      }
  
      // Enrich with contact type information
      const enrichedContacts = await Promise.all(
        contacts.map(async (contact) => {
          const contactType = await ctx.db.get(contact.contactTypeId);
          return {
            _id: contact._id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            contactType: {
              _id: contactType!._id,
              name: contactType!.name,
            },
            totalContributions: contact.totalContributions,
            lastReceiptDate: contact.lastReceiptDate,
          };
        })
      );
  
      return {
        contacts: enrichedContacts,
        cursor: nextCursor,
      };
    }
  },
});

/**
 * Gets a contact by ID.
 */
export const getContact = query({
  args: {
    contactId: v.id("contacts"),
  },
  returns: v.object({
    _id: v.id("contacts"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    contactType: v.object({
      _id: v.id("contactTypes"),
      name: v.string(),
    }),
    notes: v.optional(v.string()),
    totalContributions: v.number(),
    lastReceiptDate: v.optional(v.number()),
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

    // Get contact
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.organizationId !== user.organizationId) {
      throw new ConvexError("Contact not found or access denied");
    }

    // Get contact type
    const contactType = await ctx.db.get(contact.contactTypeId);
    if (!contactType) {
      throw new ConvexError("Contact type not found");
    }

    return {
      _id: contact._id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      contactType: {
        _id: contactType._id,
        name: contactType.name,
      },
      notes: contact.notes,
      totalContributions: contact.totalContributions,
      lastReceiptDate: contact.lastReceiptDate,
    };
  },
});

/**
 * Searches contacts for autocomplete.
 */
export const searchContacts = query({
  args: {
    search: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("contacts"),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      contactType: v.object({
        _id: v.id("contactTypes"),
        name: v.string(),
      }),
    })
  ),
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

    // Get all contacts for the organization
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Search by name or email
    const searchLower = args.search.toLowerCase();
    const limit = args.limit || 5;
    
    // Filter the contacts in memory
    const matchingContacts = allContacts
      .filter(contact => {
        const nameMatch = contact.name.toLowerCase().includes(searchLower);
        const emailMatch = contact.email ? 
          contact.email.toLowerCase().includes(searchLower) : 
          false;
        return nameMatch || emailMatch;
      })
      .slice(0, limit);

    // Enrich with contact type information
    const enrichedContacts = await Promise.all(
      matchingContacts.map(async (contact) => {
        const contactType = await ctx.db.get(contact.contactTypeId);
        return {
          _id: contact._id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          contactType: {
            _id: contactType!._id,
            name: contactType!.name,
          },
        };
      })
    );

    return enrichedContacts;
  },
});