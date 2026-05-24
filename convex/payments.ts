import { action } from "./_generated/server";
import { v } from "convex/values";
import { checkout } from "./dodo";

export const createCheckout = action({
    args: {
        product_cart: v.array(v.object({
            product_id: v.string(),
            quantity: v.number(),
        })),
        returnUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity()

            if (!identity) {
                throw new Error("User not logged in");
            }

            const session = await checkout(ctx, {
                payload: {
                    product_cart: args.product_cart,
                    return_url: args.returnUrl,
                    billing_currency: "USD",
                    customer: {
                        email: identity.email as string
                    }
                },
            });
            if (!session?.checkout_url) {
                throw new Error("Checkout session did not return a checkout_url");
            }
            return session;
        } catch (error) {
            console.error("Failed to create checkout session", error);
            throw new Error("Unable to create checkout session. Please try again.");
        }
    },
});