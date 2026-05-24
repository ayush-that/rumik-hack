import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import dodopayments from "@dodopayments/convex/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(dodopayments);

export default app;