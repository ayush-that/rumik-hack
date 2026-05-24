import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {
        category: v.optional(v.string()),
        mode: v.optional(v.union(v.literal("all"), v.literal("celebrity"), v.literal("new"))),
        q: v.optional(v.string()),
    },
    handler: async (ctx, { category, mode, q }) => {
        const all = await ctx.db.query("counsellors").collect();
        const needle = q?.trim().toLowerCase() ?? "";
        return all.filter((c) => {
            if (category && !c.categories.includes(category)) return false;
            if (mode === "celebrity" && !c.isCelebrity) return false;
            if (mode === "new" && !c.isNew) return false;
            if (needle) {
                const haystack = [
                    c.name,
                    ...c.specialties,
                    ...c.languages,
                    ...c.categories,
                ].join(" ").toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, { slug }) => {
        return ctx.db.query("counsellors").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    },
});

// Public for hackathon convenience so we can run via `npx convex run`.
// In production this should be `internalMutation` + admin auth.
export const seed = mutation({
    args: {
        records: v.array(v.object({
            slug: v.string(), name: v.string(), portrait: v.string(),
            specialties: v.array(v.string()), languages: v.array(v.string()),
            experienceYears: v.number(), rating: v.number(), ordersCount: v.number(),
            pricePerMin: v.number(), originalPricePerMin: v.number(), waitMinutes: v.number(),
            isCelebrity: v.boolean(), isNew: v.boolean(), categories: v.array(v.string()),
            tagline: v.optional(v.string()),
            bio: v.optional(v.string()),
            signature: v.optional(v.string()),
            hometown: v.optional(v.string()),
            region: v.optional(v.string()),
            personaPrompt: v.optional(v.string()),
        })),
    },
    handler: async (ctx, { records }) => {
        for (const r of records) {
            const existing = await ctx.db.query("counsellors").withIndex("by_slug", (q) => q.eq("slug", r.slug)).first();
            if (existing) await ctx.db.patch(existing._id, r);
            else await ctx.db.insert("counsellors", r);
        }
        return records.length;
    },
});
