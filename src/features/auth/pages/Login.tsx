import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/context/AuthContext"
import { fetchProfile } from "@/features/auth/services/authService"

export default function LoginPage() {
  const { signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cnpj, setCnpj] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const from =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const digits = cnpj.replace(/\D/g, "")
      if (digits.length !== 14) throw new Error("Informe um CNPJ válido (14 dígitos).")

      const session = await signIn(digits, password)
      const userId = session?.user?.id
      if (!userId) throw new Error("Usuário não encontrado na sessão.")

      const profile = await fetchProfile(userId)

      if (!profile) throw new Error("Perfil não encontrado.")

      if (profile.status_cadastro === "pending") {
        toast.info("Seu cadastro está pendente de aprovação.")
        await signOut()
        navigate("/login", { replace: true })
        return
      }

      if (profile.status_cadastro === "rejected" || profile.status_cadastro === "blocked") {
        toast.error(profile.status_cadastro === "blocked" ? "Cadastro bloqueado" : "Cadastro reprovado", {
          description: profile.motivo_reprovacao || "Entre em contato com o suporte.",
        })
        await signOut()
        navigate("/login", { replace: true })
        return
      }

      toast.success("Login realizado")

      // Redireciona por role ou pela rota anterior
      const rolePath =
        profile.role === "admin" ? "/admin" : profile.role === "seller" ? "/seller" : "/app"
      navigate(from !== "/" ? from : rolePath, { replace: true })
    } catch (error: any) {
      toast.error("Falha no login", { description: error.message || "Verifique suas credenciais." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">Acesso exclusivo CNPJ</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Área de revenda Panini</h1>
          <p className="text-muted-foreground">
            Entre com o CNPJ aprovado e a senha definida no cadastro para acessar o painel de cliente.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 bg-muted/30 border rounded-lg p-3">
            <li>• Somente empresas com CNPJ aprovado.</li>
            <li>• Catálogo e pedidos liberados após login.</li>
            <li>• Admin/Seller usam a rota dedicada /loginadmin.</li>
          </ul>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Entrar com CNPJ</CardTitle>
            <p className="text-sm text-muted-foreground">Informe CNPJ e senha cadastrados.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 14)
                    const formatted = onlyDigits
                      .replace(/^(\d{2})(\d)/, "$1.$2")
                      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                      .replace(/\.(\d{3})(\d)/, ".$1/$2")
                      .replace(/(\d{4})(\d)/, "$1-$2")
                    setCnpj(formatted)
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link to="/register" className="text-primary underline">
                  Cadastre-se
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
