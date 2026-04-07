import type { User } from "@supabase/supabase-js"
import { supabase } from "@/shared/services/supabaseClient"
import { fetchManagedClients } from "@/features/admin/services/adminService"
import {
  CHAT_ATTACHMENT_BUCKET,
  getMessageTypeFromFile,
  normalizeMimeType,
  sanitizeFileName,
  validateChatAttachment,
} from "@/features/chat/utils"
import type {
  ChatAttachmentUpload,
  ChatConversation,
  ChatConversationFormInput,
  ChatConversationStatus,
  ChatListFilter,
  ChatMessage,
  ChatParticipant,
  ChatPresenceRow,
} from "@/features/chat/types"

type MaybeAuthUser = User | null

function isStaffRole(role?: string | null) {
  return role === "admin" || role === "seller"
}

function isMeaningfulDisplayName(value?: string | null) {
  return Boolean(value && value.trim() && !value.includes("@"))
}

function formatEmailDisplayName(email?: string | null) {
  if (!email) return null
  const localPart = email.split("@")[0]?.trim()
  if (!localPart) return null

  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function resolveStaffDisplayName(user: MaybeAuthUser, preferredName?: string | null) {
  if (isMeaningfulDisplayName(preferredName)) {
    return preferredName!.trim()
  }

  const metadataFullName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : ""
  if (metadataFullName) {
    return metadataFullName
  }

  const metadataCompanyName =
    typeof user?.user_metadata?.company_name === "string" ? user.user_metadata.company_name.trim() : ""
  if (metadataCompanyName) {
    return metadataCompanyName
  }

  return formatEmailDisplayName(user?.email) || "Equipe comercial"
}

export function isAnonymousUser(user?: MaybeAuthUser) {
  return Boolean((user as { is_anonymous?: boolean } | null | undefined)?.is_anonymous)
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user ?? null
}

export async function ensureChatUser() {
  const existingUser = await getCurrentUser()
  if (existingUser) {
    return existingUser
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    throw new Error("Não foi possível iniciar o atendimento agora.")
  }

  return data.user
}

export async function fetchMyChatConversations() {
  const user = await getCurrentUser()
  if (!user) {
    return [] as ChatConversation[]
  }

  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("customer_user_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Não foi possível carregar suas conversas.")
  }

  return (data ?? []) as ChatConversation[]
}

