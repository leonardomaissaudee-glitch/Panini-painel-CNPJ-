import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircleMore, PhoneCall, ShieldCheck } from "lucide-react"
import type { ResellerProfile } from "@/lib/auth"
import { formatPhone } from "@/lib/masks"
import { DEFAULT_MANAGER_WHATSAPP } from "@/shared/constants/accountManagers"

export function ClientSupport({ profile }: { profile: ResellerProfile | null }) {
  const managerName = profile?.account_manager_name || "Gerente comercial designado"
  const managerWhatsapp = profile?.account_manager_whatsapp || DEFAULT_MANAGER_WHATSAPP
  const normalizedPhone = managerWhatsapp.replace(/\D/g, "")
  const displayPhone = formatPhone(normalizedPhone.slice(-11))

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá, ${managerName}. Sou ${profile?.razao_social || "revendedor"} e preciso de apoio no meu atendimento comercial.`
    )
    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, "_blank")
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Fale com seu Gerente Comercial</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-6 text-white">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            Atendimento dedicado
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">{managerName}</h3>
            <p className="text-sm text-slate-200">
              Seu cadastro e seus pedidos seguem com atendimento exclusivo. Use esse canal para liberar pagamento,
              acompanhar expedição, solicitar nota fiscal e consultar localizador.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoPill icon={PhoneCall} label="WhatsApp comercial" value={displayPhone} />
            <InfoPill icon={ShieldCheck} label="Canal prioritário" value="Atendimento do cliente aprovado" />
          </div>
          <Button className="h-11 rounded-full bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={openWhatsApp}>
            <MessageCircleMore className="mr-2 h-4 w-4" />
            Enviar mensagem no WhatsApp
          </Button>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-800">O que tratar aqui</div>
          <ul className="space-y-3 text-sm text-slate-700">
            <li>• Liberação do pedido para pagamento.</li>
            <li>• Confirmação de pagamento e documentação fiscal.</li>
            <li>• Atualização de expedição, rastreio e entrega.</li>
            <li>• Reposição, volumes e estratégia comercial do catálogo.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PhoneCall
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
        <Icon className="h-4 w-4 text-amber-300" />
        {label}
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  )
}
