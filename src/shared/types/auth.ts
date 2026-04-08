export type UserRole = "admin" | "seller" | "client"

export type ApprovalStatus = "pending" | "approved" | "rejected" | "blocked"

export interface Profile {
  id: string
  auth_user_id?: string | null
  full_name?: string | null
  email?: string | null
  referral_code?: string | null
  role: UserRole
  status_cadastro: ApprovalStatus
  user_type?: string | null
  company_name?: string | null
  tipo_documento?: "cpf" | "cnpj" | null
  documento?: string | null
  telefone?: string | null
  endereco?: any | null
  seller_id?: string | null
  motivo_reprovacao?: string | null
  account_manager_user_id?: string | null
  account_manager_name?: string | null
  account_manager_email?: string | null
  account_manager_whatsapp?: string | null
  referred_by_manager_user_id?: string | null
  referred_by_manager_name?: string | null
  referred_by_manager_email?: string | null
  referred_by_manager_whatsapp?: string | null
  referral_code_used?: string | null
  signup_origin?: string | null
  notes?: string | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}
