import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Gets organization settings.
 */
export const getOrganizationSettings = query({
  args: {},
  returns: v.object({
    _id: v.id("organizationSettings"),
    emailSettings: v.optional(
      v.object({
        senderName: v.string(),
        senderEmail: v.string(),
        defaultSubject: v.string(),
        defaultMessage: v.string(),
      })
    ),
    contactInfo: v.optional(
      v.object({
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
      })
    ),
    currencySettings: v.optional(
      v.object({
        code: v.string(),
        symbol: v.string(),
      })
    ),
    whatsappIntegration: v.optional(
      v.object({
        enabled: v.boolean(),
        apiKey: v.string(),
      })
    ),
    receiptNumberingFormat: v.optional(v.string()),
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

    // Get settings
    const settings = await ctx.db
      .query("organizationSettings")
      .withIndex("by_organization", (q) => 
        q.eq("organizationId", user.organizationId)
      )
      .unique();

    if (!settings) {
      // If settings don't exist, we can't create them in a query
      // We'll return a friendly error message
      throw new ConvexError(
        "Organization settings not found. Please reload the page or contact support."
      );
    }

    return {
      _id: settings._id,
      emailSettings: settings.emailSettings,
      contactInfo: settings.contactInfo,
      currencySettings: settings.currencySettings,
      whatsappIntegration: settings.whatsappIntegration,
      receiptNumberingFormat: settings.receiptNumberingFormat,
    };
  },
});

/**
 * Creates default settings for an organization.
 * This is a mutation that can be called when settings are missing.
 */
export const createDefaultSettings = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    settingsId: v.optional(v.id("organizationSettings")),
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

    // Check if settings already exist
    const existingSettings = await ctx.db
      .query("organizationSettings")
      .withIndex("by_organization", (q) => 
        q.eq("organizationId", user.organizationId)
      )
      .unique();

    if (existingSettings) {
      return {
        success: true,
        settingsId: existingSettings._id,
      };
    }

    // Create default settings for the organization
    const settingsId = await ctx.db.insert("organizationSettings", {
      organizationId: user.organizationId,
      emailSettings: {
        senderName: "Your Organization",
        senderEmail: user.email || "",
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

    return {
      success: true,
      settingsId,
    };
  },
});

/**
 * Updates organization settings.
 */
export const updateOrganizationSettings = mutation({
  args: {
    emailSettings: v.optional(
      v.object({
        senderName: v.string(),
        senderEmail: v.string(),
        defaultSubject: v.string(),
        defaultMessage: v.string(),
      })
    ),
    contactInfo: v.optional(
      v.object({
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
      })
    ),
    currencySettings: v.optional(
      v.object({
        code: v.string(),
        symbol: v.string(),
      })
    ),
    whatsappIntegration: v.optional(
      v.object({
        enabled: v.boolean(),
        apiKey: v.string(),
      })
    ),
    receiptNumberingFormat: v.optional(v.string()),
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

    // Verify user has admin role
    if (user.role !== "admin") {
      throw new ConvexError("Only admins can update organization settings");
    }

    // Get settings
    const settings = await ctx.db
      .query("organizationSettings")
      .withIndex("by_organization", (q) => 
        q.eq("organizationId", user.organizationId)
      )
      .unique();

    // If settings don't exist, create them now
    if (!settings) {
      // Create default settings for the organization
      const settingsId = await ctx.db.insert("organizationSettings", {
        organizationId: user.organizationId,
        emailSettings: args.emailSettings || {
          senderName: "Your Organization",
          senderEmail: user.email || "",
          defaultSubject: "Your Receipt",
          defaultMessage: "Thank you for your contribution!",
        },
        contactInfo: args.contactInfo || {
          phone: "",
          address: "",
        },
        currencySettings: args.currencySettings || {
          code: "USD",
          symbol: "$",
        },
        receiptNumberingFormat: args.receiptNumberingFormat || "{PREFIX}-{YEAR}-{NUMBER}",
        whatsappIntegration: args.whatsappIntegration,
        updatedBy: user._id,
        updatedAt: Date.now(),
      });

      // Log activity
      await ctx.db.insert("activityLogs", {
        organizationId: user.organizationId,
        userId: user._id,
        action: "create_settings",
        resourceType: "organizationSettings",
        resourceId: settingsId,
        timestamp: Date.now(),
      });

      return {
        success: true,
      };
    }

    // Update settings
    const updates: any = {
      updatedBy: user._id,
      updatedAt: Date.now(),
    };

    if (args.emailSettings) {
      updates.emailSettings = args.emailSettings;
    }

    if (args.contactInfo) {
      updates.contactInfo = args.contactInfo;
    }

    if (args.currencySettings) {
      updates.currencySettings = args.currencySettings;
    }

    if (args.whatsappIntegration) {
      updates.whatsappIntegration = args.whatsappIntegration;
    }

    if (args.receiptNumberingFormat) {
      updates.receiptNumberingFormat = args.receiptNumberingFormat;
    }

    await ctx.db.patch(settings._id, updates);

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "update_settings",
      resourceType: "organizationSettings",
      resourceId: settings._id,
      timestamp: Date.now(),
    });

    return {
      success: true,
    };
  },
});

/**
 * Updates organization profile.
 */
export const updateOrganizationProfile = mutation({
  args: {
    name: v.optional(v.string()),
    logo: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
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

    // Verify user has admin role
    if (user.role !== "admin") {
      throw new ConvexError("Only admins can update organization profile");
    }

    // Get organization
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) {
      throw new ConvexError("Organization not found");
    }

    // Update organization
    const updates: any = {};

    if (args.name) {
      updates.name = args.name;
    }

    if (args.logo !== undefined) {
      updates.logo = args.logo;
    }

    if (args.primaryColor) {
      updates.primaryColor = args.primaryColor;
    }

    await ctx.db.patch(user.organizationId, updates);

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "update_organization",
      resourceType: "organization",
      resourceId: user.organizationId,
      timestamp: Date.now(),
    });

    return {
      success: true,
    };
  },
});

/**
 * Lists fund categories for the organization.
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

    // Get categories
    const categories = await ctx.db
      .query("fundCategories")
      .withIndex("by_organization", (q) => 
        q.eq("organizationId", user.organizationId)
      )
      .collect();

    return categories.map((category) => ({
      _id: category._id,
      name: category.name,
      description: category.description,
      active: category.active,
    }));
  },
});

/**
 * Creates a new fund category.
 */
export const createFundCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.object({
    categoryId: v.id("fundCategories"),
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

    // Create category
    const categoryId = await ctx.db.insert("fundCategories", {
      name: args.name,
      description: args.description,
      organizationId: user.organizationId,
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "create_fund_category",
      resourceType: "fundCategories",
      resourceId: categoryId,
      timestamp: Date.now(),
    });

    return {
      categoryId,
    };
  },
});

/**
 * Lists receipt templates for the organization.
 */
export const listReceiptTemplates = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("receiptTemplates"),
      name: v.string(),
      isDefault: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
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

    // Get templates
    const templates = await ctx.db
      .query("receiptTemplates")
      .withIndex("by_organization", (q) => 
        q.eq("organizationId", user.organizationId)
      )
      .collect();

    return templates.map((template) => ({
      _id: template._id,
      name: template.name,
      isDefault: template.isDefault,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));
  },
});