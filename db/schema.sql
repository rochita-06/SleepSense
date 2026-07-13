-- SleepSense schema for Neon Postgres.
-- Run this once against your Neon database before using the app:
-- open the Neon SQL Editor (or `psql "$DATABASE_URL" -f db/schema.sql`) and run it.
--
-- This replaces Supabase's auth.users + Row Level Security with a plain
-- `users` table and app-level authorization (every query in
-- src/lib/*.functions.ts is scoped to the userId taken from the verified JWT).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  voice_gender TEXT NOT NULL DEFAULT 'female' CHECK (voice_gender IN ('male', 'female')),
  agent_name TEXT NOT NULL DEFAULT 'Nova',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_events_user_time ON activity_events (user_id, created_at DESC);
