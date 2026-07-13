// Server-only JWT helpers for the app's own auth (replaces Supabase Auth).
import jwt from "jsonwebtoken";

export type AppJwtPayload = { sub: string; email: string };

function getSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing AUTH_JWT_SECRET environment variable. Add it to .env (see README).",
    );
  }
  return secret;
}

export function signToken(payload: AppJwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): AppJwtPayload {
  try {
    return jwt.verify(token, getSecret()) as AppJwtPayload & { iat: number; exp: number };
  } catch {
    throw new Error("Unauthorized: invalid or expired session");
  }
}
