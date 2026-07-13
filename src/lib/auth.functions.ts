import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { getPool } from "./db.server";
import { signToken } from "./jwt.server";
import { requireAuth } from "./auth-middleware.server";

type AuthResult = { token: string; user: { id: string; email: string } };

export const signUp = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string; name: string }) => d)
  .handler(async ({ data }): Promise<AuthResult> => {
    const email = data.email.trim().toLowerCase();
    if (!email || !data.password) throw new Error("Email and password are required");
    if (data.password.length < 6) throw new Error("Password must be at least 6 characters");

    const pool = getPool();
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) throw new Error("An account with this email already exists");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userRes = await client.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
        [email, passwordHash],
      );
      const user = userRes.rows[0] as { id: string; email: string };
      await client.query("INSERT INTO profiles (id, name) VALUES ($1, $2)", [
        user.id,
        data.name?.trim() || "",
      ]);
      await client.query("COMMIT");
      return { token: signToken({ sub: user.id, email: user.email }), user };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

export const signIn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }): Promise<AuthResult> => {
    const email = data.email.trim().toLowerCase();
    const pool = getPool();
    const res = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email],
    );
    const user = res.rows[0] as { id: string; email: string; password_hash: string } | undefined;
    if (!user) throw new Error("Invalid email or password");

    const ok = await bcrypt.compare(data.password, user.password_hash);
    if (!ok) throw new Error("Invalid email or password");

    return {
      token: signToken({ sub: user.id, email: user.email }),
      user: { id: user.id, email: user.email },
    };
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return { id: context.userId, email: context.email };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const pool = getPool();
    // profiles and activity_events cascade-delete via FK ON DELETE CASCADE.
    await pool.query("DELETE FROM users WHERE id = $1", [context.userId]);
    return { ok: true as const };
  });
