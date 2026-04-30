import { createClient } from '@supabase/supabase-js';

// ─── Connexion à ton projet Supabase ─────────────────────────
const SUPABASE_URL = 'https://glrhwcxunxsqkmlbrojn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eFyPT6nRnW0frgg7dV4Lpw_K-cmSCMX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Types des tables ─────────────────────────────────────────

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  faculty: string | null;
  program: string | null;
  level: string | null;
  semester: string | null;
  streak_days: number;
  last_activity: string | null;
  created_at: string;
};

export type QuizSession = {
  id: string;
  user_id: string;
  subject_id: string;
  subject_name: string;
  score: number;
  total: number;
  skipped: number;
  duration_sec: number;
  played_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
};
