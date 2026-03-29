export type OrderStatus =
  | "aguardando_aprovacao"
  | "aguardando_pagamento"
  | "pedido_pago"
  | "em_expedicao"
  | "nota_fiscal_emitida"
  | "localizador_disponivel"
  | "pedido_entregue"
  | "cancelado"
  | "novo_pedido"
  | "pago"
  | "enviado"
  | "nota_fiscal"
  | "rastreio"

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  aguardando_aprovacao: "Pedido feito · aguardando aprovação",
  aguardando_pagamento: "Aguardando pagamento",
  pedido_pago: "Pedido pago",
  em_expedicao: "Pedido na expedição",
  nota_fiscal_emitida: "Nota fiscal emitida",
  localizador_disponivel: "Localizador disponível",
  pedido_entregue: "Pedido entregue",
  cancelado: "Cancelado",
  novo_pedido: "Pedido feito · aguardando aprovação",
  pago: "Pedido pago",
  enviado: "Pedido na expedição",
  nota_fiscal: "Nota fiscal emitida",
  rastreio: "Localizador disponível",
}

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "aguardando_aprovacao", label: ORDER_STATUS_LABELS.aguardando_aprovacao },
  { value: "aguardando_pagamento", label: ORDER_STATUS_LABELS.aguardando_pagamento },
  { value: "pedido_pago", label: ORDER_STATUS_LABELS.pedido_pago },
  { value: "em_expedicao", label: ORDER_STATUS_LABELS.em_expedicao },
  { value: "nota_fiscal_emitida", label: ORDER_STATUS_LABELS.nota_fiscal_emitida },
  { value: "localizador_disponivel", label: ORDER_STATUS_LABELS.localizador_disponivel },
  { value: "pedido_entregue", label: ORDER_STATUS_LABELS.pedido_entregue },
  { value: "cancelado", label: ORDER_STATUS_LABELS.cancelado },
]

export function getOrderStatusLabel(status?: string | null) {
  if (!status) {
    return "-"
  }

  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status.replaceAll("_", " ")
}
