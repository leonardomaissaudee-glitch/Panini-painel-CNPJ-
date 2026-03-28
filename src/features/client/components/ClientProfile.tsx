import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { supabase } from "@/shared/services/supabaseClient"
import type { Profile } from "@/shared/types/auth"

export function ClientProfile({ profile }: { profile: Profile | null }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    telefone: profile?.telefone ?? "",
    endereco: profile?.endereco ? JSON.stringify(profile.endereco) : "",
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      const enderecoJson = form.endereco ? JSON.parse(form.endereco) : null
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          telefone: form.telefone,
          endereco: enderecoJson,
        })
        .eq("id", profile.id)
      if (error) throw error
      toast.success("Perfil atualizado")
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Nome completo"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        />
        <Input
          placeholder="Telefone"
          value={form.telefone}
          onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
        />
        <Input
          placeholder='Endereço em JSON (rua, cidade...)'
          value={form.endereco}
          onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
        />
        <div className="text-xs text-muted-foreground">
          Documento não pode ser alterado. Para ajuste, contate o suporte.
        </div>
        <Button onClick={handleSave} disabled={saving}>
          Salvar
        </Button>
      </CardContent>
    </Card>
  )
}
