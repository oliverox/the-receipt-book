import { v } from "convex/values";
import { query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Gets recent activity logs for the organization.
 */
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("activityLogs"),
      _creationTime: v.number(), // Add this field to the validator
      userId: v.id("users"),
      action: v.string(),
      resourceType: v.string(),
      resourceId: v.string(),
      details: v.optional(v.string()),
      timestamp: v.number(),
      user: v.object({
        name: v.string(),
        email: v.string(),
      }),
      resourceDetails: v.optional(v.object({})),
      organizationId: v.id("organizations"), // Add this field to the validator
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

    // Get recent activity logs
    const limit = args.limit || 10;
    const activityLogs = await ctx.db
      .query("activityLogs")
      .withIndex("by_organization", (q) => 
        q.eq("organizationId", user.organizationId)
      )
      .order("desc")
      .take(limit);

    // Fetch user information for each activity log
    const activityWithUsers = await Promise.all(
      activityLogs.map(async (activity) => {
        // Get user who performed the action
        const actionUser = await ctx.db.get(activity.userId);
        
        // Get resource details if applicable
        let resourceDetails: any = {};
        
        if (activity.resourceType === "receipt" || activity.resourceType === "receipts") {
          try {
            // First try to find by stored string ID
            const receipt = await ctx.db
              .query("receipts")
              .withIndex("by_receipt_id", (q) => q.eq("receiptId", activity.resourceId))
              .first();
            
            if (receipt) {
              resourceDetails = {
                receiptNumber: receipt.receiptId,
                recipientName: receipt.recipientName,
              };
            } else {
              // If not found, try direct lookup if it's an ID
              try {
                // Check if it looks like a Convex ID 
                if (activity.resourceId.indexOf('receipt') !== -1) {
                  // This is a type assertion to tell TypeScript this string is actually an ID
                  const receiptId = activity.resourceId as unknown as Id<"receipts">;
                  const receiptDirect = await ctx.db.get(receiptId);
                  
                  if (receiptDirect) {
                    // Cast to make TypeScript happy
                    const typedReceipt = receiptDirect as Doc<"receipts">;
                    resourceDetails = {
                      receiptNumber: typedReceipt.receiptId,
                      recipientName: typedReceipt.recipientName,
                    };
                  }
                }
              } catch (innerError) {
                // Ignore direct lookup errors
              }
            }
          } catch (error) {
            // Ignore errors
            console.error("Error fetching receipt details:", error);
          }
        } else if (activity.resourceType === "fundCategories") {
          try {
            // Check if it looks like a Convex ID
            if (activity.resourceId.indexOf('fund') !== -1) {
              // This is a type assertion to tell TypeScript this string is actually an ID
              const categoryId = activity.resourceId as unknown as Id<"fundCategories">;
              const categoryDoc = await ctx.db.get(categoryId);
              
              if (categoryDoc) {
                // Cast to make TypeScript happy
                const category = categoryDoc as Doc<"fundCategories">;
                resourceDetails = {
                  name: category.name,
                };
              }
            }
          } catch (error) {
            // Ignore errors if ID is not valid
            console.error("Error fetching fund category:", error);
          }
        }

        return {
          ...activity,
          user: {
            name: actionUser?.name || "Unknown User",
            email: actionUser?.email || "",
          },
          resourceDetails,
        };
      })
    );

    return activityWithUsers;
  },
});