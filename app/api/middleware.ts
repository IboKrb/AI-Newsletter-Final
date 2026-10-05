import { ErrorMessages, isDemoUser } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Admins dürfen alles. Der Demo-Gast darf alle Admin-Abfragen lesen,
// jede Mutation (Speichern, Löschen, Workflow starten …) wird abgelehnt.
const requireAdmin = t.middleware(async (opts) => {
  const { ctx, next, type } = opts;

  if (ctx.user?.role === "admin") {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  if (isDemoUser(ctx.user)) {
    if (type === "query") return next({ ctx: { ...ctx, user: ctx.user! } });
    throw new TRPCError({ code: "FORBIDDEN", message: ErrorMessages.demoReadOnly });
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: ErrorMessages.insufficientRole,
  });
});

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = authedQuery.use(requireAdmin);
