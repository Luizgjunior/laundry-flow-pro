import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Maquina {
  id: string;
  nome: string;
  tipo: string | null;
  capacidade_kg: number | null;
  programas: any[];
  ativa: boolean;
}

const tiposMaquina = ["lavadora", "secadora", "passadeira", "calandra"];

export default function ConfigMaquinas() {
  const { user } = useAuth();
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "", capacidade_kg: "" });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("maquinas").select("*").order("nome");
    setMaquinas((data as Maquina[]) || []);
    setLoading(false);
  };

  const openAdd = () => { setEditId(null); setForm({ nome: "", tipo: "", capacidade_kg: "" }); setModalOpen(true); };

  const save = async () => {
    if (!form.nome) return;
    setSaving(true);
    const payload = {
      tenant_id: user?.tenant_id,
      nome: form.nome,
      tipo: form.tipo || null,
      capacidade_kg: form.capacidade_kg ? +form.capacidade_kg : null,
    };

    if (editId) {
      await supabase.from("maquinas").update(payload).eq("id", editId);
    } else {
      await supabase.from("maquinas").insert(payload);
    }
    setModalOpen(false);
    setSaving(false);
    toast.success("Máquina salva!");
    loadData();
  };

  const toggleAtiva = async (m: Maquina) => {
    await supabase.from("maquinas").update({ ativa: !m.ativa }).eq("id", m.id);
    setMaquinas((prev) => prev.map((x) => x.id === m.id ? { ...x, ativa: !x.ativa } : x));
  };

  const deleteMaquina = async (id: string) => {
    await supabase.from("maquinas").delete().eq("id", id);
    setMaquinas((prev) => prev.filter((x) => x.id !== id));
    toast.success("Máquina removida.");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Máquinas" subtitle={`${maquinas.length} cadastradas`}
        actions={<Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>}
      />
      <div className="px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : maquinas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma máquina cadastrada</p>
            <Button size="sm" className="mt-3" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Primeira Máquina</Button>
          </div>
        ) : (
          maquinas.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${m.ativa ? "text-foreground" : "text-muted-foreground line-through"}`}>{m.nome}</p>
                <p className="text-xs text-muted-foreground">{m.tipo || "—"}{m.capacidade_kg ? ` • ${m.capacidade_kg}kg` : ""}</p>
              </div>
              <button onClick={() => toggleAtiva(m)} className="p-1.5 text-muted-foreground">
                {m.ativa ? <Power className="h-4 w-4 text-green-500" /> : <PowerOff className="h-4 w-4" />}
              </button>
              <button onClick={() => deleteMaquina(m.id)} className="p-1.5 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Editar Máquina" : "Nova Máquina"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da máquina" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>{tiposMaquina.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="Capacidade (kg)" value={form.capacidade_kg} onChange={(e) => setForm({ ...form, capacidade_kg: e.target.value })} />
            <Button onClick={save} className="w-full" disabled={!form.nome || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
