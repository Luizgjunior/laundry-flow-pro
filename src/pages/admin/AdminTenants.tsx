import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ChevronRight, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Tenant } from "@/types/database";

const emptyForm = {
  nome_fantasia: "",
  cnpj: "",
  plano: "free" as const,
  limite_usuarios: "3",
  limite_storage_mb: "500",
  telefone: "",
  email: "",
};

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlano, setFilterPlano] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const navigate = useNavigate();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    setTenants((data as Tenant[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = tenants.filter((t) => {
    if (search) {
      const s = search.toLowerCase();
      if (!t.nome_fantasia.toLowerCase().includes(s) && !t.cnpj.includes(s)) return false;
    }
    if (filterPlano !== "all" && t.plano !== filterPlano) return false;
    if (filterStatus === "ativo" && !t.ativo) return false;
    if (filterStatus === "bloqueado" && t.ativo) return false;
    return true;
  });

  const openAdd = () => {
    setEditTenant(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditTenant(t);
    setForm({
      nome_fantasia: t.nome_fantasia,
      cnpj: t.cnpj,
      plano: t.plano,
      limite_usuarios: String(t.limite_usuarios),
      limite_storage_mb: String(t.limite_storage_mb),
      telefone: (t as any).telefone || "",
      email: (t as any).email || "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.nome_fantasia || !form.cnpj) return;
    setSaving(true);

    const payload = {
      nome_fantasia: form.nome_fantasia,
      cnpj: form.cnpj,
      plano: form.plano,
      limite_usuarios: Number(form.limite_usuarios),
      limite_storage_mb: Number(form.limite_storage_mb),
      telefone: form.telefone || null,
      email: form.email || null,
    };

    const { error } = editTenant
      ? await supabase.from("tenants").update(payload).eq("id", editTenant.id)
      : await supabase.from("tenants").insert(payload);

    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setModalOpen(false);
    toast.success(editTenant ? "Empresa atualizada!" : "Empresa criada!");
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("tenants").delete().eq("id", deleteId);
    setDeleting(false);
    if (error) { toast.error("Erro ao excluir: " + error.message); return; }
    setDeleteId(null);
    toast.success("Empresa excluída!");
    loadData();
  };

  const planos = ["all", "free", "starter", "pro", "enterprise"];
  const statusOpts = ["all", "ativo", "bloqueado"];

  return (
    <div className="space-y-3">
      <PageHeader
        title="Empresas"
        subtitle={`${filtered.length} empresas`}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Nova Empresa
          </Button>
        }
      />

      <div className="px-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar nome ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {planos.map((p) => (
            <button key={p} onClick={() => setFilterPlano(p)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterPlano === p ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
              }`}
            >{p === "all" ? "Todos" : p}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {statusOpts.map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterStatus === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
              }`}
            >{s === "all" ? "Todos" : s === "ativo" ? "Ativos" : "Bloqueados"}</button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada</p>
            <Button size="sm" className="mt-3" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" /> Criar Empresa
            </Button>
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id}
              className="w-full rounded-xl border border-border bg-card p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate(`/admin/tenants/${t.id}`)}
                  className="flex-1 min-w-0 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{t.nome_fantasia}</p>
                    {!t.ativo && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Bloqueado</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">CNPJ: {t.cnpj}</p>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    t.plano === "enterprise" ? "bg-purple-100 text-purple-700" :
                    t.plano === "pro" ? "bg-blue-100 text-blue-700" :
                    t.plano === "starter" ? "bg-green-100 text-green-700" :
                    "bg-muted text-muted-foreground"
                  }`}>{t.plano}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/admin/tenants/${t.id}`)}>
                        <ChevronRight className="h-4 w-4 mr-2" /> Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTenant ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome Fantasia *</Label>
              <Input
                value={form.nome_fantasia}
                onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
                placeholder="Lavanderia Premium"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CNPJ *</Label>
              <Input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plano</Label>
              <Select value={form.plano} onValueChange={(v: any) => setForm({ ...form, plano: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Profissional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Limite Usuários</Label>
                <Input
                  type="number"
                  value={form.limite_usuarios}
                  onChange={(e) => setForm({ ...form, limite_usuarios: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Storage (MB)</Label>
                <Input
                  type="number"
                  value={form.limite_storage_mb}
                  onChange={(e) => setForm({ ...form, limite_storage_mb: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={save} className="w-full" disabled={!form.nome_fantasia || !form.cnpj || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editTenant ? "Salvar Alterações" : "Criar Empresa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados desta empresa (peças, clientes, usuários) serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
