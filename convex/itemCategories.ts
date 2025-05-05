import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Checks if item categories exist for a specific receipt type.
 */
export const checkItemCategories = async (ctx: any, user: any, receiptTypeId: string) => {
  // Check if there are already categories for this receipt type
  const existingCategories = await ctx.db
    .query("itemCategories")
    .withIndex("by_receipt_type", (q: any) => 
      q.eq("organizationId", user.organizationId).eq("receiptTypeId", receiptTypeId)
    )
    .collect();

  return existingCategories;
};

/**
 * Initialize default item categories for a specific receipt type
 */
export const initializeItemCategories = mutation({
  args: {
    receiptTypeId: v.id("receiptTypes"),
  },
  returns: v.array(v.id("itemCategories")),
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

    // Get the receipt type
    const receiptType = await ctx.db.get(args.receiptTypeId);
    if (!receiptType) {
      throw new ConvexError("Receipt type not found");
    }

    // Check if there are already categories for this receipt type
    const existingCategories = await ctx.db
      .query("itemCategories")
      .withIndex("by_receipt_type", (q) => 
        q.eq("organizationId", user.organizationId).eq("receiptTypeId", args.receiptTypeId)
      )
      .collect();

    if (existingCategories.length > 0) {
      // Categories already exist, return their IDs
      return existingCategories.map(category => category._id);
    }

    const timestamp = Date.now();
    const defaultCategories = [];
    const categoryIds = [];

    // Create type-specific default categories
    if (receiptType.name === "Donation") {
      defaultCategories.push(
        { name: "General Fund", description: "Undesignated donations to the general fund" },
        { name: "Building Fund", description: "Donations for building projects and maintenance" },
        { name: "Missions Fund", description: "Donations for missions and outreach activities" }
      );
    } else if (receiptType.name === "Sales") {
      defaultCategories.push(
        { name: "Products", description: "Physical products and goods" },
        { name: "Digital Items", description: "Digital products and downloads" },
        { name: "Shipping", description: "Shipping and handling fees" }
      );
    } else if (receiptType.name === "Service") {
      defaultCategories.push(
        { name: "Consultation", description: "Professional consultation services" },
        { name: "Labor", description: "Work and labor charges" },
        { name: "Support", description: "Support and maintenance services" }
      );
    }

    // Insert all default categories
    for (const category of defaultCategories) {
      const categoryId = await ctx.db.insert("itemCategories", {
        ...category,
        organizationId: user.organizationId,
        receiptTypeId: args.receiptTypeId,
        active: true,
        createdBy: user._id,
        createdAt: timestamp,
      });
      categoryIds.push(categoryId);
    }

    return categoryIds;
  },
});

/**
 * Lists item categories for a specific receipt type.
 */
export const listItemCategories = query({
  args: {
    receiptTypeId: v.id("receiptTypes"),
  },
  returns: v.array(
    v.object({
      _id: v.id("itemCategories"),
      name: v.string(),
      description: v.optional(v.string()),
      active: v.boolean(),
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

    // Check if categories exist
    const existingCategories = await checkItemCategories(ctx, user, args.receiptTypeId);

    // Get categories for this receipt type
    const categories = await ctx.db
      .query("itemCategories")
      .withIndex("by_receipt_type", (q) => 
        q.eq("organizationId", user.organizationId).eq("receiptTypeId", args.receiptTypeId)
      )
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    return categories.map(category => ({
      _id: category._id,
      name: category.name,
      description: category.description,
      active: category.active,
    }));
  },
});

/**
 * Searches item categories by name for a specific receipt type.
 */
export const searchItemCategories = query({
  args: {
    receiptTypeId: v.id("receiptTypes"),
    search: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("itemCategories"),
      name: v.string(),
      description: v.optional(v.string()),
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

    // Check if categories exist
    const existingCategories = await checkItemCategories(ctx, user, args.receiptTypeId);

    // Get all categories for this receipt type and organization
    const categories = await ctx.db
      .query("itemCategories")
      .withIndex("by_receipt_type", (q) => 
        q.eq("organizationId", user.organizationId).eq("receiptTypeId", args.receiptTypeId)
      )
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Filter by search term (case-insensitive)
    const searchLower = args.search.toLowerCase();
    const filtered = categories.filter(
      category => category.name.toLowerCase().includes(searchLower)
    );

    // Sort by relevance (starts with search term first, then includes)
    filtered.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      const aStartsWith = aLower.startsWith(searchLower);
      const bStartsWith = bLower.startsWith(searchLower);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return aLower.localeCompare(bLower);
    });

    // Limit results if requested
    const limit = args.limit ?? 5;
    const limitedResults = filtered.slice(0, limit);

    return limitedResults.map(category => ({
      _id: category._id,
      name: category.name,
      description: category.description,
    }));
  },
});

