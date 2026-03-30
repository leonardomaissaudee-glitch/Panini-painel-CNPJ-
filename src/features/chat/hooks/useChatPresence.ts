import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/shared/services/supabaseClient"
import { fetchPresenceRows, setPresenceOffline, upsertPresence } from "@/features/chat/services/chatService"
import type { ChatPresenceRow, ChatPresenceState } from "@/features/chat/types"

type PresenceConnectionState = "connecting" | "connected" | "closed" | "error"

export function useChatPresence({
  userId,
  role,
  displayName,
  currentConversationId,
}: {
  userId?: string | null
  role?: "customer" | "admin" | "seller" | "visitor"
  displayName?: string | null
  currentConversationId?: string | null
}) {
  const [presence, setPresence] = useState<Record<string, ChatPresenceState>>({})
  const [presenceRows, setPresenceRows] = useState<Record<string, ChatPresenceRow>>({})
  const [connectionState, setConnectionState] = useState<PresenceConnectionState>("connecting")

  useEffect(() => {
    if (!userId || !role) {
      return
    }

    let mounted = true
    const channel = supabase.channel("chat-online", {
      config: { presence: { key: userId } },
    })

    const syncPresence = async () => {
      if (!mounted) return

      const state = channel.presenceState<ChatPresenceState>()
      const next: Record<string, ChatPresenceState> = {}

      Object.entries(state).forEach(([key, value]) => {
        const latest = value[value.length - 1]
        if (latest) {
          next[key] = latest
        }
      })

      setPresence(next)

      const rows = await fetchPresenceRows(Object.keys(next))
      if (!mounted) return

      setPresenceRows(Object.fromEntries(rows.map((row) => [row.user_id, row])))
    }

    const basePayload: ChatPresenceState = {
      userId,
      role,
      displayName: displayName || undefined,
      conversationId: currentConversationId ?? null,
      onlineAt: new Date().toISOString(),
    }

    channel.on("presence", { event: "sync" }, syncPresence)
    channel.on("presence", { event: "join" }, syncPresence)
    channel.on("presence", { event: "leave" }, syncPresence)

    channel.subscribe(async (status) => {
      if (!mounted) return

      if (status === "SUBSCRIBED") {
        setConnectionState("connected")
        await channel.track(basePayload)
        await upsertPresence({ role, displayName, currentConversationId })
        await syncPresence()
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

    const interval = window.setInterval(() => {
      channel.track({
        ...basePayload,
        onlineAt: new Date().toISOString(),
        conversationId: currentConversationId ?? null,
      }).catch(() => undefined)

      upsertPresence({ role, displayName, currentConversationId }).catch(() => undefined)
    }, 20000)

    const visibilityHandler = () => {
      upsertPresence({ role, displayName, currentConversationId }).catch(() => undefined)
    }

    document.addEventListener("visibilitychange", visibilityHandler)

    return () => {
      mounted = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", visibilityHandler)
      channel.untrack().catch(() => undefined)
      channel.unsubscribe()
      setPresenceOffline(currentConversationId).catch(() => undefined)
    }
  }, [userId, role, displayName, currentConversationId])

  const onlineStaff = useMemo(
    () => Object.values(presence).filter((entry) => entry.role === "admin" || entry.role === "seller"),
    [presence]
  )

  return {
    presence,
    presenceRows,
    connectionState,
    onlineStaff,
  }
}
