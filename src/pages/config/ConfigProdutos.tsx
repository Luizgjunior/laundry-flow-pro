import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Produto {
  id: string;
  nome: string;
  fabricante: string | null;
  tipo: string | null;
}

const tiposProduto = ["pre_tratamento", "lavagem", "acabamento"];
const tipoLabels: Record<string, string> = { pre_tratamento: "Pré-tratamento", lavagem: "Lavagem", acabamento: "Acabamento" };

export default function ConfigProdutos() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", fabricante: "", tipo: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("produtos").select("*").order("nome");
    setProdutos((data as Produto[]) || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.nome) return;
    setSaving(true);
    const { error } = await supabase.from("produtos").insert({
      tenant_id: user?.tenant_id,
      nome: form.nome,
      fabricante: form.fabricante || null,
      tipo: form.tipo || null,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    setModalOpen(false);
    toast.success("Produto cadastrado!");
    loadData();
  };

  const deleteProduto = async (id: string) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover: " + error.message); return; }
    setProdutos((prev) => prev.filter((x) => x.id !== id));
    toast.success("Produto removido.");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Produtos" subtitle={`${produtos.length} cadastrados`}
        actions={<Button size="sm" onClick={() => { setForm({ nome: "", fabricante: "", tipo: "" }); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>}
      />
      <div className="px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : produtos.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
          </div>
        ) : (
          produtos.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{p.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {p.fabricante || "—"}{p.tipo ? ` • ${tipoLabels[p.tipo] || p.tipo}` : ""}
                </p>
              </div>
              <button onClick={() => deleteProduto(p.id)} className="p-1.5 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do produto" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input placeholder="Fabricante (opcional)" value={form.fabricante} onChange={(e) => setForm({ ...form, fabricante: e.target.value })} />
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>{tiposProduto.map((t) => <SelectItem key={t} value={t}>{tipoLabels[t]}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={save} className="w-full" disabled={!form.nome || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
