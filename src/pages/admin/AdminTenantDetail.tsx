import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tenant, User } from "@/types/database";

export default function AdminTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ pecas: 0, fotos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    const [tenantRes, usersRes, pecasRes, fotosRes] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", id).single(),
      supabase.from("users").select("*").eq("tenant_id", id),
      supabase.from("pecas").select("id", { count: "exact", head: true }).eq("tenant_id", id),
      supabase.from("fotos").select("id, tamanho_bytes").eq("peca_id", id), // approximate
    ]);
    setTenant(tenantRes.data as Tenant);
    setUsers((usersRes.data as User[]) || []);
    setStats({ pecas: pecasRes.count || 0, fotos: fotosRes.data?.length || 0 });
    setLoading(false);
  };

  const toggleAtivo = async () => {
    if (!tenant) return;
    const { error } = await supabase.from("tenants").update({ ativo: !tenant.ativo }).eq("id", tenant.id);
    if (error) {
      toast.error("Erro ao atualizar tenant.");
    } else {
      toast.success(tenant.ativo ? "Tenant bloqueado." : "Tenant desbloqueado.");
      setTenant({ ...tenant, ativo: !tenant.ativo });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) return <p className="p-4 text-muted-foreground">Tenant não encontrado.</p>;

  const planoPrices: Record<string, number> = { free: 0, starter: 97, pro: 197, enterprise: 497 };

  return (
    <div className="space-y-4">
      <PageHeader
        title={tenant.nome_fantasia}
        subtitle={`CNPJ: ${tenant.cnpj}`}
        actions={
          <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 space-y-3">
        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Plano</p>
            <p className="text-lg font-bold text-foreground capitalize">{tenant.plano}</p>
            <p className="text-xs text-muted-foreground">R$ {planoPrices[tenant.plano]}/mês</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={`text-lg font-bold ${tenant.ativo ? "text-green-600" : "text-destructive"}`}>
              {tenant.ativo ? "Ativo" : "Bloqueado"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Usuários</p>
            <p className="text-lg font-bold text-foreground">{users.length}/{tenant.limite_usuarios}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Peças processadas</p>
            <p className="text-lg font-bold text-foreground">{stats.pecas}</p>
          </div>
        </div>

        {/* Users */}
        <h2 className="text-sm font-semibold text-foreground">Usuários ({users.length})</h2>
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{u.nome}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                  {u.role.replace("_", " ")}
                </span>
                {u.funcao && <p className="text-xs text-muted-foreground mt-0.5">{u.funcao}</p>}
              </div>
            </div>
          </div>
        ))}

        {/* Payments placeholder */}
        <h2 className="text-sm font-semibold text-foreground">Histórico de pagamentos</h2>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Em breve</p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pb-8">
          <Button onClick={toggleAtivo} variant={tenant.ativo ? "destructive" : "default"} className="w-full">
            {tenant.ativo ? <><Ban className="h-4 w-4 mr-2" /> Bloquear Tenant</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Desbloquear Tenant</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
