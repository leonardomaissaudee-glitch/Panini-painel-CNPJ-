import { supabase } from "@/shared/services/supabaseClient"
import type { Profile } from "@/shared/types/auth"
import type { OrderStatus } from "@/shared/constants/orderStatus"

export interface SellerOrder {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  subtotal: number
  total: number
  status?: OrderStatus | null
  payment_status?: string | null
  payment_method?: string | null
  invoice_number?: string | null
  tracking_code?: string | null
  created_at?: string
}

export interface Conversation {
  id: string
  client_id: string | null
  seller_id: string | null
  status: "novo" | "aberto" | "finalizado" | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: string
  mensagem: string
  created_at?: string
}

export interface CartAbandoned {
  id: string
  client_id: string | null
  status: string
  created_at?: string
}

// Clients
export async function fetchClients(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .eq("status_cadastro", "approved")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as Profile[]
}

// Orders
export async function fetchSellerOrders(sellerId?: string): Promise<SellerOrder[]> {
  const query = supabase
    .from("orders")
    .select(
      "id, customer_name, customer_email, customer_phone, subtotal, total, status, payment_status, payment_method, invoice_number, tracking_code, created_at, seller_id"
    )
    .order("created_at", { ascending: false })

  if (sellerId) {
    query.or(`seller_id.eq.${sellerId},seller_id.is.null`) // mostra atribuídos ou sem dono
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as SellerOrder[]
}

export async function updateSellerOrder(
  id: string,
  payload: { status?: OrderStatus; invoice_number?: string; tracking_code?: string; seller_id?: string | null }
) {
  const { error } = await supabase
    .from("orders")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw error
}

export async function createManualOrder(input: {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf: string
  items: any[]
  subtotal: number
  total: number
  payment_method?: string
  seller_id?: string | null
  shipping: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    postal_code: string
  }
}) {
  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_cpf,
    items,
    subtotal,
    total,
    payment_method = "pix",
    seller_id = null,
    shipping,
  } = input

  const { error } = await supabase.from("orders").insert({
    customer_name,
    customer_email,
    customer_phone,
    customer_cpf,
    shipping_street: shipping.street,
    shipping_number: shipping.number,
    shipping_neighborhood: shipping.neighborhood,
    shipping_city: shipping.city,
    shipping_state: shipping.state,
    shipping_postal_code: shipping.postal_code,
    items,
    subtotal,
    shipping_cost: 0,
    total,
    payment_method,
    payment_status: "pending",
    status: "aguardando_aprovacao",
    seller_id,
  })
  if (error) throw error
}

// Conversations / chat
export async function fetchConversationsForSeller(sellerId?: string): Promise<Conversation[]> {
  const query = supabase.from("conversations").select("*").order("updated_at", { ascending: false })
  if (sellerId) query.eq("seller_id", sellerId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Conversation[]
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as Message[]
}

export async function sendMessage(conversationId: string, sender_type: string, mensagem: string) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_type,
    mensagem,
  })
  if (error) throw error
  await supabase
    .from("conversations")
    .update({ status: sender_type === "client" ? "aberto" : "aberto", updated_at: new Date().toISOString() })
    .eq("id", conversationId)
}

// Abandoned carts
export async function fetchAbandonedCarts(): Promise<CartAbandoned[]> {
  const { data, error } = await supabase
    .from("carts")
    .select("*")
    .eq("status", "abandoned")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as CartAbandoned[]
}

export async function recoverCart(cartId: string) {
  const { error } = await supabase
    .from("carts")
    .update({ status: "converted", updated_at: new Date().toISOString() })
    .eq("id", cartId)
  if (error) throw error
}
