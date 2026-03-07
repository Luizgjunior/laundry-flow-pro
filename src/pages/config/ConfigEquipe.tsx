import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, MoreVertical, UserCheck, UserX, Pencil, Loader2 } from "lucide-react";

interface TeamUser {
  id: string;
  nome: string;
  email: string;
  role: string;
  funcao: string | null;
  ativo: boolean;
  created_at: string;
}

interface InviteForm {
  nome: string;
  email: string;
  senha: string;
  funcao: string;
  role: "admin_empresa" | "usuario";
}

const emptyForm: InviteForm = { nome: "", email: "", senha: "", funcao: "", role: "usuario" };

export default function ConfigEquipe() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [editFuncao, setEditFuncao] = useState("");
  const [editRole, setEditRole] = useState<"admin_empresa" | "usuario">("usuario");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<TeamUser | null>(null);
  const [form, setForm] = useState<InviteForm>(emptyForm);

  const fetchMembers = async () => {
    if (!user?.tenant_id) return;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", user.tenant_id)
      .order("created_at", { ascending: true });
    if (!error && data) setMembers(data as TeamUser[]);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [user?.tenant_id]);

  const handleInvite = async () => {
    if (!form.nome || !form.email || !form.senha) {
      toast.error("Preencha nome, email e senha");
      return;
    }
    if (form.senha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("invite-member", {
      body: {
        tenant_id: user?.tenant_id,
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        funcao: form.funcao || null,
        role: form.role,
      },
    });
    setSaving(false);
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao convidar membro");
      return;
    }
    toast.success("Membro adicionado com sucesso!");
    setDialogOpen(false);
    setForm(emptyForm);
    fetchMembers();
  };

  const handleToggleAtivo = async () => {
    if (!confirmToggle) return;
    const newAtivo = !confirmToggle.ativo;
    const { error } = await supabase
      .from("users")
      .update({ ativo: newAtivo })
      .eq("id", confirmToggle.id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(newAtivo ? "Usuário ativado" : "Usuário desativado");
      fetchMembers();
    }
    setConfirmToggle(null);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ funcao: editFuncao || null, role: editRole })
      .eq("id", editingUser.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar alterações");
    } else {
      toast.success("Dados atualizados");
      setEditDialogOpen(false);
      fetchMembers();
    }
  };

  const openEdit = (u: TeamUser) => {
    setEditingUser(u);
    setEditFuncao(u.funcao || "");
    setEditRole(u.role as "admin_empresa" | "usuario");
    setEditDialogOpen(true);
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const roleLabel = (role: string) => {
    if (role === "admin_empresa") return "Admin";
    return "Operador";
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <PageHeader
        title="Equipe"
        subtitle={`${members.length} membro(s)`}
        actions={
          <Button size="sm" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Convidar
          </Button>
        }
      />

      <div className="px-4 space-y-3">
        {members.map((m) => (
          <Card key={m.id} className={!m.ativo ? "opacity-60" : ""}>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getInitials(m.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{m.nome}</span>
                  <Badge variant={m.ativo ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {m.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{roleLabel(m.role)}</Badge>
                  {m.funcao && <Badge variant="outline" className="text-[10px]">{m.funcao}</Badge>}
                </div>
              </div>
              {m.id !== user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConfirmToggle(m)}>
                      {m.ativo ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                      {m.ativo ? "Desativar" : "Ativar"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <Label>Função</Label>
              <Input value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value })} placeholder="Ex: Técnico, Recepcionista" />
            </div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin_empresa" | "usuario" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Operador</SelectItem>
                  <SelectItem value="admin_empresa">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Convidar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {editingUser?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Função</Label>
              <Input value={editFuncao} onChange={(e) => setEditFuncao(e.target.value)} placeholder="Ex: Técnico" />
            </div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as "admin_empresa" | "usuario")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Operador</SelectItem>
                  <SelectItem value="admin_empresa">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Toggle */}
      <AlertDialog open={!!confirmToggle} onOpenChange={() => setConfirmToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmToggle?.ativo ? "Desativar" : "Ativar"} {confirmToggle?.nome}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmToggle?.ativo
                ? "O usuário não poderá mais acessar o sistema."
                : "O usuário poderá acessar o sistema novamente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleAtivo}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
