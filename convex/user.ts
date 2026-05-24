import { internalQuery, mutation } from "./_generated/server"
import { api } from "./_generated/api";
import { v } from "convex/values";

export const ensureUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) return null

        const existing = await ctx.db
            .query("users")
            .withIndex("by_authId", (q) =>
                q.eq("authId", identity.subject)
            )
            .first()

        if (existing) return existing

        const user = await ctx.runQuery(api.auth.getCurrentUser)
        if (!user) return null

        await ctx.db.insert("users", {
            authId: identity.subject,
            email: user.email,
            image: user.image ?? undefined,
            name: user.name,
            createdAt: Date.now(),
        })
        return null
    },
})

export const getByAuthId = internalQuery({
  args: { authId: v.string() },
  handler: async (ctx, { authId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", authId))
      .first();
  },
});