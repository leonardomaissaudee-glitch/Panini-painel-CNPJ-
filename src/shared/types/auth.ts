export type UserRole = "admin" | "seller" | "client"

export type ApprovalStatus = "pending" | "approved" | "rejected" | "blocked"

export interface Profile {
  id: string
  auth_user_id?: string | null
  full_name?: string | null
  email?: string | null
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
  account_manager_name?: string | null
  account_manager_whatsapp?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}
