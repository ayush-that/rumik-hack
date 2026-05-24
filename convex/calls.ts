import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
        .query("users")
        .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
        .first();
    if (!user) throw new Error("User row missing — call ensureUser first");
    return user;
}

export const start = mutation({
    args: { counsellorSlug: v.string() },
    handler: async (ctx, { counsellorSlug }) => {
        const user = await requireUser(ctx);
        const counsellor = await ctx.db
            .query("counsellors")
            .withIndex("by_slug", (q) => q.eq("slug", counsellorSlug))
            .first();
        if (!counsellor) throw new Error("Counsellor not found");
        const callId = await ctx.db.insert("calls", {
            userId: user._id,
            counsellorSlug: counsellor.slug,
            counsellorName: counsellor.name,
            counsellorPortrait: counsellor.portrait,
            startedAt: Date.now(),
        });
        return callId;
    },
});

export const appendTurn = mutation({
    args: {
        callId: v.id("calls"),
        role: v.union(v.literal("user"), v.literal("bot")),
        text: v.string(),
    },
    handler: async (ctx, { callId, role, text }) => {
        const user = await requireUser(ctx);
        const call = await ctx.db.get(callId);
        if (!call || call.userId !== user._id) throw new Error("Call not found");
        await ctx.db.insert("callTurns", {
            callId,
            role,
            text,
            ts: Date.now(),
        });
        return null;
    },
});

export const end = mutation({
    args: { callId: v.id("calls") },
    handler: async (ctx, { callId }) => {
        const user = await requireUser(ctx);
        const call = await ctx.db.get(callId);
        if (!call || call.userId !== user._id) return null;
        if (call.endedAt) return null;
        const endedAt = Date.now();
        await ctx.db.patch(callId, {
            endedAt,
            durationSec: Math.max(0, Math.round((endedAt - call.startedAt) / 1000)),
        });
        return null;
    },
});

export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await ctx.db
            .query("users")
            .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
            .first();
        if (!user) return [];
        return await ctx.db
            .query("calls")
            .withIndex("by_userId_startedAt", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(100);
    },
});

export const getMine = query({
    args: { callId: v.id("calls") },
    handler: async (ctx, { callId }) => {
        const user = await requireUser(ctx);
        const call = await ctx.db.get(callId);
        if (!call || call.userId !== user._id) return null;
        const turns = await ctx.db
            .query("callTurns")
            .withIndex("by_callId_ts", (q) => q.eq("callId", callId))
            .order("asc")
            .collect();
        return { call, turns };
    },
});
