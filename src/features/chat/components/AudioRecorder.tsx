import { useEffect, useRef, useState } from "react"
import { Mic, Pause, Square, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AudioRecorderProps {
  onReady: (file: File | null, previewUrl?: string | null) => void
}

export function AudioRecorder({ onReady }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const start = async () => {
    try {
      setError("")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/ogg") ? "audio/ogg" : ""
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        const extension = blob.type.includes("ogg") ? "ogg" : "webm"
        const file = new File([blob], `audio-${Date.now()}.${extension}`, { type: blob.type })
        const nextPreview = URL.createObjectURL(blob)

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }

        setPreviewUrl(nextPreview)
        onReady(file, nextPreview)
        stream.getTracks().forEach((track) => track.stop())
        recorderRef.current = null
        setRecording(false)
        setPaused(false)
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch {
      setError("Não foi possível acessar o microfone neste navegador.")
    }
  }

  const pause = () => {
    if (!recorderRef.current) return
    recorderRef.current.pause()
    setPaused(true)
  }

  const resume = () => {
    if (!recorderRef.current) return
    recorderRef.current.resume()
    setPaused(false)
  }

  const stop = () => {
    recorderRef.current?.stop()
  }

  const clear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setError("")
    onReady(null, null)
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {!recording ? (
          <Button type="button" variant="outline" size="sm" onClick={start}>
            <Mic className="mr-2 h-4 w-4" />
            Gravar áudio
          </Button>
        ) : paused ? (
          <Button type="button" variant="outline" size="sm" onClick={resume}>
            <Mic className="mr-2 h-4 w-4" />
            Continuar
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={pause}>
            <Pause className="mr-2 h-4 w-4" />
            Pausar
          </Button>
        )}

        {recording && (
          <Button type="button" variant="outline" size="sm" onClick={stop}>
            <Square className="mr-2 h-4 w-4" />
            Finalizar
          </Button>
        )}

        {previewUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {previewUrl && <audio controls className="w-full" src={previewUrl} />}
      {error && <div className="text-sm text-rose-600">{error}</div>}
    </div>
  )
}
