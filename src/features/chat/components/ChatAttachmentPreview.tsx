import { FileText, Image as ImageIcon, Paperclip, Trash2, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/features/chat/utils"

interface ChatAttachmentPreviewProps {
  file: File
  previewUrl?: string | null
  onRemove: () => void
}

export function ChatAttachmentPreview({ file, previewUrl, onRemove }: ChatAttachmentPreviewProps) {
  const isImage = file.type.startsWith("image/")
  const isAudio = file.type.startsWith("audio/")
  const isPdf = file.type === "application/pdf"

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-slate-600">
            {isImage ? (
              <ImageIcon className="h-5 w-5" />
            ) : isAudio ? (
              <Volume2 className="h-5 w-5" />
            ) : isPdf ? (
              <FileText className="h-5 w-5" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900">{file.name}</div>
            <div className="text-xs text-slate-500">{formatFileSize(file.size)}</div>
          </div>
        </div>

        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isImage && previewUrl && (
        <img src={previewUrl} alt={file.name} className="mt-3 max-h-48 rounded-2xl border border-slate-200 object-cover" />
      )}

      {isAudio && previewUrl && <audio controls className="mt-3 w-full" src={previewUrl} />}
    </div>
  )
}