/**
 * Creates a new item category.
 */
export const createItemCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    receiptTypeId: v.id("receiptTypes"),
  },
  returns: v.id("itemCategories"),
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

    // Check if this category already exists (case insensitive)
    const existingCategories = await ctx.db
      .query("itemCategories")
      .withIndex("by_receipt_type", (q) => 
        q.eq("organizationId", user.organizationId).eq("receiptTypeId", args.receiptTypeId)
      )
      .collect();

    const nameLower = args.name.toLowerCase();
    const existingCategory = existingCategories.find(
      category => category.name.toLowerCase() === nameLower
    );

    if (existingCategory) {
      // If it exists but is inactive, reactivate it
      if (!existingCategory.active) {
        await ctx.db.patch(existingCategory._id, { active: true });
      }
      return existingCategory._id;
    }

    // Create new item category
    const categoryId = await ctx.db.insert("itemCategories", {
      name: args.name,
      description: args.description,
      organizationId: user.organizationId,
      receiptTypeId: args.receiptTypeId,
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "create_item_category",
      resourceType: "itemCategories",
      resourceId: categoryId,
      timestamp: Date.now(),
    });

    return categoryId;
  },
});

/**
 * Update an existing item category.
 */
export const updateItemCategory = mutation({
  args: {
    id: v.id("itemCategories"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("itemCategories"),
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

    // Get the existing category
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError("Category not found");
    }

    // Ensure this category belongs to the user's organization
    if (category.organizationId !== user.organizationId) {
      throw new ConvexError("Not authorized to modify this category");
    }

    // Update the category
    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "update_item_category",
      resourceType: "itemCategories",
      resourceId: args.id,
      timestamp: Date.now(),
    });

    return args.id;
  },
});

/**
 * Delete an item category (mark as inactive).
 */
export const deleteItemCategory = mutation({
  args: {
    id: v.id("itemCategories"),
  },
  returns: v.boolean(),
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

    // Get the existing category
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError("Category not found");
    }

    // Ensure this category belongs to the user's organization
    if (category.organizationId !== user.organizationId) {
      throw new ConvexError("Not authorized to modify this category");
    }

    // Check if the category is used in any receipts
    const receipts = await ctx.db
      .query("receiptItems")
      .filter((q) => q.eq(q.field("itemCategoryId"), args.id))
      .first();

    if (receipts) {
      // If category is used, mark as inactive instead of deleting
      await ctx.db.patch(args.id, {
        active: false,
      });
    } else {
      // If not used, we can delete it completely
      await ctx.db.delete(args.id);
    }

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "delete_item_category",
      resourceType: "itemCategories",
      resourceId: args.id,
      timestamp: Date.now(),
    });

    return true;
  },
});

/**
 * List all item categories (including inactive ones) for management.
 */
export const listAllItemCategories = query({
  args: {
    receiptTypeId: v.id("receiptTypes"),
  },
  returns: v.array(
    v.object({
      _id: v.id("itemCategories"),
      name: v.string(),
      description: v.optional(v.string()),
      active: v.boolean(),
      createdAt: v.number(),
      receiptTypeId: v.id("receiptTypes"),
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

    // Get all categories for this receipt type, including inactive ones
    const categories = await ctx.db
      .query("itemCategories")
      .withIndex("by_receipt_type", (q) => 
        q.eq("organizationId", user.organizationId).eq("receiptTypeId", args.receiptTypeId)
      )
      .collect();

    return categories.map(category => ({
      _id: category._id,
      name: category.name,
      description: category.description,
      active: category.active,
      createdAt: category.createdAt,
      receiptTypeId: category.receiptTypeId,
    }));
  },
});

/**
 * Get a specific item category by ID.
 */
export const getItemCategory = query({
  args: {
    id: v.id("itemCategories"),
  },
  returns: v.object({
    _id: v.id("itemCategories"),
    name: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    receiptTypeId: v.id("receiptTypes"),
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

    // Get the category
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError("Category not found");
    }

    // Ensure this category belongs to the user's organization
    if (category.organizationId !== user.organizationId) {
      throw new ConvexError("Not authorized to view this category");
    }

    return {
      _id: category._id,
      name: category.name,
      description: category.description,
      active: category.active,
      receiptTypeId: category.receiptTypeId,
    };
  },
});