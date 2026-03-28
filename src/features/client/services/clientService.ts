import { supabase } from "@/shared/services/supabaseClient"
import type { OrderRow } from "@/features/admin/services/adminService"

// Busca pedidos do cliente usando o email cadastrado.
export async function fetchMyOrders(customerEmail: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_email, customer_phone, subtotal, total, payment_status, status, payment_method, payment_id, invoice_number, tracking_code, created_at, updated_at"
    )
    .eq("customer_email", customerEmail)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as OrderRow[]
}
