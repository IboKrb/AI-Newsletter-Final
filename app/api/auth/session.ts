import * as jose from "jose";
import { env } from "../lib/env";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { findUserById } from "../queries/users";

const JWT_ALG = "HS256";

export type SessionPayload = {
  userId: number;
  username: string;
  role: string;
};

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(env.sessionSecret);
  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }
  try {
    const secret = new TextEncoder().encode(env.sessionSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { userId, username, role } = payload;
    if (!userId || !username) {
      return null;
    }
    return { userId: Number(userId), username: username as string, role: (role as string) ?? "user" };
  } catch (error) {
    console.warn("[session] JWT verification failed:", error);
    return null;
  }
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    return null;
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    return null;
  }
  const user = await findUserById(claim.userId);
  if (!user) {
    return null;
  }
  return { userId: user.id, username: user.username, role: user.role };
}
