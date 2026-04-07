export type ChatConversationStatus = "pending" | "active" | "closed"

export type ChatSenderType = "customer" | "admin" | "system"

export type ChatMessageType = "text" | "image" | "pdf" | "file" | "audio"

export type ChatViewerRole = "customer" | "admin" | "manager"

export interface ChatConversation {
  id: string
  customer_user_id: string
  reseller_profile_id?: string | null
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
  subject: string
  order_reference?: string | null
  status: ChatConversationStatus
  assigned_admin_id?: string | null
  assigned_admin_name?: string | null
  last_message_at?: string | null
  last_message_preview?: string | null
  unread_customer_count: number
  unread_admin_count: number
  created_at: string
  updated_at: string
  closed_at?: string | null
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_user_id?: string | null
  sender_type: ChatSenderType
  sender_name?: string | null
  message_type: ChatMessageType
  content?: string | null
  attachment_path?: string | null
  attachment_name?: string | null
  attachment_size?: number | null
  mime_type?: string | null
  metadata?: Record<string, unknown> | null
  delivered_at?: string | null
  created_at: string
  read_at?: string | null
}

export interface ChatParticipant {
  id: string
  conversation_id: string
  user_id: string
  participant_type: "customer" | "admin" | "system"
  display_name?: string | null
  email?: string | null
  phone?: string | null
  last_read_at?: string | null
  created_at: string
}

export interface ChatPresenceRow {
  user_id: string
  role: "customer" | "admin" | "seller" | "visitor"
  display_name?: string | null
  is_online: boolean
  current_conversation_id?: string | null
  last_seen: string
  updated_at: string
}

export interface ChatPresenceState {
  userId: string
  role: "customer" | "admin" | "seller" | "visitor"
  displayName?: string
  conversationId?: string | null
  onlineAt: string
}

export interface ChatConversationFormInput {
  name: string
  email?: string
  phone: string
  reason: string
  orderReference?: string
  initialMessage?: string
}

export interface ChatAttachmentUpload {
  path: string
  fileName: string
  fileSize: number
  mimeType: string
  messageType: ChatMessageType
}

export type ChatListFilter = "all" | "unread" | "pending" | "active" | "closed"

export interface ChatConversationListItem extends ChatConversation {
  customer_online?: boolean
  staff_online?: boolean
  last_seen?: string | null
}
