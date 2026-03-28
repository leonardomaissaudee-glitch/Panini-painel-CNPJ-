export type UserRole = "admin" | "seller" | "client"

export type ApprovalStatus = "pending" | "approved" | "rejected" | "blocked"

export interface Profile {
  id: string
  auth_user_id?: string | null
  full_name?: string | null
  role: UserRole
  status_cadastro: ApprovalStatus
  tipo_documento?: "cpf" | "cnpj" | null
  documento?: string | null
  telefone?: string | null
  endereco?: any | null
  seller_id?: string | null
  motivo_reprovacao?: string | null
  created_at?: string
  updated_at?: string
}
