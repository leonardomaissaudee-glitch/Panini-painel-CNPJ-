import { supabase } from "@/shared/services/supabaseClient"
import type { OrderStatus } from "@/shared/constants/orderStatus"
import { getManagerByName, type AccountManagerName } from "@/shared/constants/accountManagers"

export type { OrderStatus }

export interface OrderRow {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf?: string | null
  subtotal: number
  total: number
  items?: Array<Record<string, unknown>> | null
  payment_status?: string | null
  status?: OrderStatus | null
  payment_method?: string | null
  payment_id?: string | null
  invoice_number?: string | null
  tracking_code?: string | null
  account_manager_name?: string | null
  account_manager_whatsapp?: string | null
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
  cidade?: string | null
  estado?: string | null
  segmento?: string | null
  faixa_investimento?: string | null
  status_cadastro: "pending" | "approved" | "rejected" | "blocked"
  motivo_reprovacao?: string | null
  account_manager_name?: string | null
  account_manager_whatsapp?: string | null
  created_at?: string
}

export interface ProductRow {
  id: string
  nome: string
  descricao?: string | null
  preco: number
  imagem_url?: string | null
  ativo: boolean
}

function normalizeStatus(status?: string | null): ResellerApprovalRow["status_cadastro"] {
  if (status === "approved" || status === "rejected" || status === "blocked") {
    return status
  }

  return "pending"
}

function derivePaymentStatus(status: OrderStatus, current?: string | null) {
  if (status === "pedido_pago" || status === "pago") {
    return "paid"
  }

  if (status === "cancelado") {
    return "failed"
  }

  if (status === "aguardando_pagamento") {
    return "pending"
  }

  return current ?? "pending"
}

export async function fetchOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as OrderRow[]
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  extras?: {
    invoice_number?: string
    tracking_code?: string
    payment_status?: string | null
  }
) {
  const { data: current } = await supabase.from("orders").select("payment_status").eq("id", id).maybeSingle()

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      payment_status: extras?.payment_status ?? derivePaymentStatus(status, current?.payment_status),
      invoice_number: extras?.invoice_number ?? null,
      tracking_code: extras?.tracking_code ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) throw error
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

export async function fetchAllUsers(): Promise<ResellerApprovalRow[]> {
  const { data, error } = await supabase
    .from("reseller_profiles")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...(row as ResellerApprovalRow),
    status_cadastro: normalizeStatus(row.status_cadastro),
  }))
}

export async function approveProfile(id: string, managerName: AccountManagerName) {
  const manager = getManagerByName(managerName)

  const payload = {
    status_cadastro: "approved",
    motivo_reprovacao: null,
    account_manager_name: manager?.name ?? managerName,
    account_manager_whatsapp: manager?.whatsapp ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data: current, error: loadError } = await supabase
    .from("reseller_profiles")
    .select("user_id")
    .eq("id", id)
    .single()

  if (loadError) throw loadError

  const { error } = await supabase.from("reseller_profiles").update(payload).eq("id", id)
  if (error) throw error

  await supabase
    .from("profiles")
    .update({
      status_cadastro: "approved",
      role: "client",
      motivo_reprovacao: null,
      updated_at: new Date().toISOString(),
    })
    .eq("auth_user_id", current.user_id)
}

export async function rejectProfile(id: string, motivo: string) {
  const { data: current, error: loadError } = await supabase
    .from("reseller_profiles")
    .select("user_id")
    .eq("id", id)
    .single()

  if (loadError) throw loadError

  const { error } = await supabase
    .from("reseller_profiles")
    .update({
      status_cadastro: "rejected",
      motivo_reprovacao: motivo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) throw error

  await supabase
    .from("profiles")
    .update({
      status_cadastro: "rejected",
      role: "client",
      motivo_reprovacao: motivo,
      updated_at: new Date().toISOString(),
    })
    .eq("auth_user_id", current.user_id)
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
