import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./auth/session";
import { findUserById } from "./queries/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const session = await authenticateRequest(opts.req.headers);
    if (session) {
      const user = await findUserById(session.userId);
      if (user) {
        ctx.user = user;
      }
    }
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
