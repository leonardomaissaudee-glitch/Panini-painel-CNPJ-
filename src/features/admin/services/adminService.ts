import { supabase } from "@/shared/services/supabaseClient"
import type { OrderStatus } from "@/shared/constants/orderStatus"
import { getManagerByName, type AccountManagerName } from "@/shared/constants/accountManagers"
import type { Profile } from "@/shared/types/auth"

export type { OrderStatus }

export interface OrderItemRow {
  id: string
  name: string
  category?: string | null
  reference?: string | null
  quantity: number
  price: number
  subtotal: number
}

export interface GiftItemRow {
  gift_id: string
  name: string
  quantity: number
  description?: string | null
  reference?: string | null
  image_url?: string | null
  notes?: string | null
}

export interface OrderRow {
  id: string
  cliente_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf?: string | null
  subtotal: number
  original_total?: number | null
  total: number
  items?: OrderItemRow[] | null
  payment_status?: string | null
  status?: OrderStatus | null
  payment_method?: string | null
  payment_id?: string | null
  invoice_number?: string | null
  tracking_code?: string | null
  payment_instructions?: string | null
  payment_copy_paste?: string | null
  payment_link_url?: string | null
  payment_boleto_line?: string | null
  payment_boleto_pdf_url?: string | null
  payment_pix_bank_name?: string | null
  payment_pix_key?: string | null
  payment_pix_beneficiary?: string | null
  payment_pix_agency?: string | null
  payment_pix_account?: string | null
  payment_pix_amount?: string | null
  payment_pix_qr_code?: string | null
  payment_receipt_url?: string | null
  payment_receipt_name?: string | null
  payment_receipt_uploaded_at?: string | null
  account_manager_name?: string | null
  account_manager_whatsapp?: string | null
  admin_discount_type?: "percent" | "value" | null
  admin_discount_value?: number | null
  admin_discount_amount?: number | null
  admin_bonus_type?: "value" | "item" | null
  admin_bonus_value?: number | null
  admin_bonus_amount?: number | null
  admin_bonus_product_id?: string | null
  admin_bonus_product_name?: string | null
  admin_bonus_quantity?: number | null
  gift_items?: GiftItemRow[] | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ResellerApprovalRow {
  id: string
  user_id: string
  cnpj: string
  razao_social: string
  nome_fantasia?: string | null
  nome_responsavel: string
  email: string
  telefone: string
  whatsapp?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  segmento?: string | null
  faixa_investimento?: string | null
  observacoes?: string | null
  status_cadastro: "pending" | "approved" | "rejected" | "blocked"
  motivo_reprovacao?: string | null
  account_manager_name?: string | null
  account_manager_whatsapp?: string | null
  created_at?: string
}

export interface AdminUserRow extends Profile {
  user_type?: string | null
  notes?: string | null
  company_name?: string | null
  reseller_id?: string | null
  razao_social?: string | null
  nome_fantasia?: string | null
  segmento?: string | null
  faixa_investimento?: string | null
  canal_revenda?: string | null
  cep?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  observacoes?: string | null
  nome_responsavel?: string | null
}

export interface ClientAdminRow extends ResellerApprovalRow {
  profile_id?: string | null
  legacy_role?: string | null
  user_type?: string | null
  notes?: string | null
}

export interface ProductRow {
  id: string
  nome: string
  descricao?: string | null
  preco: number
  imagem_url?: string | null
  ativo: boolean
}

export interface CreateManualUserInput {
  full_name: string
  email: string
  password: string
  telefone?: string | null
  documento?: string | null
  tipo_documento?: "cpf" | "cnpj" | null
  user_type: "cliente" | "vendedor" | "gerente" | "atendente" | "admin"
  status_cadastro: "pending" | "approved" | "rejected" | "blocked"
  company_name?: string | null
  notes?: string | null
  razao_social?: string | null
  nome_fantasia?: string | null
  nome_responsavel?: string | null
  segmento?: string | null
  faixa_investimento?: string | null
  canal_revenda?: string | null
  cep?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
}

export interface UpdateUserInput {
  userId: string
  reseller_id?: string | null
  full_name: string
  email: string
  telefone?: string | null
  documento?: string | null
  tipo_documento?: "cpf" | "cnpj" | null
  user_type: "cliente" | "vendedor" | "gerente" | "atendente" | "admin"
  status_cadastro: "pending" | "approved" | "rejected" | "blocked"
  company_name?: string | null
  notes?: string | null
  razao_social?: string | null
  nome_fantasia?: string | null
  nome_responsavel?: string | null
  segmento?: string | null
  faixa_investimento?: string | null
  canal_revenda?: string | null
  cep?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  observacoes?: string | null
  motivo_reprovacao?: string | null
  account_manager_name?: string | null
  account_manager_whatsapp?: string | null
}

export interface UpdateClientInput {
  resellerId: string
  razao_social: string
  nome_fantasia?: string | null
  cnpj: string
  email: string
  telefone: string
  whatsapp?: string | null
  cep: string
  endereco: string
  numero: string
  complemento?: string | null
  bairro: string
  cidade: string
  estado: string
  observacoes?: string | null
  status_cadastro: "pending" | "approved" | "rejected" | "blocked"
  motivo_reprovacao?: string | null
  user_type?: string | null
  notes?: string | null
  nome_responsavel?: string | null
}

export interface SaveOrderInput {
  orderId: string
  status: OrderStatus
  payment_method: string
  items: OrderItemRow[]
  invoice_number?: string | null
  tracking_code?: string | null
  payment_instructions?: string | null
  payment_copy_paste?: string | null
  payment_link_url?: string | null
  payment_boleto_line?: string | null
  payment_boleto_pdf_url?: string | null
  payment_pix_bank_name?: string | null
  payment_pix_key?: string | null
  payment_pix_beneficiary?: string | null
  payment_pix_agency?: string | null
  payment_pix_account?: string | null
  payment_pix_amount?: string | null
  payment_pix_qr_code?: string | null
  admin_discount_type?: "percent" | "value" | null
  admin_discount_value?: number | null
  admin_discount_amount?: number | null
  admin_bonus_type?: "value" | "item" | null
  admin_bonus_value?: number | null
  admin_bonus_amount?: number | null
  admin_bonus_product_id?: string | null
  admin_bonus_product_name?: string | null
  admin_bonus_quantity?: number | null
  gift_items?: GiftItemRow[] | null
}

export interface GiftCatalogRow {
  id: string
  name: string
  description?: string | null
  reference?: string | null
  quantity_available?: number | null
  is_active: boolean
  image_url?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

function normalizeStatus(status?: string | null): ResellerApprovalRow["status_cadastro"] {
  if (status === "approved" || status === "aprovado") return "approved"
  if (status === "rejected" || status === "reprovado") return "rejected"
  if (status === "blocked" || status === "bloqueado") return "blocked"
  return "pending"
}

function extractAddressField(address: any, key: string) {
  if (!address || typeof address !== "object") return null
  const value = address[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

type LegacyProfileRow = Profile & {
  user_type?: string | null
  notes?: string | null
  company_name?: string | null
}

function buildClientRowFromSources(reseller?: Partial<ResellerApprovalRow> & { id?: string; user_id?: string }, profile?: LegacyProfileRow | null): ClientAdminRow {
  const address = profile?.endereco
  const razaoSocial =
    reseller?.razao_social ||
    profile?.company_name ||
    profile?.full_name ||
    "Razão social não informada"
  const nomeResponsavel =
    reseller?.nome_responsavel ||
    profile?.full_name ||
    razaoSocial

  return {
    id: reseller?.id || profile?.id || crypto.randomUUID(),
    user_id: reseller?.user_id || profile?.auth_user_id || profile?.id || "",
    cnpj: reseller?.cnpj || profile?.documento || "",
    razao_social: razaoSocial,
    nome_fantasia: reseller?.nome_fantasia || null,
    nome_responsavel: nomeResponsavel,
    email: reseller?.email || profile?.email || "",
    telefone: reseller?.telefone || profile?.telefone || "",
    whatsapp: reseller?.whatsapp || profile?.telefone || null,
    cidade: reseller?.cidade || extractAddressField(address, "cidade"),
    estado: reseller?.estado || extractAddressField(address, "estado"),
    cep: reseller?.cep || extractAddressField(address, "cep"),
    endereco: reseller?.endereco || extractAddressField(address, "endereco"),
    numero: reseller?.numero || extractAddressField(address, "numero"),
    complemento: reseller?.complemento || extractAddressField(address, "complemento"),
    bairro: reseller?.bairro || extractAddressField(address, "bairro"),
    segmento: reseller?.segmento || null,
    faixa_investimento: reseller?.faixa_investimento || null,
    observacoes: reseller?.observacoes || null,
    status_cadastro: normalizeStatus(reseller?.status_cadastro || profile?.status_cadastro),
    motivo_reprovacao: reseller?.motivo_reprovacao || profile?.motivo_reprovacao || null,
    account_manager_name: reseller?.account_manager_name || profile?.account_manager_name || null,
    account_manager_whatsapp: reseller?.account_manager_whatsapp || profile?.account_manager_whatsapp || null,
    created_at: reseller?.created_at || profile?.created_at,
    profile_id: profile?.id ?? null,
    legacy_role: profile?.role ?? "client",
    user_type: profile?.user_type ?? "cliente",
    notes: profile?.notes ?? null,
  }
}

function parseFunctionError(payload: any, fallback: string) {
  const message = typeof payload?.error === "string" ? payload.error : fallback

  switch (message) {
    case "unauthorized":
      return "Sua sessão expirou. Faça login novamente."
    case "forbidden":
      return "Acesso restrito ao administrador."
    case "required_fields_missing":
      return "Preencha nome, e-mail e senha para criar o usuário."
    case "required_client_fields_missing":
      return "Para criar cliente, preencha CNPJ, razão social, segmento, investimento, canal, telefone e endereço completo."
    case "order_not_found":
      return "Pedido não encontrado ou já excluído."
    case "reseller_not_found":
      return "Cliente não encontrado."
    case "user_not_found":
      return "Usuário não encontrado."
    case "duplicate key value violates unique constraint":
    case "user_already_exists":
      return "Já existe um usuário com esse e-mail ou documento."
    default:
      if (message.toLowerCase().includes("already registered")) {
        return "Já existe um usuário com esse e-mail."
      }
      if (message.toLowerCase().includes("duplicate key")) {
        return "Já existe um registro com esse e-mail ou documento."
      }
      return message || fallback
  }
}

async function callAdminAction<T>(payload: Record<string, unknown>, fallbackError: string): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error("Sua sessão expirou. Faça login novamente.")
  }

  const response = await fetch("/.netlify/functions/admin-manage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  let json: any = null
  try {
    json = await response.json()
  } catch {
    // ignore malformed json
  }

  if (!response.ok || !json?.ok) {
    throw new Error(parseFunctionError(json, fallbackError))
  }

  return json.data as T
}

export async function fetchOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as OrderRow[]
}

export async function saveOrder(input: SaveOrderInput) {
  return callAdminAction<OrderRow>(
    {
      action: "update-order",
      orderId: input.orderId,
      ...input,
    },
    "Não foi possível salvar o pedido."
  )
}

export async function deleteOrder(orderId: string) {
  return callAdminAction<{ id: string }>(
    {
      action: "delete-order",
      orderId,
    },
    "Não foi possível excluir o pedido."
  )
}

export async function uploadOrderPaymentPdf(orderId: string, file: File) {
  const sanitized = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-")
  const path = `${orderId}/${Date.now()}-${sanitized}`

  const { error: uploadError } = await supabase.storage.from("order-payment-files").upload(path, file, {
    upsert: false,
    contentType: file.type || "application/pdf",
  })

  if (uploadError) {
    throw new Error(
      `Não foi possível enviar o PDF do boleto. Verifique o bucket order-payment-files e as permissões no Supabase. Detalhe: ${uploadError.message}`
    )
  }

  const { data } = supabase.storage.from("order-payment-files").getPublicUrl(path)
  return data.publicUrl
}

export async function fetchPendingProfiles(): Promise<ResellerApprovalRow[]> {
  const { data, error } = await supabase
    .from("reseller_profiles")
    .select("*")
    .eq("status_cadastro", "pending")
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...(row as ResellerApprovalRow),
    status_cadastro: normalizeStatus(row.status_cadastro),
  }))
}

