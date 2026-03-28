import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/context/AuthContext"

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [tipoDocumento, setTipoDocumento] = useState<"cpf" | "cnpj">("cpf")
  const [documento, setDocumento] = useState("")
  const [telefone, setTelefone] = useState("")
  const [endereco, setEndereco] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp({ email, password, fullName, documento, tipo_documento: tipoDocumento, telefone, endereco })
      toast.success("Cadastro enviado", {
        description: "Sua conta ficará pendente até aprovação manual.",
      })
      navigate("/login")
    } catch (error: any) {
      toast.error("Não foi possível cadastrar", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">Cadastro corporativo</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Crie sua conta</h1>
          <p className="text-muted-foreground">
            Informe seus dados. O cadastro será analisado e você receberá acesso conforme seu perfil (admin, seller ou client).
          </p>
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="text-sm font-semibold">Importante</div>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Use CPF ou CNPJ válido.</li>
                <li>Cadastro começa com status pendente.</li>
                <li>Após aprovado, você acessa o painel correspondente.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Dados de acesso</CardTitle>
            <p className="text-sm text-muted-foreground">Todos os campos obrigatórios.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background text-sm"
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value as "cpf" | "cnpj")}
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="documento">{tipoDocumento === "cpf" ? "CPF" : "CNPJ"}</Label>
                  <Input
                    id="documento"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder={tipoDocumento === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro, cidade/UF"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Cadastrar"}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Já tem conta?{" "}
                <Link to="/login" className="text-primary underline">
                  Entrar
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
