import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Checks if default receipt templates exist for an organization.
 */
export const checkDefaultTemplates = async (ctx: any, user: any) => {
  // Check if organization already has templates
  const existingTemplates = await ctx.db
    .query("receiptTemplates")
    .withIndex("by_organization", (q: any) => q.eq("organizationId", user.organizationId))
    .collect();

  return existingTemplates;
};

/**
 * Initializes default receipt templates for each receipt type.
 */
export const initializeDefaultTemplates = mutation({
  args: {},
  returns: v.array(v.id("receiptTemplates")),
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

    // Check if templates already exist
    const existingTemplates = await ctx.db
      .query("receiptTemplates")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    if (existingTemplates.length > 0) {
      // Templates already exist
      return existingTemplates.map(template => template._id);
    }

    // Get receipt types
    const receiptTypes = await ctx.db
      .query("receiptTypes")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    if (receiptTypes.length === 0) {
      // No receipt types to create templates for
      return [];
    }

    // Create default templates
    const timestamp = Date.now();
    const templateIds = [];

    for (const type of receiptTypes) {
      // Create a template based on receipt type
      let templateContent = "";
      let templateName = "";
      
      if (type.name === "Donation") {
        templateName = "Default Donation Receipt";
        templateContent = JSON.stringify({
          title: "DONATION RECEIPT",
          showTaxDeductible: true,
          taxDeductibleText: "This contribution is tax-deductible to the extent allowed by law.",
          footerText: "Thank you for your generous contribution!",
          signatureTitle: "Treasurer"
        });
      } else if (type.name === "Sales") {
        templateName = "Default Sales Receipt";
        templateContent = JSON.stringify({
          title: "SALES RECEIPT",
          showTaxBreakdown: true,
          taxRate: 0.05,
          returnsPolicy: "Returns accepted within 30 days with original receipt.",
          footerText: "Thank you for your purchase!",
          signatureTitle: "Sales Manager"
        });
      } else if (type.name === "Service") {
        templateName = "Default Service Receipt";
        templateContent = JSON.stringify({
          title: "SERVICE RECEIPT",
          showServiceDetails: true,
          warrantyText: "Services guaranteed for 90 days from date of receipt.",
          footerText: "Thank you for your business!",
          signatureTitle: "Service Manager"
        });
      } else {
        // Generic template for custom receipt types
        templateName = `Default ${type.name} Receipt`;
        templateContent = JSON.stringify({
          title: `${type.name.toUpperCase()} RECEIPT`,
          customText: "",
          footerText: "Thank you!",
          signatureTitle: "Manager"
        });
      }
      
      // Create the template
      const templateId = await ctx.db.insert("receiptTemplates", {
        name: templateName,
        organizationId: user.organizationId,
        receiptTypeId: type._id,
        content: templateContent,
        isDefault: true,
        createdBy: user._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      
      templateIds.push(templateId);
    }
    
    return templateIds;
  },
});

/**
 * List receipt templates for a specific receipt type.
 */
export const listTemplatesByType = query({
  args: {
    receiptTypeId: v.id("receiptTypes"),
  },
  returns: v.array(
    v.object({
      _id: v.id("receiptTemplates"),
      name: v.string(),
      content: v.string(),
      isDefault: v.boolean(),
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

    // Get templates for this receipt type
    const templates = await ctx.db
      .query("receiptTemplates")
      .withIndex("by_receipt_type", (q) => 
        q.eq("organizationId", user.organizationId).eq("receiptTypeId", args.receiptTypeId)
      )
      .collect();

    // If we have no templates, return empty array
    // The client will call initializeDefaultTemplates
    if (templates.length === 0) {
      return [];
    }

    return templates.map(template => ({
      _id: template._id,
      name: template.name,
      content: template.content,
      isDefault: template.isDefault,
    }));
  },
});

/**
 * Create a new receipt template.
 */
export const createTemplate = mutation({
  args: {
    name: v.string(),
    content: v.string(),
    receiptTypeId: v.id("receiptTypes"),
  },
  returns: v.id("receiptTemplates"),
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

    // Create new template
    const timestamp = Date.now();
    const templateId = await ctx.db.insert("receiptTemplates", {
      name: args.name,
      organizationId: user.organizationId,
      receiptTypeId: args.receiptTypeId,
      content: args.content,
      isDefault: false,
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: user.organizationId,
      userId: user._id,
      action: "create_template",
      resourceType: "receiptTemplates",
      resourceId: templateId,
      timestamp,
    });

    return templateId;
  },
});