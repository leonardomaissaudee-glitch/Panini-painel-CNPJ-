import { supabase } from "@/shared/services/supabaseClient"
import type { OrderRow } from "@/features/admin/services/adminService"
import type { OrderStatus } from "@/shared/constants/orderStatus"
import type { Cart } from "@/types"
import type { ResellerProfile } from "@/lib/auth"

export type ClientPaymentMethod = "pix" | "credit_card" | "boleto"

type DiscountTier = {
  name: "Classic" | "Standard" | "Premium"
  percentage: number
}

export function getDiscountTier(subtotal: number): DiscountTier | null {
  if (subtotal >= 5000) return { name: "Premium", percentage: 20 }
  if (subtotal >= 2500) return { name: "Standard", percentage: 12 }
  if (subtotal >= 800) return { name: "Classic", percentage: 5 }
  return null
}

export function calculateCartPricing(subtotal: number, paymentMethod: ClientPaymentMethod) {
  const tier = getDiscountTier(subtotal)
  const planDiscount = tier ? Number((subtotal * (tier.percentage / 100)).toFixed(2)) : 0
  const totalAfterPlan = Number((subtotal - planDiscount).toFixed(2))
  const pixDiscount = paymentMethod === "pix" ? Number((totalAfterPlan * 0.05).toFixed(2)) : 0
  const total = Number((totalAfterPlan - pixDiscount).toFixed(2))

  return {
    tier,
    planDiscount,
    pixDiscount,
    total,
  }
}

export async function fetchMyOrders(customerEmail: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_email", customerEmail)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as OrderRow[]
}

export async function uploadClientPaymentReceipt(orderId: string, file: File) {
  const sanitized = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-")
  const path = `${orderId}/${Date.now()}-${sanitized}`

  const { error: uploadError } = await supabase.storage.from("order-payment-proofs").upload(path, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  })

  if (uploadError) {
    throw new Error(`Não foi possível enviar o comprovante. Detalhe: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from("order-payment-proofs").getPublicUrl(path)
  return data.publicUrl
}

export async function submitClientPaymentReceipt({
  orderId,
  receiptUrl,
  receiptName,
}: {
  orderId: string
  receiptUrl: string
  receiptName: string
}) {
  const { error } = await supabase
    .from("orders")
    .update({
      payment_receipt_url: receiptUrl,
      payment_receipt_name: receiptName,
      payment_receipt_uploaded_at: new Date().toISOString(),
      status: "aguardando_verificacao_financeira",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) {
    throw new Error(error.message || "Não foi possível registrar o comprovante.")
  }
}

export async function createClientOrder({
  profile,
  cart,
  paymentMethod,
}: {
  profile: ResellerProfile
  cart: Cart
  paymentMethod: ClientPaymentMethod
}) {
  const subtotal = Number(cart.total.toFixed(2))
  const pricing = calculateCartPricing(subtotal, paymentMethod)
  const items = cart.items.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    category: item.product.category,
    reference: item.product.reference,
    quantity: item.quantity,
    price: item.product.price,
    subtotal: Number((item.product.price * item.quantity).toFixed(2)),
  }))

  const status: OrderStatus = "novo_pedido"
  const paymentStatus = "pending"

  const { data, error } = await supabase
    .from("orders")
    .insert({
      cliente_id: profile.legacy_profile_id ?? profile.user_id,
      customer_name: profile.razao_social,
      customer_email: profile.email,
      customer_phone: profile.whatsapp || profile.telefone,
      customer_cpf: profile.cnpj,
      shipping_street: profile.endereco,
      shipping_number: profile.numero,
      shipping_complement: profile.complemento,
      shipping_neighborhood: profile.bairro,
      shipping_city: profile.cidade,
      shipping_state: profile.estado,
      shipping_postal_code: profile.cep,
      items,
      subtotal,
      shipping_cost: 0,
      total: pricing.total,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      shipping_method: "free",
      status,
    })
    .select("*")
    .single()

  if (error) {
    throw new Error(getClientOrderErrorMessage(error))
  }

  return data as OrderRow
}

function getClientOrderErrorMessage(error: { message?: string; details?: string | null }) {
  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase()

  if (text.includes("order_status") || text.includes("status")) {
    return "A estrutura de pedidos da base ainda não foi atualizada. O pedido não pôde ser salvo."
  }

  if (text.includes("cliente_id")) {
    return "Seu cadastro ainda não está totalmente vinculado ao portal de pedidos. Fale com o administrador para concluir a ativação."
  }

  if (text.includes("payment_method") || text.includes("boleto")) {
    return "O método de pagamento selecionado ainda não foi liberado na base de dados."
  }

  if (text.includes("violates row-level security") || text.includes("permission denied")) {
    return "Sua sessão não tem permissão para gravar pedidos no momento."
  }

  return error.message || "Não foi possível registrar o pedido."
}