async function fetchLegacyProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as LegacyProfileRow[]
}

async function fetchResellerProfiles() {
  const { data, error } = await supabase
    .from("reseller_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as ResellerApprovalRow[]
}

async function fetchClientRows(): Promise<ClientAdminRow[]> {
  const [legacyProfiles, resellerProfiles] = await Promise.all([fetchLegacyProfiles(), fetchResellerProfiles()])
  const clientProfiles = legacyProfiles.filter((profile) => profile.role === "client" || profile.user_type === "cliente")

  const resellerByUserId = new Map(resellerProfiles.map((row) => [row.user_id, row]))
  const resellerByEmail = new Map(
    resellerProfiles
      .filter((row) => row.email)
      .map((row) => [String(row.email).toLowerCase(), row])
  )

  const merged = new Map<string, ClientAdminRow>()

  resellerProfiles.forEach((reseller) => {
    const linkedProfile =
      legacyProfiles.find((profile) => profile.auth_user_id === reseller.user_id) ||
      legacyProfiles.find((profile) => profile.email?.toLowerCase() === reseller.email?.toLowerCase()) ||
      null

    if (linkedProfile && linkedProfile.role !== "client" && linkedProfile.user_type !== "cliente") {
      return
    }

    merged.set(
      reseller.id,
      buildClientRowFromSources(reseller, linkedProfile)
    )
  })

  clientProfiles.forEach((profile) => {
    const linkedReseller =
      resellerByUserId.get(profile.auth_user_id || "") ||
      (profile.email ? resellerByEmail.get(profile.email.toLowerCase()) : undefined)

    if (!linkedReseller) {
      merged.set(profile.id, buildClientRowFromSources(undefined, profile))
    }
  })

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )
}

