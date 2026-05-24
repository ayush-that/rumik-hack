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
        // Onboarding / astrology profile
        displayName: v.optional(v.string()),
        gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
        birthDate: v.optional(v.string()), // YYYY-MM-DD
        birthTime: v.optional(v.string()), // HH:MM (24h) or empty/undefined if unknown
        birthTimeUnknown: v.optional(v.boolean()),
        birthPlace: v.optional(v.string()),
        profileImageStorageId: v.optional(v.id("_storage")),
        onboardedAt: v.optional(v.number()),
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
        tagline: v.optional(v.string()),
        bio: v.optional(v.string()),
        signature: v.optional(v.string()),
        hometown: v.optional(v.string()),
        region: v.optional(v.string()),
        personaPrompt: v.optional(v.string()),
    }).index("by_slug", ["slug"]),

    calls: defineTable({
        userId: v.id("users"),
        counsellorSlug: v.string(),
        counsellorName: v.string(),
        counsellorPortrait: v.string(),
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
        durationSec: v.optional(v.number()),
    }).index("by_userId_startedAt", ["userId", "startedAt"]),

    callTurns: defineTable({
        callId: v.id("calls"),
        role: v.union(v.literal("user"), v.literal("bot")),
        text: v.string(),
        ts: v.number(),
    }).index("by_callId_ts", ["callId", "ts"]),
});
