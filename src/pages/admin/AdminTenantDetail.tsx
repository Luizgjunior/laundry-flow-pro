import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, Ban, CheckCircle2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tenant, User } from "@/types/database";

const planoPrices: Record<string, number> = { free: 0, starter: 97, pro: 197, enterprise: 497 };

export default function AdminTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [tenant, setTenant] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ pecas: 0, fotos: 0, clientes: 0 });
  const [assinatura, setAssinatura] = useState<any>(null);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    const [tenantRes, usersRes, pecasRes, clientesRes, subRes, fatRes, logsRes] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", id).single(),
      supabase.from("users").select("*").eq("tenant_id", id),
      supabase.from("pecas").select("id", { count: "exact", head: true }).eq("tenant_id", id),
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("tenant_id", id),
      supabase.from("assinaturas").select("*, planos(*)").eq("tenant_id", id).single(),
      supabase.from("faturas").select("*").eq("tenant_id", id).order("created_at", { ascending: false }),
      supabase.from("logs_admin").select("*").eq("entidade_id", id).order("created_at", { ascending: false }).limit(10),
    ]);
    setTenant(tenantRes.data);
    setUsers((usersRes.data as User[]) || []);
    setStats({ pecas: pecasRes.count || 0, fotos: 0, clientes: clientesRes.count || 0 });
    setAssinatura(subRes.data);
    setFaturas(fatRes.data || []);
    setLogs(logsRes.data || []);
    setLoading(false);
  };

  const toggleAtivo = async () => {
    if (!tenant || !adminUser) return;
    const newAtivo = !tenant.ativo;
    await supabase.from("tenants").update({
      ativo: newAtivo,
      bloqueado_em: newAtivo ? null : new Date().toISOString(),
      bloqueio_motivo: newAtivo ? null : "Bloqueado pelo admin",
    }).eq("id", tenant.id);

    await supabase.from("logs_admin").insert({
      admin_id: adminUser.id,
      acao: newAtivo ? "desbloquear_tenant" : "bloquear_tenant",
      entidade_tipo: "tenant",
      entidade_id: tenant.id,
    });

    setTenant({ ...tenant, ativo: newAtivo });
    toast.success(newAtivo ? "Tenant desbloqueado" : "Tenant bloqueado");
  };

  const alterarPlano = async (novoPlano: string) => {
    if (!tenant) return;
    await supabase.from("tenants").update({ plano: novoPlano as any }).eq("id", tenant.id);
    if (adminUser) {
      await supabase.from("logs_admin").insert({
        admin_id: adminUser.id,
        acao: "alterar_plano",
        entidade_tipo: "tenant",
        entidade_id: tenant.id,
        dados_antes: { plano: tenant.plano },
        dados_depois: { plano: novoPlano },
      });
    }
    setTenant({ ...tenant, plano: novoPlano });
    toast.success("Plano alterado para " + novoPlano);
  };

  const marcarFaturaPaga = async (faturaId: string) => {
    await supabase.from("faturas").update({ status: "pago", data_pagamento: new Date().toISOString().split("T")[0] }).eq("id", faturaId);
    setFaturas((prev) => prev.map((f) => f.id === faturaId ? { ...f, status: "pago" } : f));
    toast.success("Fatura marcada como paga");
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!tenant) return <p className="p-4 text-muted-foreground">Tenant não encontrado.</p>;

  return (
    <div className="space-y-4 pb-8">
      <PageHeader title={tenant.nome_fantasia} subtitle={`CNPJ: ${tenant.cnpj}`}
        actions={<button onClick={() => navigate(-1)} className="p-2 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>}
      />

      <div className="px-4">
        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Plano</p>
            <p className="text-lg font-bold text-foreground capitalize">{tenant.plano}</p>
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
            <Progress value={(users.length / tenant.limite_usuarios) * 100} className="h-1 mt-1" />
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Peças</p>
            <p className="text-lg font-bold text-foreground">{stats.pecas}</p>
          </div>
        </div>

        <Tabs defaultValue="geral">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
            <TabsTrigger value="faturas">Faturas</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-3 mt-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-xs text-muted-foreground">Email: {tenant.email || "—"}</p>
              <p className="text-xs text-muted-foreground">Telefone: {tenant.telefone || "—"}</p>
              <p className="text-xs text-muted-foreground">Cadastrado: {format(new Date(tenant.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
              <p className="text-xs text-muted-foreground">Clientes: {stats.clientes}</p>
            </div>
            <div className="flex gap-2">
              <Select value={tenant.plano} onValueChange={alterarPlano}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={toggleAtivo} variant={tenant.ativo ? "destructive" : "default"} size="sm">
                {tenant.ativo ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="assinatura" className="space-y-3 mt-3">
            {assinatura ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-sm"><strong>Plano:</strong> {(assinatura.planos as any)?.nome_exibicao}</p>
                <p className="text-sm"><strong>Ciclo:</strong> {assinatura.ciclo}</p>
                <p className="text-sm"><strong>Status:</strong> {assinatura.status}</p>
                <p className="text-sm"><strong>Início:</strong> {assinatura.data_inicio}</p>
                {assinatura.data_proximo_pagamento && (
                  <p className="text-sm"><strong>Próximo pagamento:</strong> {assinatura.data_proximo_pagamento}</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">Sem assinatura registrada</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="faturas" className="space-y-2 mt-3">
            {faturas.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma fatura</p>
            ) : faturas.map((f) => (
              <div key={f.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{f.numero}</p>
                  <p className="text-xs text-muted-foreground">R$ {Number(f.valor).toFixed(2)} • Venc: {f.data_vencimento}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    f.status === "pago" ? "bg-green-100 text-green-700" :
                    f.status === "vencido" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{f.status}</span>
                  {f.status !== "pago" && (
                    <Button size="sm" variant="ghost" onClick={() => marcarFaturaPaga(f.id)}>
                      <DollarSign className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-2 mt-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{u.nome}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">{u.role.replace("_", " ")}</span>
                  {u.funcao && <p className="text-xs text-muted-foreground mt-0.5">{u.funcao}</p>}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="logs" className="space-y-2 mt-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Nenhum log registrado</p>
            ) : logs.map((l) => (
              <div key={l.id} className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm font-medium text-foreground">{l.acao}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(l.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
