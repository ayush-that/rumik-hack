import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import authConfig from "./auth.config";

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
    const siteUrl = process.env.BETTER_AUTH_URL ?? process.env.SITE_URL;
    const secret = process.env.BETTER_AUTH_SECRET;

    if (!siteUrl) {
        throw new Error("Missing BETTER_AUTH_URL or SITE_URL in Convex environment variables.");
    }

    if (!secret) {
        throw new Error("Missing BETTER_AUTH_SECRET in Convex environment variables.");
    }

    return betterAuth({
        baseURL: siteUrl,
        secret,
        database: authComponent.adapter(ctx),
        emailAndPassword: {
            enabled: true,
        },
        plugins: [
            // The Convex plugin is required for Convex compatibility
            convex({ authConfig }),
        ],
    })
}

export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return authComponent.safeGetAuthUser(ctx);
    },
});
