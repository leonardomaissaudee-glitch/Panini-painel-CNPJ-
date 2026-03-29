import { useMemo, useState, type ComponentType } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, BadgeCheck, Building2, ShieldCheck, Sparkles } from "lucide-react"
import { Footer } from "@/components/Footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckboxField } from "@/components/forms/CheckboxField"
import { FormField, FormSection, InputBase } from "@/components/forms/FormField"
import { InputMasked } from "@/components/forms/InputMasked"
import { LoadingButton } from "@/components/forms/LoadingButton"
import { SelectField } from "@/components/forms/SelectField"
import { FormError } from "@/components/feedback/FormFeedback"
import { registerReseller } from "@/lib/auth"
import { formatCEP, formatCNPJ, formatCPF, formatPhone } from "@/lib/masks"
import { cadastroRevendedorSchema } from "@/lib/validators"

type CadastroFormState = {
  cnpj: string
  senha: string
  confirmarSenha: string
  razao_social: string
  nome_fantasia: string
  inscricao_estadual: string
  segmento: string
  data_abertura: string
  porte_empresa: string
  nome_responsavel: string
  cpf_responsavel: string
  cargo_responsavel: string
  telefone: string
  whatsapp: string
  email: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  canal_revenda: string
  trabalha_com_colecionaveis: boolean | null
  faixa_investimento: string
  observacoes: string
  aceitou_veracidade: boolean
  aceitou_termos: boolean
  aceitou_contato: boolean
}

const initialFormData: CadastroFormState = {
  cnpj: "",
  senha: "",
  confirmarSenha: "",
  razao_social: "",
  nome_fantasia: "",
  inscricao_estadual: "",
  segmento: "",
  data_abertura: "",
  porte_empresa: "",
  nome_responsavel: "",
  cpf_responsavel: "",
  cargo_responsavel: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  canal_revenda: "",
  trabalha_com_colecionaveis: null,
  faixa_investimento: "",
  observacoes: "",
  aceitou_veracidade: false,
  aceitou_termos: false,
  aceitou_contato: false,
}

const segmentos = [
  "Papelaria",
  "Banca de jornal",
  "Loja de brinquedos",
  "Loja de colecionáveis",
  "Supermercado",
  "Distribuidora",
  "Loja de variedades",
  "E-commerce",
  "Outro",
]

const portes = ["MEI", "Microempresa", "Empresa de pequeno porte", "Médio porte", "Grande porte"]

const canais = ["Loja física", "Loja física e online", "E-commerce", "Distribuição", "Revenda local", "Outro"]

const faixasInvestimento = ["Até R$ 800", "De R$ 800 a R$ 2.499", "De R$ 2.500 a R$ 4.999", "Acima de R$ 5.000"]

const estados = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

function mapFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  return Object.entries(fieldErrors).reduce<Record<string, string>>((acc, [field, messages]) => {
    if (messages?.[0]) {
      acc[field] = messages[0]
    }
    return acc
  }, {})
}

