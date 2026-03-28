import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let _client: SupabaseClient | null = null

/**
 * Retorna um cliente do Supabase.
 * - Não quebra o app no carregamento inicial se a env não existir.
 * - Se você tentar usar sem configurar, vai lançar um erro claro.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase não configurado. ' +
      'Crie um arquivo .env na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
    )
  }

  _client = createClient(supabaseUrl, supabaseAnonKey)
  return _client
}

// Tipos do banco de dados
export interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf: string
  shipping_street: string
  shipping_number: string
  shipping_complement?: string
  shipping_neighborhood: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  shipping_cost: number
  total: number
  payment_method: 'pix' | 'credit_card'
  payment_id?: string
  payment_status: 'pending' | 'approved' | 'paid' | 'refused' | 'failed' | 'expired'
  shipping_method: 'free' | 'sedex'
  created_at: string
  updated_at: string
  paid_at?: string
}
