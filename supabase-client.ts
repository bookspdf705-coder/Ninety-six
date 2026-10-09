import { createClient } from "@supabase/supabase-js";

// This URL and key are meant to be public — Supabase's actual security
// boundary is the row-level security policies on each table and storage
// bucket (see supabase/migration.sql), not secrecy of this key.
// Env vars override these if you'd rather not hardcode them.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eelrvhdrqzmrvzgjjgif.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_6S74K8aECHRsEJq-DHDxsw_5YdSe5FG";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
