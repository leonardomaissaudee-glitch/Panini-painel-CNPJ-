import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type Props = {
  loading: boolean
  children: React.ReactNode
  className?: string
  type?: "button" | "submit" | "reset"
  variant?: "default" | "outline" | "secondary"
}

export function LoadingButton({ loading, children, className, type = "submit", variant = "default" }: Props) {
  return (
    <Button type={type} className={className} disabled={loading} variant={variant}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {children}
    </Button>
  )
}
