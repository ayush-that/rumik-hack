import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function requireUserKey(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthorized");
    }
    return identity.tokenIdentifier;
}

function cleanText(value: string, maxLength: number) {
    return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export const getSession = query({
    args: { counsellorSlug: v.string() },
    handler: async (ctx, { counsellorSlug }) => {
        const userKey = await requireUserKey(ctx);

        const profile = await ctx.db
            .query("chatProfiles")
            .withIndex("by_userKey_and_counsellorSlug", (q) =>
                q.eq("userKey", userKey).eq("counsellorSlug", counsellorSlug)
            )
            .first();

        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_userKey_and_counsellorSlug_and_createdAt", (q) =>
                q.eq("userKey", userKey).eq("counsellorSlug", counsellorSlug)
            )
            .order("asc")
            .take(80);

        return { profile, messages };
    },
});

export const saveProfile = mutation({
    args: {
        counsellorSlug: v.string(),
        name: v.string(),
        dob: v.string(),
        birthPlace: v.string(),
        birthTime: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userKey = await requireUserKey(ctx);
        const now = Date.now();
        const birthTime = args.birthTime ? cleanText(args.birthTime, 32) : "";
        const profile = {
            name: cleanText(args.name, 80),
            dob: cleanText(args.dob, 32),
            birthPlace: cleanText(args.birthPlace, 140),
            updatedAt: now,
            ...(birthTime ? { birthTime } : {}),
        };

        if (!profile.name || !profile.dob || !profile.birthPlace) {
            throw new Error("Name, date of birth, and birth place are required.");
        }

        const existing = await ctx.db
            .query("chatProfiles")
            .withIndex("by_userKey_and_counsellorSlug", (q) =>
                q.eq("userKey", userKey).eq("counsellorSlug", args.counsellorSlug)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, profile);
            return existing._id;
        }

        return await ctx.db.insert("chatProfiles", {
            userKey,
            counsellorSlug: args.counsellorSlug,
            ...profile,
            createdAt: now,
        });
    },
});

export const listSessions = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const userKey = identity.tokenIdentifier;

        // Pull recent messages for this user across all counsellors and fold
        // them into one summary per counsellor (most recent first).
        const recent = await ctx.db
            .query("chatMessages")
            .withIndex("by_userKey_and_counsellorSlug_and_createdAt", (q) =>
                q.eq("userKey", userKey)
            )
            .order("desc")
            .take(500);

        const seen = new Map<string, {
            counsellorSlug: string;
            lastMessage: string;
            lastRole: "user" | "assistant";
            lastAt: number;
            messageCount: number;
        }>();

        for (const m of recent) {
            const existing = seen.get(m.counsellorSlug);
            if (existing) {
                existing.messageCount += 1;
            } else {
                seen.set(m.counsellorSlug, {
                    counsellorSlug: m.counsellorSlug,
                    lastMessage: m.content,
                    lastRole: m.role,
                    lastAt: m.createdAt,
                    messageCount: 1,
                });
            }
        }

        return Array.from(seen.values()).sort((a, b) => b.lastAt - a.lastAt);
    },
});

export const appendMessage = mutation({
    args: {
        counsellorSlug: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const userKey = await requireUserKey(ctx);
        const content = args.content.trim().slice(0, 4000);
        if (!content) {
            throw new Error("Message cannot be empty.");
        }

        return await ctx.db.insert("chatMessages", {
            userKey,
            counsellorSlug: args.counsellorSlug,
            role: args.role,
            content,
            createdAt: Date.now(),
        });
    },
});
