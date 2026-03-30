import type { ChatMessage, ChatMessageType } from "@/features/chat/types"

export const CHAT_ATTACHMENT_BUCKET = "chat-attachments"
export const CHAT_MAX_FILE_SIZE = 10 * 1024 * 1024

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const pdfMimeTypes = ["application/pdf"]
const documentMimeTypes = [
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]
const audioMimeTypes = [
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
]

export const CHAT_ALLOWED_MIME_TYPES = [...imageMimeTypes, ...pdfMimeTypes, ...documentMimeTypes, ...audioMimeTypes]

export function normalizeMimeType(value?: string | null) {
  return (value || "")
    .split(";")[0]
    .trim()
    .toLowerCase()
}

export function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

export function getMessageTypeFromFile(file: File): ChatMessageType {
  const mimeType = normalizeMimeType(file.type)

  if (mimeType.startsWith("image/")) {
    return "image"
  }

  if (mimeType === "application/pdf") {
    return "pdf"
  }

  if (mimeType.startsWith("audio/")) {
    return "audio"
  }

  return "file"
}

export function validateChatAttachment(file: File) {
  const mimeType = normalizeMimeType(file.type)

  if (!mimeType || !CHAT_ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Formato de arquivo não permitido para o chat.")
  }

  if (file.size > CHAT_MAX_FILE_SIZE) {
    throw new Error("O arquivo excede o limite de 10 MB.")
  }
}

export function formatChatTime(value?: string | null) {
  if (!value) return ""
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function formatChatDate(value?: string | null) {
  if (!value) return ""
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

export function formatRelativeLastSeen(value?: string | null) {
  if (!value) return "offline"

  const lastSeen = new Date(value).getTime()
  const diffMinutes = Math.max(0, Math.round((Date.now() - lastSeen) / 60000))

  if (diffMinutes < 1) return "agora"
  if (diffMinutes < 60) return `${diffMinutes} min atrás`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} h atrás`

  return formatChatDate(value)
}

export function formatFileSize(size?: number | null) {
  if (!size || size <= 0) return "-"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageMessage(message: ChatMessage) {
  return message.message_type === "image"
}

export function isAudioMessage(message: ChatMessage) {
  return message.message_type === "audio"
}

export function isPdfMessage(message: ChatMessage) {
  return message.message_type === "pdf"
}

export function groupMessagesByDay(messages: ChatMessage[]) {
  const groups: Array<{ date: string; items: ChatMessage[] }> = []

  messages.forEach((message) => {
    const dayKey = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(message.created_at))

    const lastGroup = groups[groups.length - 1]
    if (!lastGroup || lastGroup.date !== dayKey) {
      groups.push({ date: dayKey, items: [message] })
      return
    }

    lastGroup.items.push(message)
  })

  return groups
}
