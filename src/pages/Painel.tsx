import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

type Profile = {
  razao_social: string
  cnpj: string
  status_cadastro: string
}

export default function PainelPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        navigate("/login")
        return
      }
      const { data: profileData } = await supabase
        .from("reseller_profiles")
        .select("razao_social, cnpj, status_cadastro")
        .eq("user_id", data.user.id)
        .single()
      setProfile(profileData as Profile | null)
      setLoading(false)
    })
  }, [navigate])

  const logout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Painel do Revendedor</h1>
          <p className="text-muted-foreground">Acompanhe seu cadastro e prossiga com o atendimento.</p>
        </div>

        <Card className="max-w-xl">
          <CardContent className="p-6 space-y-2">
            {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!loading && profile && (
              <>
                <div className="text-lg font-semibold">{profile.razao_social}</div>
                <div className="text-sm text-muted-foreground">CNPJ: {profile.cnpj}</div>
                <div className="text-sm">
                  Status do cadastro: <span className="font-semibold">{profile.status_cadastro}</span>
                </div>
              </>
            )}
            {!loading && !profile && <p className="text-sm text-red-600">Perfil não encontrado.</p>}
          </CardContent>
        </Card>

        <Button variant="outline" onClick={logout}>Sair</Button>
      </div>
    </div>
  )
}
