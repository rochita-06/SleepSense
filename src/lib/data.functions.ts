import { createServerFn } from "@tanstack/react-start";
import { getPool } from "./db.server";
import { requireAuth } from "./auth-middleware.server";

export type Profile = {
  id: string;
  name: string;
  agent_name: string;
  voice_gender: string;
  onboarded: boolean;
};

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<Profile | null> => {
    const pool = getPool();
    const res = await pool.query(
      "SELECT id, name, agent_name, voice_gender, onboarded FROM profiles WHERE id = $1",
      [context.userId],
    );
    return (res.rows[0] as Profile | undefined) ?? null;
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: { name: string; agent_name: string; voice_gender: string; onboarded: boolean }) => d)
  .handler(async ({ context, data }) => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO profiles (id, name, agent_name, voice_gender, onboarded)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         agent_name = EXCLUDED.agent_name,
         voice_gender = EXCLUDED.voice_gender,
         onboarded = EXCLUDED.onboarded,
         updated_at = now()`,
      [context.userId, data.name, data.agent_name, data.voice_gender, data.onboarded],
    );
    return { ok: true as const };
  });

export const updateProfileField = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: Partial<{ agent_name: string; voice_gender: string }>) => d)
  .handler(async ({ context, data }) => {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return { ok: true as const };
    const pool = getPool();
    const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`).join(", ");
    await pool.query(
      `UPDATE profiles SET ${setClauses}, updated_at = now() WHERE id = $1`,
      [context.userId, ...entries.map(([, v]) => v)],
    );
    return { ok: true as const };
  });

export const logActivityEvent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: { event_type: string; meta?: Record<string, unknown> }) => d)
  .handler(async ({ context, data }) => {
    const pool = getPool();
    await pool.query(
      "INSERT INTO activity_events (user_id, event_type, meta) VALUES ($1, $2, $3)",
      [context.userId, data.event_type, JSON.stringify(data.meta ?? {})],
    );
    return { ok: true as const };
  });

export type ActivityEventRow = { event_type: string; created_at: string };

// node-postgres returns TIMESTAMPTZ columns as native Date objects, not
// strings — a plain `as ActivityEventRow[]` cast doesn't convert them, it
// just tells TypeScript to trust us. Without this, client code that calls
// string methods on created_at (e.g. .startsWith) crashes at runtime once
// real rows come back, even though everything type-checks fine.
function toActivityEventRow(row: { event_type: string; created_at: unknown }): ActivityEventRow {
  return {
    event_type: row.event_type,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export const listActivityEvents = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((d: { sinceIso?: string; limit?: number } = {}) => d)
  .handler(async ({ context, data }): Promise<ActivityEventRow[]> => {
    const pool = getPool();
    const limit = data.limit ?? 500;
    if (data.sinceIso) {
      const res = await pool.query(
        `SELECT event_type, created_at FROM activity_events
         WHERE user_id = $1 AND created_at >= $2
         ORDER BY created_at DESC LIMIT $3`,
        [context.userId, data.sinceIso, limit],
      );
      return res.rows.map(toActivityEventRow);
    }
    const res = await pool.query(
      `SELECT event_type, created_at FROM activity_events
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [context.userId, limit],
    );
    return res.rows.map(toActivityEventRow);
  });
