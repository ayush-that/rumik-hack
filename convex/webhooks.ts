import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createPayment = internalMutation({
    args: {
        paymentId: v.string(),
        businessId: v.string(),
        customerEmail: v.string(),
        amount: v.number(),
        currency: v.string(),
        status: v.nullable(v.string()),
        webhookPayload: v.string(),
    },
    handler: async () => {
        // Handle your after payment logic here
        // (sending email, giving access to users)
        return null;
    }
})

export const createSubscription = internalMutation({
    args: {
        subscriptionId: v.string(),
        businessId: v.string(),
        customerEmail: v.string(),
        status: v.nullable(v.string()),
        webhookPayload: v.string(),
    },
    handler: async () => {
        // Handle your after subscription start logic here 
        // (sending email, giving access to users)
        return null;
    }
})
