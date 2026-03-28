import { supabase } from "./supabase"
import { unformatCNPJ } from "./masks"

export async function getAuthEmailByCnpj(cnpj: string) {
  const clean = unformatCNPJ(cnpj)
  const { data, error } = await supabase.rpc("get_auth_email_by_cnpj", { cnpj_input: clean })
  if (error) throw error
  if (!data) return null
  return data as { user_id: string; email: string }
}

export async function signInWithCnpjAndPassword(cnpj: string, password: string) {
  const mapping = await getAuthEmailByCnpj(cnpj)
  if (!mapping?.email) throw new Error("CNPJ não encontrado")
  const { error } = await supabase.auth.signInWithPassword({ email: mapping.email, password })
  if (error) throw new Error("Falha na autenticação: verifique CNPJ e senha")
  return mapping
}
