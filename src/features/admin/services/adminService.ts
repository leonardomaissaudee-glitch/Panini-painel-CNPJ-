import { supabase } from "@/shared/services/supabaseClient"
import type { Profile } from "@/shared/types/auth"

export type OrderStatus = "novo_pedido" | "pago" | "enviado" | "nota_fiscal" | "rastreio"

export interface OrderRow {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  subtotal: number
  total: number
  payment_status?: string | null
  status?: OrderStatus | null
  payment_method?: string | null
  payment_id?: string | null
  invoice_number?: string | null
  tracking_code?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProductRow {
  id: string
  nome: string
  descricao?: string | null
  preco: number
  imagem_url?: string | null
  ativo: boolean
}

// Orders
export async function fetchOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_email, customer_phone, subtotal, total, payment_status, status, payment_method, payment_id, invoice_number, tracking_code, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as OrderRow[]
}

export async function updateOrderStatus(id: string, status: OrderStatus, extras?: {
  invoice_number?: string
  tracking_code?: string
}) {
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      invoice_number: extras?.invoice_number ?? null,
      tracking_code: extras?.tracking_code ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw error
}

// Profiles / approvals
export async function fetchPendingProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status_cadastro", "pending")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function fetchAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function approveProfile(id: string, role: Profile["role"]) {
  const { error } = await supabase
    .from("profiles")
    .update({ status_cadastro: "approved", role, motivo_reprovacao: null })
    .eq("id", id)
  if (error) throw error
}

export async function rejectProfile(id: string, motivo: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ status_cadastro: "rejected", motivo_reprovacao: motivo })
    .eq("id", id)
  if (error) throw error
}

// Products CRUD
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
