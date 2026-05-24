import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        authId: v.string(),
        dodoCustomerId: v.optional(v.string()),
        image: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_authId", ["authId"]),

    counsellors: defineTable({
        slug: v.string(),
        name: v.string(),
        portrait: v.string(),
        specialties: v.array(v.string()),
        languages: v.array(v.string()),
        experienceYears: v.number(),
        rating: v.number(),
        ordersCount: v.number(),
        pricePerMin: v.number(),
        originalPricePerMin: v.number(),
        waitMinutes: v.number(),
        isCelebrity: v.boolean(),
        isNew: v.boolean(),
        categories: v.array(v.string()),
    }).index("by_slug", ["slug"]),
});
