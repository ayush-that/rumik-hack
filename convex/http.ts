import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { createDodoWebhookHandler } from "@dodopayments/convex";
import { internal } from "./_generated/api";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/dodo-webhook",
  method: "POST",
  handler: createDodoWebhookHandler({
    onPaymentSucceeded: async (ctx, payload) => {
      await ctx.runMutation(internal.webhooks.createPayment, {
        paymentId: payload.data.payment_id,
        businessId: payload.business_id,
        customerEmail: payload.data.customer.email,
        amount: payload.data.total_amount,
        currency: payload.data.currency,
        status: payload.data.status,
        webhookPayload: JSON.stringify(payload),
      });
    },

    onSubscriptionActive: async (ctx, payload) => {
      await ctx.runMutation(internal.webhooks.createSubscription, {
        subscriptionId: payload.data.subscription_id,
        businessId: payload.business_id,
        customerEmail: payload.data.customer.email,
        status: payload.data.status,
        webhookPayload: JSON.stringify(payload),
      });
    },
  }),
});

export default http;