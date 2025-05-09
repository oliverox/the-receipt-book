import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Checks if default receipt types exist for an organization.
 */
export const getDefaultReceiptTypes = async (ctx: any, user: any) => {
  // Check if organization already has receipt types
  const existingTypes = await ctx.db
    .query("receiptTypes")
    .withIndex("by_organization", (q: any) => q.eq("organizationId", user.organizationId))
    .collect();

  return existingTypes;
};

/**
 * Creates default receipt types for an organization.
 */
export const initializeDefaultReceiptTypes = mutation({
  args: {},
  returns: v.array(v.id("receiptTypes")),
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

    // Check if receipt types already exist
    const existingTypes = await ctx.db
      .query("receiptTypes")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    if (existingTypes.length > 0) {
      // Default types already exist
      return existingTypes.map(type => type._id);
    }

    // Create default receipt types
    const timestamp = Date.now();
    const defaultTypes = [
      {
        name: "Donation",
        description: "Receipts for donations and contributions",
        isDefault: true,
        active: true,
      },
      {
        name: "Sales",
        description: "Receipts for goods and products sold",
        isDefault: true,
        active: true,
      },
      {
        name: "Service",
        description: "Receipts for services rendered",
        isDefault: true,
        active: true,
      },
    ];

    const typeIds = [];
    
    for (const type of defaultTypes) {
      const typeId = await ctx.db.insert("receiptTypes", {
        ...type,
        organizationId: user.organizationId,
        createdBy: user._id,
        createdAt: timestamp,
      });
      typeIds.push(typeId);
    }
    
    return typeIds;
  },
});

/**
 * List receipt types for the current organization.
 */
export const listReceiptTypes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("receiptTypes"),
      name: v.string(),
      description: v.optional(v.string()),
      isDefault: v.boolean(),
      active: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        // Return empty array instead of throwing
        return [];
      }

      // Get user
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first(); // Use first() instead of unique() to avoid errors

      if (!user || !user.organizationId) {
        // Return empty array instead of throwing
        return [];
      }

      // Check if we have receipt types
      const receiptTypes = await getDefaultReceiptTypes(ctx, user);

      // If we don't have any receipt types, return an empty array
      if (receiptTypes.length === 0) {
        return [];
      }

      // Return existing receipt types
      return receiptTypes
        .filter((type: { active: boolean }) => type.active)
        .map((type: {
          _id: any;
          name: string;
          description?: string;
          isDefault: boolean;
          active: boolean
        }) => ({
          _id: type._id,
          name: type.name,
          description: type.description || "",  // Provide empty string as fallback
          isDefault: type.isDefault,
          active: type.active,
        }));
    } catch (error) {
      console.error("Error listing receipt types:", error);
      // Return empty array instead of crashing
      return [];
    }
  },
});

/**
 * Create a new receipt type.
 */
export const createReceiptType = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("receiptTypes"),
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

    // Check if this type already exists (case insensitive)
    const existingTypes = await ctx.db
      .query("receiptTypes")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    const nameLower = args.name.toLowerCase();
    const existingType = existingTypes.find(
      type => type.name.toLowerCase() === nameLower
    );

    if (existingType) {
      // If it exists but is inactive, reactivate it
      if (!existingType.active) {
        await ctx.db.patch(existingType._id, { active: true });
      }
      return existingType._id;
    }

    // Create new receipt type
    const receiptTypeId = await ctx.db.insert("receiptTypes", {
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
      action: "create_receipt_type",
      resourceType: "receiptTypes",
      resourceId: receiptTypeId,
      timestamp: Date.now(),
    });

    return receiptTypeId;
  },
});