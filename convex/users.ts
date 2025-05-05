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
      title: v.optional(v.string()),
      active: v.boolean(),
      lastLogin: v.optional(v.number()),
      status: v.optional(v.string()),
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
      title: orgUser.title,
      active: orgUser.active,
      lastLogin: orgUser.lastLogin,
      status: orgUser.status || (orgUser.active ? "Active" : "Inactive"),
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
    title: v.optional(v.string()),
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

    // Get organization to check subscription tier
    const organization = await ctx.db.get(currentUser.organizationId);
    if (!organization) {
      throw new ConvexError("Organization not found");
    }

    // Only check quota for non-viewer roles
    if (args.role !== "viewer") {
      // Check current team size (excluding viewers)
      const existingUsers = await ctx.db
        .query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
        .collect();

      // Count only members and admins towards quota
      const teamMembersCount = existingUsers.filter(user => user.role === "admin" || user.role === "member").length;

      // Define limits based on subscription tier
      const tierLimits = {
        starter: 3,
        professional: 10,
        enterprise: 100, // Enterprise tier with higher limit
      };

      const currentTier = organization.subscriptionTier || "starter";
      const maxTeamSize = (currentTier in tierLimits) 
        ? tierLimits[currentTier as keyof typeof tierLimits] 
        : tierLimits.starter;

      if (teamMembersCount >= maxTeamSize) {
        return {
          success: false,
          message: `Your ${currentTier} plan allows a maximum of ${maxTeamSize} team members. Please upgrade your subscription to add more team members.`,
        };
      }
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

    // Validate role
    if (args.role !== "admin" && args.role !== "member" && args.role !== "viewer") {
      return {
        success: false,
        message: "Invalid role. Role must be 'admin', 'member', or 'viewer'.",
      };
    }

    // Determine permissions based on role
    let permissions: string[] = [];
    if (args.role === "admin") {
      permissions = ["manage_receipts", "manage_settings", "manage_users", "view_receipts", "view_contacts", "view_reports"];
    } else if (args.role === "member") {
      permissions = ["manage_receipts", "view_receipts", "view_contacts", "view_reports"];
    } else if (args.role === "viewer") {
      permissions = ["view_receipts", "view_contacts", "view_reports"];
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
      title: args.title,
      permissions,
      active: true,
      status: "Invited",
      lastLogin: undefined, // Use undefined instead of null for optional number
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "invite_user",
      resourceType: "user",
      resourceId: args.email,
      details: `Invited with role ${args.role}${args.title ? ` and title ${args.title}` : ''}`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `Invitation sent to ${args.email}`,
    };
  },
});

/**
 * Updates a user's role and title.
 */
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    role: v.optional(v.string()),
    title: v.optional(v.string()),
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
      throw new ConvexError("Only admins can update user profiles");
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
    if (targetUser._id === currentUser._id && args.role) {
      throw new ConvexError("You cannot change your own role");
    }

    // Validate role if provided
    if (args.role && args.role !== "admin" && args.role !== "member" && args.role !== "viewer") {
      throw new ConvexError("Invalid role. Role must be 'admin', 'member', or 'viewer'.");
    }

    // Build update object
    const updates: Record<string, any> = {};
    
    if (args.role) {
      // Determine permissions based on role
      let permissions: string[] = [];
      if (args.role === "admin") {
        permissions = ["manage_receipts", "manage_settings", "manage_users", "view_receipts", "view_contacts", "view_reports"];
      } else if (args.role === "member") {
        permissions = ["manage_receipts", "view_receipts", "view_contacts", "view_reports"];
      } else if (args.role === "viewer") {
        permissions = ["view_receipts", "view_contacts", "view_reports"];
      }
      
      updates.role = args.role;
      updates.permissions = permissions;
    }
    
    if (args.title !== undefined) {
      updates.title = args.title;
    }

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return null;
    }

    // Update user
    await ctx.db.patch(args.userId, updates);

    // Log activity
    const details = [];
    if (args.role) details.push(`role to ${args.role}`);
    if (args.title !== undefined) details.push(`title to ${args.title || "none"}`);
    
    await ctx.db.insert("activityLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "update_user_profile",
      resourceType: "user",
      resourceId: args.userId,
      details: `Updated user: ${details.join(", ")}`,
      timestamp: Date.now(),
    });

    return null;
  },
});

/**
 * Gets subscription information for the organization.
 */
export const getTeamSubscriptionInfo = query({
  args: {},
  returns: v.object({
    currentTier: v.string(),
    maxTeamSize: v.number(),
    currentTeamSize: v.number(),
    totalUsers: v.number(),
    viewerCount: v.number(),
    canAddMoreMembers: v.boolean(),
    canAlwaysAddViewers: v.boolean(),
  }),
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

    // Get organization
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) {
      throw new ConvexError("Organization not found");
    }

    // Get team members
    const teamMembers = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Define limits based on subscription tier
    const tierLimits = {
      starter: 3,
      professional: 10,
      enterprise: 100,
    };

    const currentTier = organization.subscriptionTier || "starter";
    const maxTeamSize = (currentTier in tierLimits) 
      ? tierLimits[currentTier as keyof typeof tierLimits] 
      : tierLimits.starter;

    // Count only admin and member roles towards the team size limit
    const currentTeamSize = teamMembers.filter(
      member => member.role === "admin" || member.role === "member"
    ).length;
    
    const viewerCount = teamMembers.filter(member => member.role === "viewer").length;
    const totalUsers = teamMembers.length;
    
    const canAddMoreMembers = currentTeamSize < maxTeamSize;
    // Viewers can always be added, regardless of team size limits
    const canAlwaysAddViewers = true;

    return {
      currentTier,
      maxTeamSize,
      currentTeamSize,
      totalUsers,
      viewerCount,
      canAddMoreMembers,
      canAlwaysAddViewers,
    };
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
      status: "Inactive",
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