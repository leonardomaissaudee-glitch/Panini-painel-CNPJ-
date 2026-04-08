import type { AuthError } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { unformatCNPJ } from "./masks"
import type { CadastroRevendedorInput } from "./validators"
import { getManagerByName } from "@/shared/constants/accountManagers"
import { normalizeManagerReferralCode } from "@/shared/utils/managerReferral"

export type ResellerProfile = {
  id: string
  user_id: string
  legacy_profile_id?: string | null
  cnpj: string
  razao_social: string
  nome_fantasia: string | null
  inscricao_estadual: string | null
  segmento: string
  data_abertura: string | null
  porte_empresa: string | null
  nome_responsavel: string
  cpf_responsavel: string | null
  cargo_responsavel: string | null
  email: string
  telefone: string
  whatsapp: string | null
  cep: string
  endereco: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  canal_revenda: string
  trabalha_com_colecionaveis: boolean
  faixa_investimento: string
  observacoes: string | null
  status_cadastro: "pending" | "approved" | "rejected" | "blocked"
  motivo_reprovacao?: string | null
  role?: "client"
  account_manager_name?: string | null
  account_manager_whatsapp?: string | null
  account_manager_user_id?: string | null
  account_manager_email?: string | null
  referred_by_manager_user_id?: string | null
  referred_by_manager_name?: string | null
  referred_by_manager_email?: string | null
  referred_by_manager_whatsapp?: string | null
  referral_code_used?: string | null
  signup_origin?: string | null
  created_at: string
}

type ResolvedReferralManager = {
  auth_user_id: string
  email: string
  full_name: string
  telefone?: string | null
  referral_code: string
} | null

type AuthEmailLookup = {
  email: string
} | null

function mapAuthError(error: AuthError | Error | null | undefined) {
  const message = error?.message?.toLowerCase() ?? ""

  if (message.includes("user already registered")) {
    return "Já existe uma conta vinculada a este e-mail."
  }

  if (message.includes("invalid login credentials")) {
    return "CNPJ ou senha inválidos."
  }

  if (message.includes("email not confirmed")) {
    return "Sua conta ainda não está disponível. Fale com seu gerente de contas para concluir a ativação."
  }

  if (message.includes("network")) {
    return "Não foi possível concluir a operação agora. Verifique sua conexão e tente novamente."
  }

  return error?.message || "Não foi possível concluir a operação."
}

function normalizeApprovalStatus(status?: string | null): ResellerProfile["status_cadastro"] {
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

function mergeApprovalStatus(...statuses: Array<string | null | undefined>): ResellerProfile["status_cadastro"] {
  const normalized = statuses.map(normalizeApprovalStatus)

  if (normalized.includes("blocked")) return "blocked"
  if (normalized.includes("rejected")) return "rejected"
  if (normalized.includes("approved")) return "approved"
  return "pending"
}

export async function getAuthEmailByCnpj(cnpj: string): Promise<AuthEmailLookup> {
  const clean = unformatCNPJ(cnpj)
  const { data, error } = await supabase.rpc("get_auth_email_by_cnpj", { cnpj_input: clean })

  if (error) {
    throw new Error("Não foi possível validar o CNPJ no momento.")
  }

  if (!data) {
    return null
  }

  if (typeof data === "string") {
    return { email: data }
  }

  if (Array.isArray(data) && data.length > 0 && typeof data[0]?.email === "string") {
    return { email: data[0].email }
  }

  return null
}

export async function findResellerProfileByCurrentUser() {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(mapAuthError(authError))
  }

  if (!authData.user) {
    return null
  }

  const { data, error } = await supabase
    .from("reseller_profiles")
    .select("*")
    .eq("user_id", authData.user.id)
    .maybeSingle()

  if (error) {
    throw new Error("Não foi possível carregar os dados do cadastro.")
  }

  const { data: legacyProfile } = await supabase
    .from("profiles")
    .select("id, role, status_cadastro, motivo_reprovacao")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle()

  if (!data) {
    return null
  }

  const manager = getManagerByName(data.account_manager_name)

  return {
    ...(data as ResellerProfile),
    status_cadastro: mergeApprovalStatus(
      data.status_cadastro,
      legacyProfile?.role === "client" ? legacyProfile.status_cadastro : null
    ),
    motivo_reprovacao:
      data.motivo_reprovacao ??
      (legacyProfile?.role === "client" ? legacyProfile.motivo_reprovacao ?? null : null),
    role: "client",
    legacy_profile_id: legacyProfile?.id ?? null,
    account_manager_name: data.account_manager_name ?? manager?.name ?? null,
    account_manager_whatsapp: data.account_manager_whatsapp ?? manager?.whatsapp ?? null,
  }
}

