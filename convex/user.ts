import { internalQuery, mutation, query } from "./_generated/server"
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

export const getProfile = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await ctx.db
            .query("users")
            .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
            .first();
        if (!user) return null;
        const onboarded = Boolean(user.onboardedAt && user.gender && user.birthDate && user.birthPlace);
        const profileImageUrl = user.profileImageStorageId
            ? await ctx.storage.getUrl(user.profileImageStorageId)
            : user.image ?? null;
        return {
            displayName: user.displayName ?? user.name,
            gender: user.gender ?? null,
            birthDate: user.birthDate ?? null,
            birthTime: user.birthTime ?? null,
            birthTimeUnknown: user.birthTimeUnknown ?? false,
            birthPlace: user.birthPlace ?? null,
            profileImageUrl,
            onboarded,
        };
    },
});

export const generateProfileUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        return await ctx.storage.generateUploadUrl();
    },
});

export const saveProfile = mutation({
    args: {
        displayName: v.string(),
        gender: v.union(v.literal("male"), v.literal("female")),
        birthDate: v.string(),
        birthTime: v.optional(v.string()),
        birthTimeUnknown: v.boolean(),
        birthPlace: v.string(),
        profileImageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const user = await ctx.db
            .query("users")
            .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
            .first();
        if (!user) throw new Error("User row missing — sync first");

        // If replacing the profile picture, delete the old blob to avoid orphans.
        if (
            args.profileImageStorageId &&
            user.profileImageStorageId &&
            user.profileImageStorageId !== args.profileImageStorageId
        ) {
            try {
                await ctx.storage.delete(user.profileImageStorageId);
            } catch (e) {
                console.warn("failed to delete old profile image", e);
            }
        }

        await ctx.db.patch(user._id, {
            displayName: args.displayName,
            gender: args.gender,
            birthDate: args.birthDate,
            birthTime: args.birthTimeUnknown ? undefined : args.birthTime,
            birthTimeUnknown: args.birthTimeUnknown,
            birthPlace: args.birthPlace,
            profileImageStorageId: args.profileImageStorageId ?? user.profileImageStorageId,
            onboardedAt: Date.now(),
        });
        return null;
    },
});