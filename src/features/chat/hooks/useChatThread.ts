import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/shared/services/supabaseClient"
import { fetchConversationMessages, markConversationRead } from "@/features/chat/services/chatService"
import type { ChatMessage } from "@/features/chat/types"

type RealtimeState = "connecting" | "connected" | "closed" | "error"

export function useChatThread(conversationId?: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(Boolean(conversationId))
  const [connectionState, setConnectionState] = useState<RealtimeState>("connecting")

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const rows = await fetchConversationMessages(conversationId)
      setMessages(rows)
      await markConversationRead(conversationId)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  useEffect(() => {
    if (!conversationId) {
      return
    }

    const channel = supabase.channel(`chat-thread-${conversationId}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => {
        load().catch(() => undefined)
      }
    )

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
  }, [conversationId, load])

  return {
    messages,
    loading,
    connectionState,
    reload: load,
  }
}
