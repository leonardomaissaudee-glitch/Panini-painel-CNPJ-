import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { OrderRow } from "@/features/admin/services/adminService"
import { fetchMyOrders } from "@/features/client/services/clientService"
import { getOrderStatusLabel } from "@/shared/constants/orderStatus"
import { StatusBadge } from "@/components/StatusBadge"

const orderTimeline = [
  "aguardando_aprovacao",
  "aguardando_pagamento",
  "pedido_pago",
  "em_expedicao",
  "nota_fiscal_emitida",
  "localizador_disponivel",
  "pedido_entregue",
] as const

export function ClientOrders({
  email,
  onRefreshReady,
}: {
  email: string | undefined
  onRefreshReady?: (refresh: () => Promise<void>) => void
}) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (!email) return

    setLoading(true)
    try {
      const rows = await fetchMyOrders(email)
      setOrders(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar pedidos", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [email])

  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(load)
    }
  }, [onRefreshReady, email])

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Meus pedidos</CardTitle>
          <p className="text-sm text-muted-foreground">Acompanhe cada fase comercial e logística do seu pedido.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold text-slate-950">Pedido {order.id.slice(0, 8).toUpperCase()}</div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-sm text-muted-foreground">
                  Criado em {order.created_at ? new Date(order.created_at).toLocaleString("pt-BR") : "-"}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Total" value={`R$ ${Number(order.total || 0).toFixed(2)}`} />
                <Metric label="NF" value={order.invoice_number || "Aguardando"} />
                <Metric label="Localizador" value={order.tracking_code || "Aguardando"} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>Pagamento: {order.payment_method || "A definir com o gerente"}</p>
                  <p>Status financeiro: {order.payment_status || "pending"}</p>
                  <p>Status atual: {getOrderStatusLabel(order.status)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">Linha do pedido</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {orderTimeline.map((step) => {
                    const isActive = step === normalizeOrderStatus(order.status)
                    const isReached = hasReached(step, normalizeOrderStatus(order.status))

                    return (
                      <div
                        key={step}
                        className={[
                          "rounded-2xl border p-3 text-sm transition",
                          isActive
                            ? "border-blue-900 bg-blue-950 text-white"
                            : isReached
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-slate-50 text-slate-500",
                        ].join(" ")}
                      >
                        {getOrderStatusLabel(step)}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && !loading && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado. Finalize seu primeiro pedido pelo carrinho para começar a acompanhar o fluxo.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function normalizeOrderStatus(status?: string | null) {
  if (status === "novo_pedido") return "aguardando_aprovacao"
  if (status === "pago") return "pedido_pago"
  if (status === "enviado") return "em_expedicao"
  if (status === "nota_fiscal") return "nota_fiscal_emitida"
  if (status === "rastreio") return "localizador_disponivel"
  return (status || "aguardando_aprovacao") as (typeof orderTimeline)[number]
}

function hasReached(target: (typeof orderTimeline)[number], current: (typeof orderTimeline)[number]) {
  return orderTimeline.indexOf(current) >= orderTimeline.indexOf(target)
}