export async function fetchApprovedClients(): Promise<ClientAdminRow[]> {
  const rows = await fetchClientRows()
  return rows.filter((row) => row.status_cadastro === "approved")
}

export async function fetchAllClients(): Promise<ClientAdminRow[]> {
  return fetchClientRows()
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const [profiles, resellerProfiles] = await Promise.all([fetchLegacyProfiles(), fetchResellerProfiles()])

  const resellerByUserId = new Map(resellerProfiles.map((row) => [row.user_id, row]))
  const resellerByEmail = new Map(
    resellerProfiles
      .filter((row) => row.email)
      .map((row) => [String(row.email).toLowerCase(), row])
  )

  const rows = profiles.map((profile) => {
    const isClient = profile.role === "client" || profile.user_type === "cliente"
    if (!isClient) {
      return profile as AdminUserRow
    }

    const reseller =
      resellerByUserId.get(profile.auth_user_id || "") ||
      (profile.email ? resellerByEmail.get(profile.email.toLowerCase()) : undefined)

    return {
      ...(profile as AdminUserRow),
      reseller_id: reseller?.id ?? null,
      company_name: reseller?.razao_social ?? profile.company_name ?? null,
      razao_social: reseller?.razao_social ?? profile.company_name ?? profile.full_name ?? null,
      full_name:
        reseller?.razao_social ??
        profile.company_name ??
        profile.full_name ??
        "Razão social não informada",
      documento: reseller?.cnpj ?? profile.documento ?? null,
      email: reseller?.email ?? profile.email ?? null,
      telefone: reseller?.whatsapp ?? reseller?.telefone ?? profile.telefone ?? null,
      nome_fantasia: reseller?.nome_fantasia ?? null,
      segmento: reseller?.segmento ?? null,
      faixa_investimento: reseller?.faixa_investimento ?? null,
      canal_revenda: reseller?.canal_revenda ?? null,
      cep: reseller?.cep ?? extractAddressField(profile.endereco, "cep"),
      endereco: reseller?.endereco ?? extractAddressField(profile.endereco, "endereco"),
      numero: reseller?.numero ?? extractAddressField(profile.endereco, "numero"),
      complemento: reseller?.complemento ?? extractAddressField(profile.endereco, "complemento"),
      bairro: reseller?.bairro ?? extractAddressField(profile.endereco, "bairro"),
      cidade: reseller?.cidade ?? extractAddressField(profile.endereco, "cidade"),
      estado: reseller?.estado ?? extractAddressField(profile.endereco, "estado"),
      observacoes: reseller?.observacoes ?? null,
      nome_responsavel: reseller?.nome_responsavel ?? profile.full_name ?? null,
      status_cadastro: normalizeStatus(reseller?.status_cadastro ?? profile.status_cadastro),
      account_manager_name: reseller?.account_manager_name ?? profile.account_manager_name ?? null,
      account_manager_whatsapp: reseller?.account_manager_whatsapp ?? profile.account_manager_whatsapp ?? null,
    } as AdminUserRow
  })

  resellerProfiles.forEach((reseller) => {
    const hasProfile =
      profiles.some((profile) => profile.auth_user_id === reseller.user_id) ||
      profiles.some((profile) => profile.email?.toLowerCase() === reseller.email?.toLowerCase())

    if (hasProfile) return

    rows.push({
      id: reseller.user_id || reseller.id,
      auth_user_id: reseller.user_id,
      role: "client",
      user_type: "cliente",
      status_cadastro: normalizeStatus(reseller.status_cadastro),
      full_name: reseller.razao_social || "Razão social não informada",
      email: reseller.email,
      telefone: reseller.whatsapp || reseller.telefone,
      documento: reseller.cnpj,
      tipo_documento: "cnpj",
      company_name: reseller.razao_social,
      reseller_id: reseller.id,
      razao_social: reseller.razao_social,
      nome_fantasia: reseller.nome_fantasia ?? null,
      segmento: reseller.segmento ?? null,
      faixa_investimento: reseller.faixa_investimento ?? null,
      canal_revenda: reseller.canal_revenda ?? null,
      cep: reseller.cep ?? null,
      endereco: reseller.endereco ?? null,
      numero: reseller.numero ?? null,
      complemento: reseller.complemento ?? null,
      bairro: reseller.bairro ?? null,
      cidade: reseller.cidade ?? null,
      estado: reseller.estado ?? null,
      observacoes: reseller.observacoes ?? null,
      nome_responsavel: reseller.nome_responsavel ?? null,
      account_manager_name: reseller.account_manager_name ?? null,
      account_manager_whatsapp: reseller.account_manager_whatsapp ?? null,
      created_at: reseller.created_at,
      notes: null,
    })
  })

  return rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
}

