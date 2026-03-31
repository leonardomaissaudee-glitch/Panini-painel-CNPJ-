import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/context/AuthContext"
import { fetchProfile } from "@/features/auth/services/authService"

export default function AdminLoginPage() {
  const { signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const from =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? "/admin"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const session = await signIn(user, password)
      const userId = session?.user?.id
      if (!userId) throw new Error("Usuário não encontrado na sessão.")

      const profile = await fetchProfile(userId, session?.user?.email ?? user)
      if (!profile) throw new Error("Perfil não encontrado.")

      if (profile.role === "admin") {
        toast.success("Login autorizado (admin)")
        navigate("/admin/pedidos", { replace: true })
        return
      }
      if (profile.role === "seller") {
        if (profile.user_type === "gerente") {
          toast.success("Login autorizado (gerente)")
          navigate("/gerente/resumo", { replace: true })
          return
        }

        toast.success("Login autorizado (seller)")
        navigate("/seller", { replace: true })
        return
      }

      await signOut()
      throw new Error("Apenas administradores ou vendedores podem acessar aqui.")
    } catch (error: any) {
      toast.error("Falha no login", { description: error.message || "Verifique suas credenciais." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Badge className="bg-amber-100 text-amber-900 border-amber-200">Acesso restrito</Badge>
          <h1 className="text-3xl font-bold">Login Administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Área exclusiva para administradores e vendedores autorizados.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="user">Usuário ou e-mail</Label>
                <Input
                  id="user"
                  autoComplete="username"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
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
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Clientes e revendedores com CNPJ devem usar <Link to="/login" className="underline">/login</Link>.
        </p>
      </div>
    </div>
  )
}
