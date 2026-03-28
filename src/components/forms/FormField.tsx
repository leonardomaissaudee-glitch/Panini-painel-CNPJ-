import { cn } from "@/lib/utils"
import { ReactNode } from "react"

type Props = {
  label: string
  description?: string
  error?: string
  children: ReactNode
}

export function FormField({ label, description, error, children }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

type SectionProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function FormSection({ title, subtitle, children }: SectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

export function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
        className
      )}
      {...rest}
    />
  )
}
