import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Gets or creates a user based on their Clerk authentication.
 */
export const getOrCreateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  returns: v.object({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const userId = identity.subject;
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .unique();

    if (existingUser) {
      return {
        userId: existingUser._id,
        organizationId: existingUser.organizationId,
      };
    }

    // If not, create a new user without an organization
    // Create a placeholder organization first
    const tempOrgId = await ctx.db.insert("organizations", {
      name: "Temp Organization",
      subscriptionTier: "starter",
      receiptCounter: 0,
      active: true,
      createdAt: Date.now(),
    });
    
    // Then create the user with the organization reference
    const newUserId = await ctx.db.insert("users", {
      clerkId: userId,
      name: args.name,
      email: args.email,
      organizationId: tempOrgId,
      role: "admin", // First user is an admin
      permissions: ["manage_receipts", "manage_settings", "manage_users"],
      active: true,
      lastLogin: Date.now(),
    });

    return {
      userId: newUserId,
      organizationId: tempOrgId,
    };
  },
});

/**
 * Creates an organization and adds the current user to it.
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
  },
  returns: v.object({
    organizationId: v.id("organizations"),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const userId = identity.subject;
    
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Create the organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      subscriptionTier: "starter", // Default tier
      receiptCounter: 0,
      active: true,
      createdAt: Date.now(),
    });

    // Update the user to be part of this organization
    await ctx.db.patch(user._id, {
      organizationId,
    });

    // Create default settings for the organization
    try {
      await ctx.db.insert("organizationSettings", {
        organizationId,
        emailSettings: {
          senderName: args.name,
          senderEmail: user.email,
          defaultSubject: "Your Receipt",
          defaultMessage: "Thank you for your contribution!",
        },
        contactInfo: {
          phone: "",
          address: "",
        },
        currencySettings: {
          code: "USD",
          symbol: "$"
        },
        receiptNumberingFormat: "{PREFIX}-{YEAR}-{NUMBER}",
        updatedBy: user._id,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error creating default settings:", error);
      // Continue anyway, we can create them later if needed
    }

    // Create a default fund category
    await ctx.db.insert("fundCategories", {
      name: "General",
      description: "General purpose fund",
      organizationId,
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // Create a default receipt type (Donation)
    const donationTypeId = await ctx.db.insert("receiptTypes", {
      name: "Donation",
      description: "Receipts for donations and contributions",
      organizationId,
      isDefault: true,
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // Create a default receipt template
    await ctx.db.insert("receiptTemplates", {
      name: "Default Template",
      organizationId,
      receiptTypeId: donationTypeId,
      content: JSON.stringify({
        header: "{{organization.name}}",
        body: "Receipt for {{recipient.name}}",
        footer: "Thank you for your contribution!"
      }),
      isDefault: true,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      organizationId,
    };
  },
});

/**
 * Gets the current user profile information.
 */
export const getUserProfile = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      role: v.string(),
      organizationId: v.optional(v.id("organizations")),
      organization: v.optional(v.object({
        _id: v.id("organizations"),
        name: v.string(),
        subscriptionTier: v.optional(v.string()),
      }))
    })
  ),
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        // Return null instead of throwing an error
        // This allows the client to handle auth state gracefully
        return null;
      }

      const userId = identity.subject;

      // Get user
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
        .first(); // Use first() instead of unique() to avoid throwing errors

      if (!user) {
        // Return null instead of throwing an error
        return null;
      }

      // Get organization if it exists
      let organization;
      if (user.organizationId) {
        organization = await ctx.db.get(user.organizationId);
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organization: organization ? {
          _id: organization._id,
          name: organization.name,
          subscriptionTier: organization.subscriptionTier,
        } : undefined,
      };
    } catch (error) {
      // Log the error but don't throw to prevent client crashes
      console.error("Error in getUserProfile:", error);
      return null;
    }
  },
});