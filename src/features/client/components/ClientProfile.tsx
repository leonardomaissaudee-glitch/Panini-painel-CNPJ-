import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"
import type { ResellerProfile } from "@/lib/auth"
import { formatCNPJ, formatCPF, formatCEP, formatPhone } from "@/lib/masks"

export function ClientProfile({ profile }: { profile: ResellerProfile | null }) {
  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Não foi possível carregar os dados cadastrais deste cliente.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Perfil empresarial</CardTitle>
            <p className="text-sm text-muted-foreground">Dados do credenciamento enviados no cadastro.</p>
          </div>
          <StatusBadge status={profile.status_cadastro} />
        </CardHeader>
      </Card>

      <Section
        title="Dados da empresa"
        items={[
          ["Razão social", profile.razao_social],
          ["Nome fantasia", profile.nome_fantasia || "-"],
          ["CNPJ", formatCNPJ(profile.cnpj)],
          ["Inscrição estadual", profile.inscricao_estadual || "-"],
          ["Segmento", profile.segmento],
          ["Data de abertura", profile.data_abertura || "-"],
          ["Porte", profile.porte_empresa || "-"],
        ]}
      />

      <Section
        title="Responsável"
        items={[
          ["Nome", profile.nome_responsavel],
          ["CPF", profile.cpf_responsavel ? formatCPF(profile.cpf_responsavel) : "-"],
          ["Cargo", profile.cargo_responsavel || "-"],
          ["Telefone principal", formatPhone(profile.telefone)],
          ["WhatsApp", profile.whatsapp ? formatPhone(profile.whatsapp) : "-"],
          ["E-mail", profile.email],
        ]}
      />

      <Section
        title="Endereço"
        items={[
          ["CEP", formatCEP(profile.cep)],
          ["Endereço", profile.endereco],
          ["Número", profile.numero],
          ["Complemento", profile.complemento || "-"],
          ["Bairro", profile.bairro],
          ["Cidade", profile.cidade],
          ["Estado", profile.estado],
        ]}
      />

      <Section
        title="Informações comerciais"
        items={[
          ["Canal de revenda", profile.canal_revenda],
          ["Trabalha com colecionáveis", profile.trabalha_com_colecionaveis ? "Sim" : "Não"],
          ["Faixa de investimento", profile.faixa_investimento],
          ["Observações", profile.observacoes || "-"],
          ["Gerente comercial", profile.account_manager_name || "-"],
          [
            "WhatsApp do gerente",
            profile.account_manager_whatsapp
              ? formatPhone(profile.account_manager_whatsapp.replace(/\D/g, "").slice(-11))
              : "-",
          ],
        ]}
      />
    </div>
  )
}

function Section({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-2 text-sm font-medium text-slate-900 break-words">{value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
