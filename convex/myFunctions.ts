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

