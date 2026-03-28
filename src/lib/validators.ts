import { z } from "zod"
import { unformatCNPJ, unformatCPF, unformatPhone, unformatCEP } from "./masks"

export const cnpjSchema = z
  .string()
  .min(14, "Informe o CNPJ")
  .transform((v) => unformatCNPJ(v))
  .refine((v) => v.length === 14, "CNPJ inválido")

const passwordSchema = z.string().min(8, "Senha deve ter ao menos 8 caracteres")

export const cadastroRevendedorSchema = z
  .object({
    cnpj: cnpjSchema,
    senha: passwordSchema,
    confirmarSenha: passwordSchema,
    razao_social: z.string().min(2, "Razão social obrigatória"),
    nome_fantasia: z.string().optional(),
    inscricao_estadual: z.string().optional(),
    segmento: z.string().min(1, "Selecione o segmento"),
    data_abertura: z.string().optional(),
    porte_empresa: z.string().optional(),
    nome_responsavel: z.string().min(2, "Nome do responsável obrigatório"),
    cpf_responsavel: z.string().optional().transform((v) => unformatCPF(v || "")),
    cargo_responsavel: z.string().optional(),
    telefone: z.string().min(10, "Telefone obrigatório").transform((v) => unformatPhone(v)),
    whatsapp: z.string().optional().transform((v) => unformatPhone(v || "")),
    email: z.string().email("E-mail inválido"),
    cep: z.string().min(8, "CEP obrigatório").transform((v) => unformatCEP(v)),
    endereco: z.string().min(2, "Endereço obrigatório"),
    numero: z.string().min(1, "Número obrigatório"),
    complemento: z.string().optional(),
    bairro: z.string().min(2, "Bairro obrigatório"),
    cidade: z.string().min(2, "Cidade obrigatória"),
    estado: z.string().min(2, "UF obrigatória"),
    canal_revenda: z.string().min(1, "Informe o canal de revenda"),
    trabalha_com_colecionaveis: z.boolean(),
    faixa_investimento: z.string().min(1, "Selecione a faixa"),
    observacoes: z.string().optional(),
    aceitou_veracidade: z.boolean().refine((v) => v, "Necessário confirmar veracidade"),
    aceitou_termos: z.boolean().refine((v) => v, "Necessário aceitar termos"),
    aceitou_contato: z.boolean().refine((v) => v, "Necessário autorizar contato"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  })

export type CadastroRevendedorInput = z.infer<typeof cadastroRevendedorSchema>
