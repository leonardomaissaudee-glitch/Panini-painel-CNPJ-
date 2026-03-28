import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("w-full rounded-lg border border-dashed bg-muted/40 p-6 text-center space-y-2", className)}>
      {icon && <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>}
      <div className="text-lg font-semibold">{title}</div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