export async function fetchAdminChatConversations(search = "", filter: ChatListFilter = "all") {
  let query = supabase
    .from("chat_conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (filter === "pending") {
    query = query.eq("status", "pending")
  } else if (filter === "active") {
    query = query.eq("status", "active")
  } else if (filter === "closed") {
    query = query.eq("status", "closed")
  } else if (filter === "unread") {
    query = query.gt("unread_admin_count", 0)
  }

  if (search.trim()) {
    const safeSearch = search.trim()
    query = query.or(
      [
        `customer_name.ilike.%${safeSearch}%`,
        `customer_email.ilike.%${safeSearch}%`,
        `customer_phone.ilike.%${safeSearch}%`,
        `subject.ilike.%${safeSearch}%`,
        `order_reference.ilike.%${safeSearch}%`,
      ].join(",")
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error("Não foi possível carregar os atendimentos.")
  }

  return (data ?? []) as ChatConversation[]
}

export async function fetchManagerChatConversations(
  search = "",
  filter: ChatListFilter = "all",
  scope?: {
    managerUserId?: string
    managerEmail?: string | null
  }
) {
  const currentUser = await getCurrentUser()
  const managerUserId = scope?.managerUserId || currentUser?.id || ""
  const managerEmail = scope?.managerEmail || currentUser?.email || null

  if (!managerUserId) {
    return [] as ChatConversation[]
  }

  const managedClients = await fetchManagedClients(managerUserId, managerEmail)
  if (!managedClients.length) {
    return [] as ChatConversation[]
  }

  const resellerIds = Array.from(new Set(managedClients.map((client) => client.id).filter(Boolean)))
  const customerUserIds = Array.from(new Set(managedClients.map((client) => client.user_id).filter(Boolean)))
  const customerEmails = Array.from(
    new Set(managedClients.map((client) => client.email?.trim().toLowerCase()).filter(Boolean))
  ) as string[]
  const resellerIdSet = new Set(resellerIds)
  const customerUserIdSet = new Set(customerUserIds)
  const customerEmailSet = new Set(customerEmails)

  const applyListFilters = (query: ReturnType<typeof supabase.from<"chat_conversations">>) => {
    let nextQuery = query

    if (filter === "pending") {
      nextQuery = nextQuery.eq("status", "pending")
    } else if (filter === "active") {
      nextQuery = nextQuery.eq("status", "active")
    } else if (filter === "closed") {
      nextQuery = nextQuery.eq("status", "closed")
    } else if (filter === "unread") {
      nextQuery = nextQuery.gt("unread_admin_count", 0)
    }

    if (search.trim()) {
      const safeSearch = search.trim()
      nextQuery = nextQuery.or(
        [
          `customer_name.ilike.%${safeSearch}%`,
          `customer_email.ilike.%${safeSearch}%`,
          `customer_phone.ilike.%${safeSearch}%`,
          `subject.ilike.%${safeSearch}%`,
          `order_reference.ilike.%${safeSearch}%`,
        ].join(",")
      )
    }

    return nextQuery
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
  }

  const merged = new Map<string, ChatConversation>()

  const fetchScopedRows = async (column: "reseller_profile_id" | "customer_user_id" | "customer_email", values: string[]) => {
    if (!values.length) return
    const { data, error } = await applyListFilters(
      supabase.from("chat_conversations").select("*").in(column, values)
    )

    if (error) {
      throw new Error("Não foi possível carregar os chats da carteira.")
    }

    for (const row of (data ?? []) as ChatConversation[]) {
      merged.set(row.id, row)
    }
  }

  await fetchScopedRows("reseller_profile_id", resellerIds)
  await fetchScopedRows("customer_user_id", customerUserIds)
  await fetchScopedRows("customer_email", customerEmails)

  return Array.from(merged.values())
    .filter((conversation) => {
      const normalizedEmail = conversation.customer_email?.trim().toLowerCase() || ""
      return (
        (conversation.reseller_profile_id && resellerIdSet.has(conversation.reseller_profile_id)) ||
        (conversation.customer_user_id && customerUserIdSet.has(conversation.customer_user_id)) ||
        (normalizedEmail && customerEmailSet.has(normalizedEmail))
      )
    })
    .sort((left, right) => {
      const leftTime = new Date(left.last_message_at || left.created_at).getTime()
      const rightTime = new Date(right.last_message_at || right.created_at).getTime()
      return rightTime - leftTime
    })
}

export async function fetchConversationById(conversationId: string) {
  const { data, error } = await supabase.from("chat_conversations").select("*").eq("id", conversationId).maybeSingle()

  if (error) {
    throw new Error("Não foi possível carregar a conversa.")
  }

  return (data as ChatConversation | null) ?? null
}

export async function fetchConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error("Não foi possível carregar as mensagens.")
  }

  return (data ?? []) as ChatMessage[]
}

export async function fetchConversationParticipants(conversationId: string) {
  const { data, error } = await supabase
    .from("chat_participants")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error("Não foi possível carregar os participantes.")
  }

  return (data ?? []) as ChatParticipant[]
}

export async function startOrReuseConversation(input: ChatConversationFormInput) {
  const user = await ensureChatUser()

  const { data, error } = await supabase.rpc("chat_start_or_reuse_conversation", {
    p_customer_name: input.name,
    p_customer_email: input.email || null,
    p_customer_phone: input.phone,
    p_subject: input.reason,
    p_order_reference: input.orderReference || null,
    p_initial_message: input.initialMessage?.trim() || null,
  })

  if (error) {
    throw new Error("Não foi possível abrir o atendimento.")
  }

  const conversationId =
    typeof data === "string"
      ? data
      : Array.isArray(data)
        ? String(data[0])
        : typeof data?.id === "string"
          ? data.id
          : String(data)

  if (!conversationId) {
    throw new Error("Não foi possível abrir o atendimento.")
  }

  await upsertPresence({
    role: isAnonymousUser(user) ? "visitor" : "customer",
    displayName: input.name,
    currentConversationId: conversationId,
  })

  return conversationId
}

export async function ensureAdminParticipant(conversationId: string, displayName?: string | null) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Sessão administrativa não encontrada.")
  }

  const resolvedDisplayName = resolveStaffDisplayName(user, displayName)

  const { error } = await supabase.from("chat_participants").upsert(
    {
      conversation_id: conversationId,
      user_id: user.id,
      participant_type: "admin",
      display_name: resolvedDisplayName,
      email: user.email,
    },
    { onConflict: "conversation_id,user_id" }
  )

  if (error) {
    throw new Error("Não foi possível preparar o atendimento do gerente.")
  }
}

