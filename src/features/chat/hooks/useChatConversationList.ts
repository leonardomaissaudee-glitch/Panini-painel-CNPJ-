import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/shared/services/supabaseClient"
import { fetchAdminChatConversations, fetchMyChatConversations } from "@/features/chat/services/chatService"
import type { ChatConversation, ChatListFilter, ChatViewerRole } from "@/features/chat/types"

type RealtimeState = "connecting" | "connected" | "closed" | "error"

export function useChatConversationList({
  role,
  search = "",
  filter = "all",
  enabled = true,
  onIncomingConversation,
}: {
  role: ChatViewerRole
  search?: string
  filter?: ChatListFilter
  enabled?: boolean
  onIncomingConversation?: (conversation: ChatConversation) => void
}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loading, setLoading] = useState(enabled)
  const [connectionState, setConnectionState] = useState<RealtimeState>("connecting")
  const previousMapRef = useRef<Record<string, ChatConversation>>({})

  const load = useCallback(async () => {
    if (!enabled) {
      setConversations([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const rows =
        role === "admin" ? await fetchAdminChatConversations(search, filter) : await fetchMyChatConversations()

      setConversations(rows)

      rows.forEach((row) => {
        const previous = previousMapRef.current[row.id]
        if (!previous) return

        if (role === "admin" && row.unread_admin_count > previous.unread_admin_count && onIncomingConversation) {
          onIncomingConversation(row)
        }
      })

      previousMapRef.current = Object.fromEntries(rows.map((row) => [row.id, row]))
    } finally {
      setLoading(false)
    }
  }, [enabled, filter, onIncomingConversation, role, search])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const channel = supabase
      .channel(`chat-conversations-${role}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => {
        load().catch(() => undefined)
      })

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setConnectionState("connected")
        return
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setConnectionState("error")
        return
      }

      if (status === "CLOSED") {
        setConnectionState("closed")
        return
      }

      setConnectionState("connecting")
    })

    return () => {
      channel.unsubscribe()
    }
  }, [enabled, load, role])

  return {
    conversations,
    loading,
    connectionState,
    reload: load,
  }
}
