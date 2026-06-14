import { authRouter } from "./auth-router";
import { newsletterRouter } from "./newsletter-router";
import { workflowRouter } from "./workflow-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  newsletter: newsletterRouter,
  workflow: workflowRouter,
});

export type AppRouter = typeof appRouter;
