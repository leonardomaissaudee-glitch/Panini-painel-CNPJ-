import { useEffect, useMemo, useState } from "react"
import { ImagePlus, Paperclip, SendHorizonal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { AudioRecorder } from "@/features/chat/components/AudioRecorder"
import { ChatAttachmentPreview } from "@/features/chat/components/ChatAttachmentPreview"
import { CHAT_ALLOWED_MIME_TYPES, validateChatAttachment } from "@/features/chat/utils"

export function ChatComposer({
  disabled,
  loading,
  placeholder,
  onSend,
}: {
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  onSend: (payload: { text: string; attachment?: File | null }) => Promise<void> | void
}) {
  const [text, setText] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showRecorder, setShowRecorder] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const accept = useMemo(() => CHAT_ALLOWED_MIME_TYPES.join(","), [])

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      return
    }

    try {
      validateChatAttachment(file)
      setAttachment(file)
      setError("")

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      if (file.type.startsWith("image/") || file.type.startsWith("audio/")) {
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        setPreviewUrl(null)
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível anexar o arquivo.")
    }
  }

  const clearAttachment = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setAttachment(null)
    setPreviewUrl(null)
    setShowRecorder(false)
    setError("")
  }

  const handleSubmit = async () => {
    if (disabled || loading) return

    try {
      await onSend({ text, attachment })
      setText("")
      clearAttachment()
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Não foi possível enviar a mensagem.")
    }
  }

  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={disabled || loading}
        placeholder={placeholder || "Digite sua mensagem"}
        className="min-h-[96px] rounded-2xl border-slate-200"
      />

      {attachment && (
        <ChatAttachmentPreview
          file={attachment}
          previewUrl={previewUrl}
          onRemove={clearAttachment}
        />
      )}

      {showRecorder && !attachment && (
        <AudioRecorder
          onReady={(file, nextPreviewUrl) => {
            if (file) {
              setAttachment(file)
              setPreviewUrl(nextPreviewUrl || null)
            } else {
              clearAttachment()
            }
          }}
        />
      )}

      {error && <div className="text-sm text-rose-600">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex">
            <Input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
              disabled={disabled || loading}
            />
            <Button type="button" variant="outline" size="sm" asChild disabled={disabled || loading}>
              <span>
                <Paperclip className="mr-2 h-4 w-4" />
                Anexar
              </span>
            </Button>
          </label>

          <label className="inline-flex">
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
              disabled={disabled || loading}
            />
            <Button type="button" variant="outline" size="sm" asChild disabled={disabled || loading}>
              <span>
                <ImagePlus className="mr-2 h-4 w-4" />
                Foto
              </span>
            </Button>
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || loading}
            onClick={() => setShowRecorder((current) => !current)}
          >
            Áudio
          </Button>
        </div>

        <Button type="button" onClick={handleSubmit} disabled={disabled || loading}>
          <SendHorizonal className="mr-2 h-4 w-4" />
          {loading ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  )
}
