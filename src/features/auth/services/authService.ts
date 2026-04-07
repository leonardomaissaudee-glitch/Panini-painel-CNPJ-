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

function normalizeApprovalStatus(status?: string | null): ApprovalStatus {
  if (status === "approved" || status === "aprovado") {
    return "approved"
  }

  if (status === "rejected" || status === "reprovado") {
    return "rejected"
  }

  if (status === "blocked" || status === "bloqueado") {
    return "blocked"
  }

  return "pending"
}

function normalizeRole(role?: string | null): UserRole {
  if (role === "admin" || role === "seller" || role === "client") {
    return role
  }

  return "client"
}

function formatEmailDisplayName(email?: string | null) {
  if (!email) return null
  const localPart = email.split("@")[0]?.trim()
  if (!localPart) return null

  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function mergeApprovalStatus(...statuses: Array<string | null | undefined>): ApprovalStatus {
  const normalized = statuses.map(normalizeApprovalStatus)

  if (normalized.includes("blocked")) return "blocked"
  if (normalized.includes("rejected")) return "rejected"
  if (normalized.includes("approved")) return "approved"
  return "pending"
}

function buildResellerProfile(row: any): Profile {
  return {
    id: row.id,
    auth_user_id: row.user_id,
    full_name: row.razao_social || row.nome_responsavel || "Razão social não informada",
    email: row.email,
    role: "client",
    user_type: "cliente",
    company_name: row.razao_social || null,
    status_cadastro: normalizeApprovalStatus(row.status_cadastro),
    tipo_documento: "cnpj",
    documento: row.cnpj,
    telefone: row.telefone,
    endereco: {
      cep: row.cep,
      endereco: row.endereco,
      numero: row.numero,
      complemento: row.complemento,
      bairro: row.bairro,
      cidade: row.cidade,
      estado: row.estado,
    },
    motivo_reprovacao: row.motivo_reprovacao ?? null,
    account_manager_user_id: row.account_manager_user_id ?? null,
    account_manager_name: row.account_manager_name ?? null,
    account_manager_email: row.account_manager_email ?? null,
    account_manager_whatsapp: row.account_manager_whatsapp ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function fetchProfile(userId: string, email?: string | null): Promise<Profile | null> {
  const { data: legacyById, error: legacyError } = await supabase
    .from("profiles")
    .select("*")
    .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle()

  if (legacyError) {
    console.error("Erro ao carregar perfil legado", legacyError)
    return null
  }

  let legacyProfile = legacyById

  if (!legacyProfile && email) {
    const { data: legacyByEmail } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    legacyProfile = legacyByEmail
  }

  const { data: resellerProfile, error: resellerError } = await supabase
    .from("reseller_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (resellerError) {
    console.error("Erro ao carregar perfil empresarial", resellerError)
  }

  if (legacyProfile?.role === "admin" || legacyProfile?.role === "seller") {
    return {
      ...(legacyProfile as Profile),
      full_name:
        legacyProfile.full_name ||
        legacyProfile.company_name ||
        formatEmailDisplayName(legacyProfile.email) ||
        "Usuário sem nome",
      role: normalizeRole(legacyProfile.role),
      status_cadastro: normalizeApprovalStatus(legacyProfile.status_cadastro),
    }
  }

  if (resellerProfile) {
    const mapped = buildResellerProfile(resellerProfile)

    if (legacyProfile?.role === "client") {
      return {
        ...mapped,
        id: legacyProfile.id ?? mapped.id,
        auth_user_id: legacyProfile.auth_user_id ?? mapped.auth_user_id,
        status_cadastro: mergeApprovalStatus(resellerProfile.status_cadastro, legacyProfile.status_cadastro),
        motivo_reprovacao:
          resellerProfile.motivo_reprovacao ?? legacyProfile.motivo_reprovacao ?? null,
      }
    }

    return mapped
  }

  return (legacyProfile as Profile | null) ?? null
}