export async function uploadChatAttachment(conversationId: string, file: File): Promise<ChatAttachmentUpload> {
  validateChatAttachment(file)
  const messageType = getMessageTypeFromFile(file)
  const path = `${conversationId}/${Date.now()}-${sanitizeFileName(file.name)}`
  const contentType = normalizeMimeType(file.type) || "application/octet-stream"
  const { error } = await supabase.storage.from(CHAT_ATTACHMENT_BUCKET).upload(path, file, {
    upsert: false,
    contentType,
  })

  if (error) {
    throw new Error(`Não foi possível enviar o anexo. Detalhe: ${error.message}`)
  }

  return {
    path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: contentType,
    messageType,
  }
}

export async function getChatAttachmentUrl(path?: string | null) {
  if (!path) return null

  const { data, error } = await supabase.storage.from(CHAT_ATTACHMENT_BUCKET).createSignedUrl(path, 60 * 60)
  if (error) {
    return null
  }

  return data.signedUrl
}

export async function sendConversationMessage({
  conversationId,
  senderType,
  senderName,
  content,
  attachment,
}: {
  conversationId: string
  senderType: "customer" | "admin"
  senderName?: string | null
  content?: string
  attachment?: File | null
}) {
  const user = await ensureChatUser()
  const trimmedContent = content?.trim() || null

  if (!trimmedContent && !attachment) {
    throw new Error("Digite uma mensagem ou selecione um anexo.")
  }

  let attachmentPayload: ChatAttachmentUpload | null = null

  if (attachment) {
    attachmentPayload = await uploadChatAttachment(conversationId, attachment)
  }

  if (senderType === "admin") {
    await ensureAdminParticipant(conversationId, senderName)
  }

  const resolvedSenderName =
    senderType === "admin"
      ? resolveStaffDisplayName(user, senderName)
      : senderName || user.user_metadata?.full_name || user.email || null

  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    sender_type: senderType,
    sender_name: resolvedSenderName,
    message_type: attachmentPayload?.messageType ?? "text",
    content: trimmedContent,
    attachment_path: attachmentPayload?.path ?? null,
    attachment_name: attachmentPayload?.fileName ?? null,
    attachment_size: attachmentPayload?.fileSize ?? null,
    mime_type: attachmentPayload?.mimeType ?? null,
  })

  if (error) {
    throw new Error("Não foi possível enviar a mensagem.")
  }
}

export async function markConversationRead(conversationId: string) {
  const { error } = await supabase.rpc("chat_mark_conversation_read", {
    p_conversation_id: conversationId,
  })

  if (error) {
    throw new Error("Não foi possível atualizar o status de leitura.")
  }
}

export async function updateConversationStatus(conversationId: string, status: ChatConversationStatus) {
  const { error } = await supabase.rpc("chat_update_conversation_status", {
    p_conversation_id: conversationId,
    p_status: status,
  })

  if (error) {
    throw new Error("Não foi possível atualizar o status do atendimento.")
  }
}

export async function assignConversation(conversationId: string, assignedAdminId: string | null, assignedAdminName?: string | null) {
  const { error } = await supabase.rpc("chat_assign_conversation", {
    p_conversation_id: conversationId,
    p_assigned_admin_id: assignedAdminId,
    p_assigned_admin_name: assignedAdminName ?? null,
  })

  if (error) {
    throw new Error("Não foi possível atribuir o atendimento.")
  }
}

export async function upsertPresence({
  role,
  displayName,
  currentConversationId,
}: {
  role: "customer" | "admin" | "seller" | "visitor"
  displayName?: string | null
  currentConversationId?: string | null
}) {
  const user = await getCurrentUser()
  if (!user) {
    return
  }

  const { error } = await supabase.from("chat_presence").upsert(
    {
      user_id: user.id,
      role,
      display_name: role === "admin" || role === "seller" ? resolveStaffDisplayName(user, displayName) : displayName || user.email || null,
      is_online: true,
      current_conversation_id: currentConversationId ?? null,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) {
    console.error("Erro ao atualizar presença", error)
  }
}

export async function setPresenceOffline(currentConversationId?: string | null) {
  const user = await getCurrentUser()
  if (!user) {
    return
  }

  await supabase
    .from("chat_presence")
    .update({
      is_online: false,
      current_conversation_id: currentConversationId ?? null,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
}

export async function fetchPresenceRows(userIds: string[]) {
  if (!userIds.length) return [] as ChatPresenceRow[]

  const { data, error } = await supabase.from("chat_presence").select("*").in("user_id", userIds)
  if (error) {
    return [] as ChatPresenceRow[]
  }

  return (data ?? []) as ChatPresenceRow[]
}

export async function fetchStaffPresence() {
  const { data, error } = await supabase
    .from("chat_presence")
    .select("*")
    .in("role", ["admin", "seller"])
    .order("updated_at", { ascending: false })

  if (error) {
    return [] as ChatPresenceRow[]
  }

  return (data ?? []) as ChatPresenceRow[]
}
