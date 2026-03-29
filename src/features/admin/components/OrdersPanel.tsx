import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  updateOrderStatus,
  uploadOrderPaymentPdf,
  fetchOrders,
  type OrderRow,
  type OrderStatus,
} from "@/features/admin/services/adminService"
import { ORDER_STATUS_OPTIONS } from "@/shared/constants/orderStatus"

export function OrdersPanel() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Record<string, Partial<OrderRow>>>({})
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchOrders()
      setOrders(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar pedidos", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpdate = async (id: string) => {
    const order = orders.find((item) => item.id === id)
    const state = editing[id]
    const nextStatus = (state?.status || order?.status) as OrderStatus | undefined

    if (!nextStatus) {
      toast.error("Defina um status")
      return
    }

    const paymentMethod = order?.payment_method
    const instructions = state?.payment_instructions ?? order?.payment_instructions ?? ""
    const copyPaste = state?.payment_copy_paste ?? order?.payment_copy_paste ?? ""
    const paymentLink = state?.payment_link_url ?? order?.payment_link_url ?? ""
    const boletoLine = state?.payment_boleto_line ?? order?.payment_boleto_line ?? ""
    const boletoPdfUrl = state?.payment_boleto_pdf_url ?? order?.payment_boleto_pdf_url ?? ""

    if (nextStatus === "aguardando_pagamento") {
      if (paymentMethod === "pix" && !instructions.trim() && !copyPaste.trim()) {
        toast.error("Preencha as instruções PIX ou o código copia e cola antes de salvar.")
        return
      }

      if (paymentMethod === "boleto" && !boletoLine.trim() && !boletoPdfUrl.trim()) {
        toast.error("Anexe o boleto em PDF ou informe a linha digitável antes de salvar.")
        return
      }

      if (paymentMethod === "credit_card" && !paymentLink.trim()) {
        toast.error("Informe o link de pagamento do cartão antes de salvar.")
        return
      }
    }

    try {
      await updateOrderStatus(id, nextStatus, {
        invoice_number: state.invoice_number,
        tracking_code: state.tracking_code,
        payment_instructions: state?.payment_instructions,
        payment_copy_paste: state?.payment_copy_paste,
        payment_link_url: state?.payment_link_url,
        payment_boleto_line: state?.payment_boleto_line,
        payment_boleto_pdf_url: state?.payment_boleto_pdf_url,
      })
      toast.success("Pedido atualizado")
      setEditing((prev) => ({ ...prev, [id]: {} }))
      load()
    } catch (e: any) {
      toast.error("Erro ao atualizar", { description: e.message })
    }
  }

  const handlePdfUpload = async (orderId: string, file: File | undefined) => {
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Envie apenas arquivo PDF para o boleto.")
      return
    }

    setUploadingOrderId(orderId)
    try {
      const url = await uploadOrderPaymentPdf(orderId, file)
      setEditing((prev) => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          payment_boleto_pdf_url: url,
        },
      }))
      toast.success("PDF do boleto enviado")
    } catch (e: any) {
      toast.error("Erro no upload do boleto", { description: e.message })
    } finally {
      setUploadingOrderId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Detalhes de pagamento</TableHead>
              <TableHead>NF</TableHead>
              <TableHead>Rastreamento</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-semibold">{order.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                  <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                </TableCell>
                <TableCell>R$ {order.subtotal?.toFixed(2)}</TableCell>
                <TableCell className="font-bold">R$ {order.total?.toFixed(2)}</TableCell>
                <TableCell>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background text-sm"
                    value={editing[order.id]?.status || order.status || "aguardando_aprovacao"}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [order.id]: { ...prev[order.id], status: e.target.value as OrderStatus },
                      }))
                    }
                  >
                    {ORDER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <div className="text-xs">Método: {order.payment_method || "-"}</div>
                  <div className="text-xs">Status: {order.payment_status || "-"}</div>
                  <div className="text-xs">ID: {order.payment_id || "-"}</div>
                </TableCell>
                <TableCell className="min-w-[280px]">
                  <div className="space-y-2">
                    {order.payment_method === "pix" && (
                      <>
                        <Textarea
                          placeholder="Instruções de pagamento PIX"
                          value={editing[order.id]?.payment_instructions ?? order.payment_instructions ?? ""}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [order.id]: { ...prev[order.id], payment_instructions: e.target.value },
                            }))
                          }
                        />
                        <Textarea
                          placeholder="PIX copia e cola"
                          value={editing[order.id]?.payment_copy_paste ?? order.payment_copy_paste ?? ""}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [order.id]: { ...prev[order.id], payment_copy_paste: e.target.value },
                            }))
                          }
                        />
                      </>
                    )}

                    {order.payment_method === "boleto" && (
                      <>
                        <Input
                          placeholder="Linha digitável"
                          value={editing[order.id]?.payment_boleto_line ?? order.payment_boleto_line ?? ""}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [order.id]: { ...prev[order.id], payment_boleto_line: e.target.value },
                            }))
                          }
                        />
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handlePdfUpload(order.id, e.target.files?.[0])}
                            disabled={uploadingOrderId === order.id}
                          />
                          {(editing[order.id]?.payment_boleto_pdf_url ?? order.payment_boleto_pdf_url) && (
                            <a
                              href={editing[order.id]?.payment_boleto_pdf_url ?? order.payment_boleto_pdf_url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-blue-700 underline"
                            >
                              Abrir PDF anexado
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    {order.payment_method === "credit_card" && (
                      <>
                        <Input
                          placeholder="Link de pagamento"
                          value={editing[order.id]?.payment_link_url ?? order.payment_link_url ?? ""}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [order.id]: { ...prev[order.id], payment_link_url: e.target.value },
                            }))
                          }
                        />
                        <Textarea
                          placeholder="Orientações adicionais para o pagamento"
                          value={editing[order.id]?.payment_instructions ?? order.payment_instructions ?? ""}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [order.id]: { ...prev[order.id], payment_instructions: e.target.value },
                            }))
                          }
                        />
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="NF-e"
                    value={editing[order.id]?.invoice_number ?? order.invoice_number ?? ""}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [order.id]: { ...prev[order.id], invoice_number: e.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Código de rastreio"
                    value={editing[order.id]?.tracking_code ?? order.tracking_code ?? ""}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [order.id]: { ...prev[order.id], tracking_code: e.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => handleUpdate(order.id)} disabled={loading}>
                    Salvar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhum pedido
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
