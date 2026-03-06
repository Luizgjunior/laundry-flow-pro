import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, Building2, Users, DollarSign, HardDrive } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tenant } from "@/types/database";

const planoPrices: Record<string, number> = { free: 0, starter: 97, pro: 197, enterprise: 497 };

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ tenants: 0, ativos: 0, inativos: 0, mrr: 0, totalUsers: 0 });
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tenantsRes, usersRes] = await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("id", { count: "exact", head: true }),
    ]);

    const tenants = (tenantsRes.data || []) as Tenant[];
    const ativos = tenants.filter((t) => t.ativo).length;
    const mrr = tenants.filter((t) => t.ativo).reduce((sum, t) => sum + (planoPrices[t.plano] || 0), 0);

    setStats({
      tenants: tenants.length,
      ativos,
      inativos: tenants.length - ativos,
      mrr,
      totalUsers: usersRes.count || 0,
    });
    setRecentTenants(tenants.slice(0, 5));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { label: "Tenants", value: `${stats.ativos}/${stats.tenants}`, sub: "ativos/total", icon: Building2, color: "bg-blue-50 text-blue-600" },
    { label: "MRR", value: `R$ ${stats.mrr}`, sub: "receita mensal", icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "Usuários", value: stats.totalUsers, sub: "na plataforma", icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Storage", value: "—", sub: "em uso", icon: HardDrive, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Admin Global" subtitle="Visão geral da plataforma" />

      <div className="grid grid-cols-2 gap-3 px-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="px-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Últimos tenants</h2>
        {recentTenants.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(t.created_at), "dd/MM/yy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
