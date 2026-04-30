import { supabase } from './supabase';

// ─── Inscription ──────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  university: string,
  program: string,
  level: string,
  username: string
) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  if (data.user) {
    await supabase.from('profiles').upsert({
      id:            data.user.id,
      email,
      full_name:     fullName,
      university,
      program,
      level,
      username,
      streak_days:   0,
      last_activity: null,
    })
  }
  return data
}

// ─── Connexion ────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─── Déconnexion ──────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─── Mot de passe oublié ──────────────────────────────────────
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  })
  if (error) throw error
}

// ─── Récupérer l'utilisateur connecté ────────────────────────
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ─── Récupérer le profil complet ──────────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

// ─── Mettre à jour le profil ──────────────────────────────────
export async function updateProfile(userId: string, updates: any) {
  const { error } = await supabase
    .from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

// ─── Valider la force du mot de passe (côté client) ──────────
export function validatePassword(password: string): string | null {
  if (password.length < 8)      return 'Le mot de passe doit contenir au moins 8 caractères'
  if (!/[A-Z]/.test(password))  return 'Le mot de passe doit contenir au moins une majuscule'
  if (!/[a-z]/.test(password))  return 'Le mot de passe doit contenir au moins une minuscule'
  if (!/[0-9]/.test(password))  return 'Le mot de passe doit contenir au moins un chiffre'
  return null
}