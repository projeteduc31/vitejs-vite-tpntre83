import { supabase } from './supabase';

// ── Universités depuis Supabase ──────────────────────────────
export async function getUniversities() {
  const { data } = await supabase
    .from('universities')
    .select('*')
    .order('name');
  return data || [];
}

// ── Facultés d'une université ────────────────────────────────
export async function getFaculties(universityId?: string) {
  let query = supabase.from('faculties').select('*').order('name');
  if (universityId) query = query.eq('university_id', universityId);
  const { data } = await query;
  return data || [];
}

// ── Filières d'une faculté ───────────────────────────────────
export async function getPrograms(facultyId?: string) {
  let query = supabase.from('programs').select('*').order('name');
  if (facultyId) query = query.eq('faculty_id', facultyId);
  const { data } = await query;
  return data || [];
}
