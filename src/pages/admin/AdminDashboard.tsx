import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Users, DollarSign, HardDrive, TrendingDown, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Tenant } from "@/types/database";

const PLAN_COLORS: Record<string, string> = { free: "#9CA3AF", starter: "#22C55E", pro: "#2563EB", enterprise: "#7C3AED" };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ tenants: 0, ativos: 0, mrr: 0, totalUsers: 0, churn: 0 });
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [planDistribution, setPlanDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [alerts, setAlerts] = useState<{ type: string; message: string; link?: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [tenantsRes, usersRes, faturasRes] = await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("faturas").select("*").eq("status", "vencido"),
    ]);

    const tenants = (tenantsRes.data || []) as any[];
    const ativos = tenants.filter((t) => t.ativo).length;

    // Calculate MRR from assinaturas
    const { data: assinaturas } = await supabase.from("assinaturas").select("*, planos(preco_mensal, preco_anual)").eq("status", "active");
    const mrr = (assinaturas || []).reduce((sum: number, a: any) => {
      const price = a.ciclo === "anual" ? (a.planos?.preco_anual || 0) / 12 : (a.planos?.preco_mensal || 0);
      return sum + Number(price);
    }, 0);

    // Fallback MRR from tenant plans if no assinaturas yet
    const planoPrices: Record<string, number> = { free: 0, starter: 97, pro: 197, enterprise: 497 };
    const fallbackMrr = mrr || tenants.filter((t) => t.ativo).reduce((s: number, t: any) => s + (planoPrices[t.plano] || 0), 0);

    setStats({ tenants: tenants.length, ativos, mrr: fallbackMrr, totalUsers: usersRes.count || 0, churn: 0 });
    setRecentTenants(tenants.slice(0, 5) as Tenant[]);

    // Plan distribution
    const dist: Record<string, number> = {};
    tenants.filter((t) => t.ativo).forEach((t) => { dist[t.plano] = (dist[t.plano] || 0) + 1; });
    setPlanDistribution(Object.entries(dist).map(([name, value]) => ({ name, value, color: PLAN_COLORS[name] || "#6B7280" })));

    // Alerts
    const alertList: typeof alerts = [];
    const vencidas = faturasRes.data?.length || 0;
    if (vencidas > 0) alertList.push({ type: "fatura", message: `${vencidas} fatura(s) vencida(s)`, link: "/admin/financeiro" });
    const bloqueados = tenants.filter((t) => !t.ativo).length;
    if (bloqueados > 0) alertList.push({ type: "tenant", message: `${bloqueados} tenant(s) bloqueado(s)`, link: "/admin/tenants" });
    setAlerts(alertList);

    setLoading(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { label: "MRR", value: `R$ ${stats.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "Tenants Ativos", value: stats.ativos, sub: `de ${stats.tenants} total`, icon: Building2, color: "bg-blue-50 text-blue-600" },
    { label: "Usuários", value: stats.totalUsers, sub: "na plataforma", icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "ARR", value: `R$ ${(stats.mrr * 12).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, sub: "receita anual", icon: TrendingDown, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-4 pb-8">
      <PageHeader title="Admin Global" subtitle="Visão geral da plataforma" />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub || c.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-4 space-y-2">
          {alerts.map((a, i) => (
            <button key={i} onClick={() => a.link && navigate(a.link)}
              className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3 text-left"
            >
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800">{a.message}</span>
            </button>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
        {planDistribution.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Distribuição por Plano</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} (${value})`}>
                      {planDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">Ações Rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <button onClick={() => navigate("/admin/tenants")} className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted transition-colors">
              <p className="text-sm font-medium text-foreground">Gerenciar Tenants</p>
              <p className="text-xs text-muted-foreground">{stats.tenants} empresas cadastradas</p>
            </button>
            <button onClick={() => navigate("/admin/financeiro")} className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted transition-colors">
              <p className="text-sm font-medium text-foreground">Financeiro</p>
              <p className="text-xs text-muted-foreground">Faturas e cobranças</p>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent tenants */}
      <div className="px-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Últimos tenants</h2>
        {recentTenants.map((t) => (
          <button key={t.id} onClick={() => navigate(`/admin/tenants/${t.id}`)}
            className="w-full rounded-xl border border-border bg-card p-3.5 shadow-sm text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{t.nome_fantasia}</p>
                <p className="text-xs text-muted-foreground">CNPJ: {t.cnpj}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  t.plano === "enterprise" ? "bg-purple-100 text-purple-700" :
                  t.plano === "pro" ? "bg-blue-100 text-blue-700" :
                  t.plano === "starter" ? "bg-green-100 text-green-700" :
                  "bg-muted text-muted-foreground"
                }`}>{t.plano}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(t.created_at), "dd/MM/yy", { locale: ptBR })}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
