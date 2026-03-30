import { useEffect, useMemo, useState, type FormEvent } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatPhone, unformatPhone } from "@/lib/masks"
import type { ChatConversationFormInput } from "@/features/chat/types"

const schema = z.object({
  name: z.string().trim().min(3, "Informe seu nome."),
  phone: z.string().trim().min(10, "Informe telefone ou WhatsApp."),
  email: z.union([z.literal(""), z.string().trim().email("Informe um e-mail válido.")]),
  reason: z.string().trim().min(4, "Informe o motivo do contato."),
  orderReference: z.string().trim().optional(),
  initialMessage: z.string().trim().optional(),
})

type FormValues = {
  name: string
  phone: string
  email: string
  reason: string
  orderReference: string
  initialMessage: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

function buildInitialValues(initialValues?: Partial<ChatConversationFormInput>): FormValues {
  return {
    name: initialValues?.name || "",
    phone: initialValues?.phone ? formatPhone(initialValues.phone) : "",
    email: initialValues?.email || "",
    reason: initialValues?.reason || "",
    orderReference: initialValues?.orderReference || "",
    initialMessage: initialValues?.initialMessage || "",
  }
}

export function ChatStartForm({
  initialValues,
  loading,
  onSubmit,
}: {
  initialValues?: Partial<ChatConversationFormInput>
  loading?: boolean
  onSubmit: (values: ChatConversationFormInput) => Promise<void> | void
}) {
  const seedValues = useMemo(() => buildInitialValues(initialValues), [initialValues])
  const [values, setValues] = useState<FormValues>(seedValues)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setValues(seedValues)
    setErrors({})
  }, [seedValues])

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: field === "phone" ? formatPhone(value) : value,
    }))

    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = schema.safeParse(values)

    if (!parsed.success) {
      const nextErrors: FormErrors = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]
        if (typeof path === "string" && !(path in nextErrors)) {
          nextErrors[path as keyof FormValues] = issue.message
        }
      }
      setErrors(nextErrors)
      return
    }

    await onSubmit({
      name: parsed.data.name,
      phone: unformatPhone(parsed.data.phone),
      email: parsed.data.email,
      reason: parsed.data.reason,
      orderReference: parsed.data.orderReference || "",
      initialMessage: parsed.data.initialMessage || "",
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Iniciar atendimento</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <Input
              value={values.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="Nome do responsável"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Telefone ou WhatsApp</label>
            <Input
              value={values.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              placeholder="(00) 00000-0000"
            />
            <FieldError message={errors.phone} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <Input
              value={values.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="contato@empresa.com"
            />
            <FieldError message={errors.email} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Motivo do contato</label>
            <Input
              value={values.reason}
              onChange={(event) => handleChange("reason", event.target.value)}
              placeholder="Pedido, cadastro, boleto, catálogo..."
            />
            <FieldError message={errors.reason} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Pedido ou referência</label>
            <Input
              value={values.orderReference}
              onChange={(event) => handleChange("orderReference", event.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Mensagem inicial</label>
            <Textarea
              value={values.initialMessage}
              onChange={(event) => handleChange("initialMessage", event.target.value)}
              placeholder="Descreva brevemente sua necessidade."
            />
          </div>

          <div className="flex justify-end md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar atendimento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <div className="text-sm text-rose-600">{message}</div>
}
