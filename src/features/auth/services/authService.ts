import { supabase } from "@/shared/services/supabaseClient"
import type { ApprovalStatus, Profile, UserRole } from "@/shared/types/auth"

export interface RegisterPayload {
  email: string
  password: string
  fullName?: string
  role?: UserRole
  documento?: string
  tipo_documento?: "cpf" | "cnpj"
  telefone?: string
  endereco?: string
}

export async function signUpWithEmail({
  email,
  password,
  fullName,
  documento,
  tipo_documento,
  telefone,
  endereco,
}: RegisterPayload) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName ?? "",
        tipo_documento: tipo_documento ?? "",
        documento: documento ?? "",
        telefone: telefone ?? "",
        endereco: endereco ?? "",
      },
    },
  })

  if (error) throw error
  return data
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao carregar perfil", error)
    return null
  }
  return data as Profile | null
}
