import { getSupabase } from "@/lib/supabase"
import type { SupabaseClient, Session } from "@supabase/supabase-js"

// Shared Supabase client built on top of the existing helper.
const supabase = getSupabase()

export function getSupabaseClient(): SupabaseClient {
  return supabase
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error("Erro ao obter sessao do Supabase:", error)
    return null
  }
  return data.session
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export { supabase }