export async function approveProfile(row: Pick<ResellerApprovalRow, "id" | "user_id" | "email">, managerName: AccountManagerName) {
  const manager = getManagerByName(managerName)

  return callAdminAction<{ id: string }>(
    {
      action: "approve-reseller",
      resellerId: row.id,
      userId: row.user_id,
      email: row.email,
      managerName: manager?.name ?? managerName,
      managerWhatsapp: manager?.whatsapp ?? null,
    },
    "Não foi possível aprovar o cadastro."
  )
}

export async function rejectProfile(row: Pick<ResellerApprovalRow, "id" | "user_id" | "email">, motivo: string) {
  return callAdminAction<{ id: string }>(
    {
      action: "reject-reseller",
      resellerId: row.id,
      userId: row.user_id,
      email: row.email,
      reason: motivo,
    },
    "Não foi possível reprovar o cadastro."
  )
}

export async function createManualUser(input: CreateManualUserInput) {
  return callAdminAction<{ id: string; email: string; role: string; user_type: string }>(
    {
      action: "create-user",
      ...input,
    },
    "Não foi possível criar o usuário."
  )
}

export async function saveUser(input: UpdateUserInput) {
  return callAdminAction<{ id: string }>(
    {
      action: "update-user",
      ...input,
    },
    "Não foi possível salvar o usuário."
  )
}

export async function saveClient(input: UpdateClientInput) {
  return callAdminAction<{ id: string }>(
    {
      action: "update-client",
      ...input,
    },
    "Não foi possível salvar o cliente."
  )
}

export async function fetchGifts(): Promise<GiftCatalogRow[]> {
  const { data, error } = await supabase
    .from("gift_catalog")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as GiftCatalogRow[]
}

export async function upsertGift(gift: Partial<GiftCatalogRow> & { name: string }) {
  const payload = {
    ...gift,
    is_active: gift.is_active ?? true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from("gift_catalog").upsert(payload, { onConflict: "id" }).select().single()
  if (error) throw error
  return data as GiftCatalogRow
}

export async function deleteGift(id: string) {
  const { error } = await supabase.from("gift_catalog").delete().eq("id", id)
  if (error) throw error
}

export async function fetchProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, nome, descricao, preco, imagem_url, ativo")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as ProductRow[]
}

export async function upsertProduct(product: Partial<ProductRow> & { nome: string; preco: number }) {
  const payload = {
    ...product,
    ativo: product.ativo ?? true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from("products").upsert(payload, { onConflict: "id" }).select().single()
  if (error) throw error
  return data as ProductRow
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) throw error
}
