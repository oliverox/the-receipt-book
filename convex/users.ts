import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Lists users in the current organization.
 */
export const listOrganizationUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      role: v.string(),
      active: v.boolean(),
      lastLogin: v.optional(v.number()),
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

    // Check if admin
    if (user.role !== "admin") {
      throw new ConvexError("Only admins can view organization users");
    }

    // Get users
    const users = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => 
        q.eq("organizationId", user.organizationId)
      )
      .collect();

    return users.map((orgUser) => ({
      _id: orgUser._id,
      name: orgUser.name,
      email: orgUser.email,
      role: orgUser.role,
      active: orgUser.active,
      lastLogin: orgUser.lastLogin,
    }));
  },
});

/**
 * Invites a user to the organization.
 * Note: In a real implementation, this would generate an email invite.
 * For this example, we'll just create the user directly.
 */
export const inviteUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || !currentUser.organizationId) {
      throw new ConvexError("User or organization not found");
    }

    // Check if admin
    if (currentUser.role !== "admin") {
      throw new ConvexError("Only admins can invite users");
    }

    // Check if user already exists in the system
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser && existingUser.organizationId === currentUser.organizationId) {
      return {
        success: false,
        message: "User already exists in your organization",
      };
    }

    // Determine permissions based on role
    let permissions: string[] = [];
    if (args.role === "admin") {
      permissions = ["manage_receipts", "manage_settings", "manage_users"];
    } else if (args.role === "member") {
      permissions = ["manage_receipts"];
    }

    // In a real implementation, we would send an invite email here
    // For this example, we'll create the user directly 
    // (normally the user would be created when they accept the invite)
    await ctx.db.insert("users", {
      clerkId: `temp_${Date.now()}`, // In reality, this would be set when they accept the invite
      name: args.name,
      email: args.email,
      organizationId: currentUser.organizationId,
      role: args.role,
      permissions,
      active: true,
      lastLogin: undefined, // Use undefined instead of null for optional number
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "invite_user",
      resourceType: "user",
      resourceId: args.email,
      details: `Invited with role ${args.role}`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `Invitation sent to ${args.email}`,
    };
  },
});

/**
 * Updates a user's role.
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || !currentUser.organizationId) {
      throw new ConvexError("User or organization not found");
    }

    // Check if admin
    if (currentUser.role !== "admin") {
      throw new ConvexError("Only admins can update user roles");
    }

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError("Target user not found");
    }

    // Check if user is in the same organization
    if (targetUser.organizationId !== currentUser.organizationId) {
      throw new ConvexError("User is not in your organization");
    }

    // Prevent users from changing their own role
    if (targetUser._id === currentUser._id) {
      throw new ConvexError("You cannot change your own role");
    }

    // Determine permissions based on role
    let permissions: string[] = [];
    if (args.role === "admin") {
      permissions = ["manage_receipts", "manage_settings", "manage_users"];
    } else if (args.role === "member") {
      permissions = ["manage_receipts"];
    }

    // Update user
    await ctx.db.patch(args.userId, {
      role: args.role,
      permissions,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "update_user_role",
      resourceType: "user",
      resourceId: args.userId,
      details: `Updated role to ${args.role}`,
      timestamp: Date.now(),
    });

    return null;
  },
});

/**
 * Deactivates a user.
 */
export const deactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || !currentUser.organizationId) {
      throw new ConvexError("User or organization not found");
    }

    // Check if admin
    if (currentUser.role !== "admin") {
      throw new ConvexError("Only admins can deactivate users");
    }

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError("Target user not found");
    }

    // Check if user is in the same organization
    if (targetUser.organizationId !== currentUser.organizationId) {
      throw new ConvexError("User is not in your organization");
    }

    // Prevent users from deactivating themselves
    if (targetUser._id === currentUser._id) {
      throw new ConvexError("You cannot deactivate yourself");
    }

    // Deactivate user
    await ctx.db.patch(args.userId, {
      active: false,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "deactivate_user",
      resourceType: "user",
      resourceId: args.userId,
      timestamp: Date.now(),
    });

    return null;
  },
});