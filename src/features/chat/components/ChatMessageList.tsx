import { useEffect, useMemo, useRef, useState } from "react"
import { Download, FileText, Link as LinkIcon, Volume2 } from "lucide-react"
import { getChatAttachmentUrl } from "@/features/chat/services/chatService"
import { formatChatDate, formatChatTime, groupMessagesByDay, isAudioMessage, isImageMessage, isPdfMessage } from "@/features/chat/utils"
import type { ChatMessage, ChatViewerRole } from "@/features/chat/types"

export function ChatMessageList({
  messages,
  viewerRole,
  adminDisplayName,
}: {
  messages: ChatMessage[]
  viewerRole: ChatViewerRole
  adminDisplayName?: string | null
}) {
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const unresolved = messages.filter((message) => message.attachment_path && !attachmentUrls[message.id])

    if (!unresolved.length) {
      return
    }

    Promise.all(
      unresolved.map(async (message) => {
        const url = await getChatAttachmentUrl(message.attachment_path)
        return [message.id, url] as const
      })
    ).then((entries) => {
      if (cancelled) return

      setAttachmentUrls((current) => ({
        ...current,
        ...Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))),
      }))
    })

    return () => {
      cancelled = true
    }
  }, [messages, attachmentUrls])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollTop = viewport.scrollHeight
  }, [messages])

  const groups = useMemo(() => groupMessagesByDay(messages), [messages])

  return (
    <div ref={viewportRef} className="max-h-[56vh] space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
      {groups.map((group) => (
        <div key={group.date} className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {formatChatDate(group.items[0]?.created_at)}
            </div>
          </div>

          {group.items.map((message) => {
            const isOwn =
              (viewerRole === "customer" && message.sender_type === "customer") ||
              (viewerRole === "admin" && message.sender_type === "admin")
            const attachmentUrl = attachmentUrls[message.id]

            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[88%] rounded-3xl px-4 py-3 shadow-sm",
                    isOwn ? "bg-blue-950 text-white" : "border border-slate-200 bg-white text-slate-900",
                  ].join(" ")}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <span className={isOwn ? "text-slate-200" : "text-slate-500"}>
                      {resolveSenderName(message, adminDisplayName)}
                    </span>
                    <span className={isOwn ? "text-slate-300" : "text-slate-400"}>{formatChatTime(message.created_at)}</span>
                  </div>

                  {message.content && <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>}

                  {message.attachment_name && (
                    <div className={`mt-3 rounded-2xl ${isOwn ? "bg-white/10" : "bg-slate-50"} p-3`}>
                      {isImageMessage(message) && attachmentUrl && (
                        <a href={attachmentUrl} target="_blank" rel="noreferrer">
                          <img src={attachmentUrl} alt={message.attachment_name} className="max-h-56 rounded-2xl object-cover" />
                        </a>
                      )}

                      {isAudioMessage(message) && attachmentUrl && (
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 text-sm font-medium">
                            <Volume2 className="h-4 w-4" />
                            {message.attachment_name}
                          </div>
                          <audio controls className="w-full" src={attachmentUrl} />
                        </div>
                      )}

                      {isPdfMessage(message) && attachmentUrl && (
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-4 w-4" />
                            {message.attachment_name}
                          </div>
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium underline"
                          >
                            <Download className="h-4 w-4" />
                            Abrir PDF
                          </a>
                        </div>
                      )}

                      {!isImageMessage(message) && !isAudioMessage(message) && !isPdfMessage(message) && attachmentUrl && (
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          {message.attachment_name}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {messages.length === 0 && <div className="py-10 text-center text-sm text-slate-500">Nenhuma mensagem ainda.</div>}
    </div>
  )
}

function resolveSenderName(message: ChatMessage, adminDisplayName?: string | null) {
  if (message.sender_type === "admin") {
    if (message.sender_name && !message.sender_name.includes("@")) {
      return message.sender_name
    }

    return adminDisplayName || "Gerente comercial"
  }

  return message.sender_name || "Cliente"
}
