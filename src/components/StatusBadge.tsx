import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusKind =
  | "novo_pedido"
  | "pago"
  | "enviado"
  | "nota_fiscal"
  | "rastreio"
  | "pending"
  | "approved"
  | "rejected"
  | "blocked"
  | "aberto"
  | "finalizado"
  | "novo"

const styles: Record<StatusKind, string> = {
  novo_pedido: "bg-amber-100 text-amber-800 border-amber-200",
  pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  enviado: "bg-blue-100 text-blue-800 border-blue-200",
  nota_fiscal: "bg-indigo-100 text-indigo-800 border-indigo-200",
  rastreio: "bg-sky-100 text-sky-800 border-sky-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  blocked: "bg-rose-100 text-rose-800 border-rose-200",
  aberto: "bg-blue-100 text-blue-800 border-blue-200",
  finalizado: "bg-slate-100 text-slate-800 border-slate-200",
  novo: "bg-amber-100 text-amber-800 border-amber-200",
}

export function StatusBadge({ status }: { status: StatusKind | null | undefined }) {
  if (!status) return null
  const label = status.replace("_", " ")
  return (
    <Badge variant="outline" className={cn("capitalize", styles[status] ?? "")}>
      {label}
    </Badge>
  )
}
