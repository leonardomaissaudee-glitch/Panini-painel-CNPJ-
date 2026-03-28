import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  deleteProduct,
  fetchProducts,
  upsertProduct,
  type ProductRow,
} from "@/features/admin/services/adminService"

const emptyForm: Partial<ProductRow> = { nome: "", descricao: "", preco: 0, imagem_url: "", ativo: true }

export function ProductsPanel() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [form, setForm] = useState<Partial<ProductRow>>(emptyForm)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchProducts()
      setProducts(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar produtos", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    if (!form.nome || form.preco === undefined) {
      toast.error("Informe nome e preço")
      return
    }
    try {
      await upsertProduct(form as any)
      toast.success("Produto salvo")
      setForm(emptyForm)
      load()
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e.message })
    }
  }

  const handleEdit = (p: ProductRow) => {
    setForm({ ...p })
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      toast.success("Produto removido")
      load()
    } catch (e: any) {
      toast.error("Erro ao remover", { description: e.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Nome"
            value={form.nome || ""}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          />
          <Input
            placeholder="Preço (ex: 199.90)"
            type="number"
            step="0.01"
            value={form.preco ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, preco: Number(e.target.value) }))}
          />
          <Input
            placeholder="Imagem URL"
            value={form.imagem_url || ""}
            onChange={(e) => setForm((f) => ({ ...f, imagem_url: e.target.value }))}
          />
          <Input
            placeholder="Descrição"
            value={form.descricao || ""}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          />
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.ativo ?? true}
              onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: Boolean(v) }))}
            />
            <span className="text-sm">Ativo</span>
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>
              {form.id ? "Atualizar" : "Criar"}
            </Button>
            <Button variant="outline" onClick={() => setForm(emptyForm)}>
              Limpar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell>R$ {p.preco?.toFixed(2)}</TableCell>
                  <TableCell>{p.ativo ? "Sim" : "Não"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum produto cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