export async function signInWithCnpjAndPassword(cnpj: string, password: string) {
  const mapping = await getAuthEmailByCnpj(cnpj)

  if (!mapping?.email) {
    throw new Error("CNPJ não encontrado.")
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: mapping.email,
    password,
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }

  return data
}

export async function signOutReseller() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error("Não foi possível encerrar a sessão.")
  }
}

export async function registerReseller(input: CadastroRevendedorInput) {
  const referralCode = normalizeManagerReferralCode(input.referral_code)
  let resolvedManager: ResolvedReferralManager = null

  if (referralCode) {
    const { data: referralData, error: referralError } = await supabase.rpc("resolve_manager_referral_code", {
      p_referral_code: referralCode,
    })

    if (referralError) {
      throw new Error("Não foi possível validar o link do gerente no momento.")
    }

    const row = Array.isArray(referralData) ? referralData[0] : referralData
    if (row?.auth_user_id && row?.email) {
      resolvedManager = {
        auth_user_id: row.auth_user_id,
        email: row.email,
        full_name: row.full_name || "Gerente comercial",
        telefone: row.telefone || null,
        referral_code: row.referral_code || referralCode,
      }
    }
  }

  const existing = await getAuthEmailByCnpj(input.cnpj)
  if (existing?.email) {
    throw new Error("Este CNPJ já possui cadastro em análise ou ativo.")
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.senha,
    options: {
      data: {
        full_name: input.nome_responsavel,
        cnpj: input.cnpj,
        razao_social: input.razao_social,
        tipo_conta: "revendedor_panini",
      },
    },
  })

  if (signUpError) {
    throw new Error(mapAuthError(signUpError))
  }

  if (!signUpData.user) {
    throw new Error("Não foi possível iniciar o cadastro agora.")
  }

  let activeSession = signUpData.session

  if (!activeSession) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.senha,
    })

    if (signInError || !signInData.session) {
      throw new Error(
        "A conta foi criada, mas a sessão não pôde ser iniciada para concluir o perfil. Verifique a confirmação do e-mail ou fale com seu gerente de contas."
      )
    }

    activeSession = signInData.session
  }

  const payload = {
    user_id: signUpData.user.id,
    cnpj: input.cnpj,
    razao_social: input.razao_social,
    nome_fantasia: input.nome_fantasia || null,
    inscricao_estadual: input.inscricao_estadual || null,
    segmento: input.segmento,
    data_abertura: input.data_abertura || null,
    porte_empresa: input.porte_empresa || null,
    nome_responsavel: input.nome_responsavel,
    cpf_responsavel: input.cpf_responsavel || null,
    cargo_responsavel: input.cargo_responsavel || null,
    telefone: input.telefone,
    whatsapp: input.whatsapp || null,
    email: input.email,
    cep: input.cep,
    endereco: input.endereco,
    numero: input.numero,
    complemento: input.complemento || null,
    bairro: input.bairro,
    cidade: input.cidade,
    estado: input.estado,
    canal_revenda: input.canal_revenda,
    trabalha_com_colecionaveis: input.trabalha_com_colecionaveis,
    faixa_investimento: input.faixa_investimento,
    observacoes: input.observacoes || null,
    aceitou_veracidade: input.aceitou_veracidade,
    aceitou_termos: input.aceitou_termos,
    aceitou_contato: input.aceitou_contato,
    status_cadastro: "pending",
    account_manager_user_id: resolvedManager?.auth_user_id || null,
    account_manager_name: resolvedManager?.full_name || null,
    account_manager_email: resolvedManager?.email || null,
    account_manager_whatsapp: resolvedManager?.telefone || null,
    referred_by_manager_user_id: resolvedManager?.auth_user_id || null,
    referred_by_manager_name: resolvedManager?.full_name || null,
    referred_by_manager_email: resolvedManager?.email || null,
    referred_by_manager_whatsapp: resolvedManager?.telefone || null,
    referral_code_used: referralCode || null,
    signup_origin: resolvedManager ? "link_gerente" : referralCode ? "link_invalido" : "cadastro_direto",
  }

  const { error: insertError } = await supabase.from("reseller_profiles").insert(payload)

  if (insertError) {
    await supabase.auth.signOut()

    if (insertError.code === "23505") {
      throw new Error("Este CNPJ já possui cadastro em análise ou ativo.")
    }

    throw new Error(
      "A conta foi criada, mas não foi possível concluir o perfil empresarial. Fale com seu gerente de contas para regularizar o cadastro."
    )
  }

  await supabase.auth.signOut()

  return {
    user: signUpData.user,
    session: activeSession,
  }
}
