import { supabase } from "@/shared/services/supabaseClient"

export type ConversationStatus = "novo" | "aberto" | "finalizado"

export interface Conversation {
  id: string
  client_id: string | null
  seller_id: string | null
  status: ConversationStatus | null
  created_at?: string
  updated_at?: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_type: "client" | "seller" | "admin" | "system"
  mensagem: string
  created_at?: string
}

export async function getOrCreateConversationForClient(clientId: string): Promise<Conversation> {
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing as Conversation

  const { data, error } = await supabase
    .from("conversations")
    .insert({ client_id: clientId, status: "novo" })
    .select("*")
    .single()

  if (error) throw error
  return data as Conversation
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as ChatMessage[]
}

export async function sendChatMessage(conversationId: string, sender_type: ChatMessage["sender_type"], mensagem: string) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_type,
    mensagem,
  })
  if (error) throw error

  // Marca conversa como aberta após nova mensagem (cliente abre ticket).
  const { error: statusError } = await supabase
    .from("conversations")
    .update({ status: "aberto", updated_at: new Date().toISOString() })
    .eq("id", conversationId)
  if (statusError) throw statusError
}

export async function updateConversationStatus(conversationId: string, status: ConversationStatus) {
  const { error } = await supabase
    .from("conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
  if (error) throw error
}
