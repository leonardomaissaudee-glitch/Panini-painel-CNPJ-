import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/shared/constants/orderStatus"
import { getOrderStatusLabel } from "@/shared/constants/orderStatus"

type StatusKind =
  | OrderStatus
  | "pending"
  | "approved"
  | "rejected"
  | "blocked"
  | "aberto"
  | "finalizado"
  | "novo"

const styles: Record<StatusKind, string> = {
  aguardando_aprovacao: "bg-amber-100 text-amber-800 border-amber-200",
  aguardando_pagamento: "bg-orange-100 text-orange-800 border-orange-200",
  aguardando_verificacao_financeira: "bg-violet-100 text-violet-800 border-violet-200",
  pedido_pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  em_expedicao: "bg-blue-100 text-blue-800 border-blue-200",
  nota_fiscal_emitida: "bg-indigo-100 text-indigo-800 border-indigo-200",
  localizador_disponivel: "bg-sky-100 text-sky-800 border-sky-200",
  pedido_com_transportadora: "bg-cyan-100 text-cyan-800 border-cyan-200",
  pedido_em_rota: "bg-teal-100 text-teal-800 border-teal-200",
  pedido_entregue: "bg-teal-100 text-teal-800 border-teal-200",
  cancelado: "bg-rose-100 text-rose-800 border-rose-200",
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
  return (
    <Badge variant="outline" className={cn("capitalize", styles[status] ?? "")}>
      {getOrderStatusLabel(status)}
    </Badge>
  )
}
