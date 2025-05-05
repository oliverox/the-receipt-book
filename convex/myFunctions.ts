import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const listStatistics = query({
  args: {
    count: v.number(),
  },
  returns: v.object({
    viewer: v.union(v.string(), v.null()),
    receiptsCount: v.number(),
  }),
  handler: async (ctx) => {
    // Count receipts for the organization
    const identity = await ctx.auth.getUserIdentity();
    
    return {
      viewer: identity?.name ?? null,
      receiptsCount: 0, // We'll implement real counting later
    };
  },
});

/**
 * Lists fund categories for the current organization.
 */
export const listFundCategories = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("fundCategories"),
      name: v.string(),
      description: v.optional(v.string()),
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

    // Get fund categories for this organization
    const fundCategories = await ctx.db
      .query("fundCategories")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    return fundCategories.map(category => ({
      _id: category._id,
      name: category.name,
      description: category.description,
      active: category.active,
    }));
  },
});

/**
 * Searches fund categories by name for autocomplete.
 */
export const searchFundCategories = query({
  args: {
    search: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("fundCategories"),
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

    // Get all fund categories for this organization
    const fundCategories = await ctx.db
      .query("fundCategories")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Filter by search term (case-insensitive)
    const searchLower = args.search.toLowerCase();
    const filtered = fundCategories.filter(
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
 * Creates a new fund category if it doesn't exist.
 */
export const createFundCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("fundCategories"),
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

    // Check if this category already exists for this organization (case insensitive)
    const existingCategories = await ctx.db
      .query("fundCategories")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
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

    // Create new fund category
    const fundCategoryId = await ctx.db.insert("fundCategories", {
      name: args.name,
      description: args.description,
      organizationId: user.organizationId,
      createdBy: user._id,
      createdAt: Date.now(),
      active: true,
    });

    return fundCategoryId;
  },
});