export default function CadastroPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CadastroFormState>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const introStats = useMemo(
    () => [
      { title: "Fluxo empresarial", desc: "Cadastro estruturado para análise cadastral e abertura comercial." },
      { title: "Dados protegidos", desc: "Uso exclusivo para credenciamento, contato e andamento do processo." },
      { title: "Gerente de contas", desc: "Acompanhamento comercial após envio e validação cadastral." },
    ],
    []
  )

  function updateField<K extends keyof CadastroFormState>(field: K, value: CadastroFormState[K]) {
    setFormData((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      if (!current[field as string]) {
        return current
      }

      const next = { ...current }
      delete next[field as string]
      return next
    })
    setSubmitError("")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError("")

    const parsed = cadastroRevendedorSchema.safeParse(formData)

    if (!parsed.success) {
      setFieldErrors(mapFieldErrors(parsed.error.flatten().fieldErrors))
      return
    }

    setFieldErrors({})
    setSubmitting(true)

    try {
      await registerReseller(parsed.data)
      navigate("/cadastro/sucesso", {
        replace: true,
        state: {
          razaoSocial: parsed.data.razao_social,
          email: parsed.data.email,
        },
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível enviar o cadastro.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_28%,#fffdf7_100%)] text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,213,79,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.2),transparent_24%)]" />
        <div className="container relative mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-amber-300 bg-amber-200 text-amber-950">Credenciamento empresarial</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                Cadastro de Revendedor Panini
              </h1>
              <p className="max-w-2xl text-lg text-slate-100/90">
                Preencha suas informações empresariais para iniciar seu credenciamento como revendedor dos produtos
                Panini da Copa do Mundo FIFA 2026™.
              </p>
              <p className="max-w-2xl text-sm text-slate-200">
                Processo seguro, organizado e com acompanhamento comercial após análise cadastral.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {introStats.map((item) => (
                <Card key={item.title} className="border-white/10 bg-white/8 text-white shadow-none backdrop-blur">
                  <CardContent className="space-y-2 p-4">
                    <div className="text-sm font-semibold">{item.title}</div>
                    <p className="text-xs text-slate-200">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoPill icon={BadgeCheck} title="Sem taxa de adesão" />
                <InfoPill icon={Building2} title="Análise empresarial" />
                <InfoPill icon={ShieldCheck} title="Atendimento exclusivo" />
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/30 p-6 text-sm text-slate-100">
                Seus dados serão utilizados exclusivamente para análise cadastral, contato comercial e continuidade do
                processo de credenciamento.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[0.36fr,0.64fr]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden border-blue-100 shadow-xl">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Próximos passos</div>
                <h2 className="text-2xl font-bold text-slate-950">Credenciamento com análise comercial</h2>
                <p className="text-sm text-muted-foreground">
                  Após o envio, um gerente de contas dará sequência ao atendimento conforme os dados informados.
                </p>
              </div>

              <div className="space-y-4">
                <StepItem
                  number="1"
                  title="Envio do cadastro"
                  description="Validação dos dados empresariais e criação do acesso inicial."
                />
                <StepItem
                  number="2"
                  title="Análise cadastral"
                  description="Conferência comercial e alinhamento do canal de revenda."
                />
                <StepItem
                  number="3"
                  title="Atendimento dedicado"
                  description="Gerente de contas acompanha ativação, pedido e próximos passos."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 shadow-lg">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <div className="font-semibold text-slate-950">Antes de enviar</div>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Informe o CNPJ exatamente como consta no cadastro empresarial.</li>
                <li>• Use um e-mail operacional para contato, atualização cadastral e nota fiscal.</li>
                <li>• Revise telefone e WhatsApp para acelerar o atendimento comercial.</li>
              </ul>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.48)]">
            <CardContent className="p-6 md:p-8">
              <div className="mb-8 space-y-3">
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Formulário empresarial</div>
                <h2 className="text-3xl font-bold text-slate-950">Preencha todas as etapas do credenciamento</h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Campos obrigatórios estão marcados e os dados são validados antes do envio. O acesso do revendedor
                  utiliza CNPJ e senha na experiência do usuário, com autenticação estruturada em ambiente seguro.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <FormError message={submitError} />

                <FormSection
                  title="1. Dados de acesso"
                  subtitle="O login do revendedor será feito com CNPJ e senha. Internamente, o sistema protege a autenticação com Supabase Auth."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField label="CNPJ *" error={fieldErrors.cnpj}>
                      <InputMasked
                        placeholder="00.000.000/0000-00"
                        value={formData.cnpj}
                        onChange={(event) => updateField("cnpj", formatCNPJ(event.target.value))}
                        maxLength={18}
                        inputMode="numeric"
                        autoComplete="off"
                        className={fieldErrors.cnpj ? "border-red-400 focus:border-red-500 focus:ring-red-100" : undefined}
                      />
                    </FormField>
                    <FormField label="Senha *" error={fieldErrors.senha}>
                      <InputBase
                        type="password"
                        placeholder="Crie uma senha forte"
                        value={formData.senha}
                        onChange={(event) => updateField("senha", event.target.value)}
                        autoComplete="new-password"
                      />
                    </FormField>
                    <FormField label="Confirmar senha *" error={fieldErrors.confirmarSenha}>
                      <InputBase
                        type="password"
                        placeholder="Repita a senha"
                        value={formData.confirmarSenha}
                        onChange={(event) => updateField("confirmarSenha", event.target.value)}
                        autoComplete="new-password"
                      />
                    </FormField>
                  </div>
                </FormSection>

                <FormSection title="2. Dados da empresa" subtitle="Informações institucionais do CNPJ que será analisado.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Razão social *" error={fieldErrors.razao_social}>
                      <InputBase
                        placeholder="Ex.: Comércio Panini Brasil Ltda"
                        value={formData.razao_social}
                        onChange={(event) => updateField("razao_social", event.target.value)}
                      />
                    </FormField>
                    <FormField label="Nome fantasia" error={fieldErrors.nome_fantasia}>
                      <InputBase
                        placeholder="Como sua empresa é conhecida"
                        value={formData.nome_fantasia}
                        onChange={(event) => updateField("nome_fantasia", event.target.value)}
                      />
                    </FormField>
                    <FormField label="Inscrição estadual" error={fieldErrors.inscricao_estadual}>
                      <InputBase
                        placeholder="Se houver"
                        value={formData.inscricao_estadual}
                        onChange={(event) => updateField("inscricao_estadual", event.target.value)}
                      />
                    </FormField>
                    <SelectField
                      label="Segmento da empresa *"
                      placeholder="Selecione o segmento"
                      value={formData.segmento}
                      onChange={(value) => updateField("segmento", value)}
                      options={segmentos.map((segmento) => ({ value: segmento, label: segmento }))}
                      error={fieldErrors.segmento}
                    />
                    <FormField label="Data de abertura" error={fieldErrors.data_abertura}>
                      <InputBase
                        type="date"
                        value={formData.data_abertura}
                        onChange={(event) => updateField("data_abertura", event.target.value)}
                      />
                    </FormField>
                    <SelectField
                      label="Porte da empresa"
                      placeholder="Selecione o porte"
                      value={formData.porte_empresa}
                      onChange={(value) => updateField("porte_empresa", value)}
                      options={portes.map((porte) => ({ value: porte, label: porte }))}
                      error={fieldErrors.porte_empresa}
                    />
                  </div>
                </FormSection>

                <FormSection title="3. Responsável" subtitle="Pessoa de contato para análise e continuidade do atendimento.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Nome completo do responsável *" error={fieldErrors.nome_responsavel}>
                      <InputBase
                        placeholder="Nome completo"
                        value={formData.nome_responsavel}
                        onChange={(event) => updateField("nome_responsavel", event.target.value)}
                      />
                    </FormField>
                    <FormField label="CPF do responsável" error={fieldErrors.cpf_responsavel}>
                      <InputMasked
                        placeholder="000.000.000-00"
                        value={formData.cpf_responsavel}
                        onChange={(event) => updateField("cpf_responsavel", formatCPF(event.target.value))}
                        maxLength={14}
                        inputMode="numeric"
                        className={fieldErrors.cpf_responsavel ? "border-red-400 focus:border-red-500 focus:ring-red-100" : undefined}
                      />
                    </FormField>
                    <FormField label="Cargo" error={fieldErrors.cargo_responsavel}>
                      <InputBase
                        placeholder="Ex.: Comprador, Diretor, Proprietário"
                        value={formData.cargo_responsavel}
                        onChange={(event) => updateField("cargo_responsavel", event.target.value)}
                      />
                    </FormField>
                    <FormField label="Telefone principal *" error={fieldErrors.telefone}>
                      <InputMasked
                        placeholder="(00) 00000-0000"
                        value={formData.telefone}
                        onChange={(event) => updateField("telefone", formatPhone(event.target.value))}
                        maxLength={15}
                        inputMode="tel"
                        className={fieldErrors.telefone ? "border-red-400 focus:border-red-500 focus:ring-red-100" : undefined}
                      />
                    </FormField>
                    <FormField label="WhatsApp" error={fieldErrors.whatsapp}>
                      <InputMasked
                        placeholder="(00) 00000-0000"
                        value={formData.whatsapp}
                        onChange={(event) => updateField("whatsapp", formatPhone(event.target.value))}
                        maxLength={15}
                        inputMode="tel"
                        className={fieldErrors.whatsapp ? "border-red-400 focus:border-red-500 focus:ring-red-100" : undefined}
                      />
                    </FormField>
                    <FormField label="E-mail para contato e nota fiscal *" error={fieldErrors.email}>
                      <InputBase
                        type="email"
                        placeholder="contato@empresa.com.br"
                        value={formData.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        autoComplete="email"
                      />
                    </FormField>
                  </div>
                </FormSection>

                <FormSection title="4. Endereço" subtitle="Endereço de referência do cadastro empresarial.">
                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField label="CEP *" error={fieldErrors.cep}>
                      <InputMasked
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={(event) => updateField("cep", formatCEP(event.target.value))}
                        maxLength={9}
                        inputMode="numeric"
                        className={fieldErrors.cep ? "border-red-400 focus:border-red-500 focus:ring-red-100" : undefined}
                      />
                    </FormField>
                    <div className="md:col-span-2">
                      <FormField label="Endereço *" error={fieldErrors.endereco}>
                        <InputBase
                          placeholder="Rua, avenida ou logradouro"
                          value={formData.endereco}
                          onChange={(event) => updateField("endereco", event.target.value)}
                        />
                      </FormField>
                    </div>
                    <FormField label="Número *" error={fieldErrors.numero}>
                      <InputBase
                        placeholder="Número"
                        value={formData.numero}
                        onChange={(event) => updateField("numero", event.target.value)}
                      />
                    </FormField>
                    <FormField label="Complemento" error={fieldErrors.complemento}>
                      <InputBase
                        placeholder="Sala, bloco, loja"
                        value={formData.complemento}
                        onChange={(event) => updateField("complemento", event.target.value)}
                      />
                    </FormField>
                    <FormField label="Bairro *" error={fieldErrors.bairro}>
                      <InputBase
                        placeholder="Bairro"
                        value={formData.bairro}
                        onChange={(event) => updateField("bairro", event.target.value)}
                      />
                    </FormField>
                    <FormField label="Cidade *" error={fieldErrors.cidade}>
                      <InputBase
                        placeholder="Cidade"
                        value={formData.cidade}
                        onChange={(event) => updateField("cidade", event.target.value)}
                      />
                    </FormField>
                    <SelectField
                      label="Estado *"
                      placeholder="UF"
                      value={formData.estado}
                      onChange={(value) => updateField("estado", value)}
                      options={estados.map((estado) => ({ value: estado, label: estado }))}
                      error={fieldErrors.estado}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="5. Informações comerciais"
                  subtitle="Informações iniciais para direcionar o atendimento e o perfil de operação."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label="Tipo de canal de revenda *"
                      placeholder="Selecione o canal"
                      value={formData.canal_revenda}
                      onChange={(value) => updateField("canal_revenda", value)}
                      options={canais.map((canal) => ({ value: canal, label: canal }))}
                      error={fieldErrors.canal_revenda}
                    />
                    <SelectField
                      label="Já trabalha com produtos colecionáveis? *"
                      placeholder="Selecione uma opção"
                      value={
                        formData.trabalha_com_colecionaveis === null
                          ? ""
                          : formData.trabalha_com_colecionaveis
                            ? "sim"
                            : "nao"
                      }
                      onChange={(value) => updateField("trabalha_com_colecionaveis", value ? value === "sim" : null)}
                      options={[
                        { value: "sim", label: "Sim" },
                        { value: "nao", label: "Não" },
                      ]}
                      error={fieldErrors.trabalha_com_colecionaveis}
                    />
                    <SelectField
                      label="Faixa inicial de investimento pretendida *"
                      placeholder="Selecione a faixa"
                      value={formData.faixa_investimento}
                      onChange={(value) => updateField("faixa_investimento", value)}
                      options={faixasInvestimento.map((faixa) => ({ value: faixa, label: faixa }))}
                      error={fieldErrors.faixa_investimento}
                    />
                    <FormField label="Observações adicionais" error={fieldErrors.observacoes}>
                      <textarea
                        className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Descreva informações relevantes sobre sua operação, região de atuação ou interesse comercial."
                        value={formData.observacoes}
                        onChange={(event) => updateField("observacoes", event.target.value)}
                      />
                    </FormField>
                  </div>
                </FormSection>

                <FormSection title="6. Confirmações" subtitle="Aceites necessários para conclusão do credenciamento.">
                  <div className="space-y-3">
                    <CheckboxField
                      label="Confirmo que os dados informados são verdadeiros."
                      checked={formData.aceitou_veracidade}
                      onChange={(checked) => updateField("aceitou_veracidade", checked)}
                      error={fieldErrors.aceitou_veracidade}
                    />
                    <CheckboxField
                      label="Concordo com os termos e política de privacidade."
                      checked={formData.aceitou_termos}
                      onChange={(checked) => updateField("aceitou_termos", checked)}
                      error={fieldErrors.aceitou_termos}
                    />
                    <CheckboxField
                      label="Autorizo o contato da equipe comercial para continuidade do atendimento."
                      checked={formData.aceitou_contato}
                      onChange={(checked) => updateField("aceitou_contato", checked)}
                      error={fieldErrors.aceitou_contato}
                    />
                  </div>
                </FormSection>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-slate-950">Pronto para enviar o cadastro</div>
                      <p className="text-sm text-muted-foreground">
                        Após o envio, você receberá o retorno da equipe comercial e poderá acompanhar a evolução pelo
                        login com CNPJ.
                      </p>
                    </div>
                    <LoadingButton
                      loading={submitting}
                      className="h-12 rounded-full bg-amber-400 px-6 text-sm font-semibold text-slate-950 hover:bg-amber-300"
                    >
                      Enviar cadastro
                    </LoadingButton>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 px-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Já iniciou seu credenciamento e quer acompanhar o status?</span>
            <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-blue-700 transition hover:text-blue-600">
              Acessar área de revendedor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function StepItem({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-semibold text-white">
        {number}
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-slate-950">{title}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function InfoPill({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
      <Icon className="h-4 w-4 text-amber-300" />
      <span className="font-medium">{title}</span>
    </div>
  )
}
