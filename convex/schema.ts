import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        authId: v.string(),
        dodoCustomerId: v.optional(v.string()),
        image: v.optional(v.string()),
        createdAt: v.number()
    }).index("by_authId", ["authId"])
})