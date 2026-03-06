import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { PecaCard } from "@/components/PecaCard";
import { Loader2, QrCode, PlusCircle, Clock, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Peca } from "@/types/database";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, aguardando: 0, prontas: 0, processo: 0 });
  const [recentPecas, setRecentPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const today = new Date().toISOString().split("T")[0];

    const [totalRes, aguardandoRes, prontasRes, processoRes, recentRes] = await Promise.all([
      supabase.from("pecas").select("id", { count: "exact", head: true }).gte("created_at", today),
      supabase.from("pecas").select("id", { count: "exact", head: true }).eq("status", "aguardando_aprovacao"),
      supabase.from("pecas").select("id", { count: "exact", head: true }).eq("status", "pronto"),
      supabase.from("pecas").select("id", { count: "exact", head: true }).eq("status", "em_processo"),
      supabase.from("pecas").select("*, clientes(nome)").order("created_at", { ascending: false }).limit(5),
    ]);

    setStats({
      total: totalRes.count || 0,
      aguardando: aguardandoRes.count || 0,
      prontas: prontasRes.count || 0,
      processo: processoRes.count || 0,
    });
    setRecentPecas((recentRes.data as Peca[]) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin_global" || user?.role === "admin_empresa";

  const statCards = [
    { label: "Peças hoje", value: stats.total, icon: Layers, color: "bg-blue-50 text-blue-600" },
    { label: "Aguardando aprovação", value: stats.aguardando, icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
    { label: "Prontas p/ entrega", value: stats.prontas, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
    { label: "Em processo", value: stats.processo, icon: Clock, color: "bg-cyan-50 text-cyan-600" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={`Olá, ${user?.nome?.split(" ")[0]}`} subtitle={isAdmin ? "Visão geral da lavanderia" : "Sua fila de trabalho"} />

      {!isAdmin && (
        <div className="px-4 space-y-3">
          <button
            onClick={() => navigate("/pecas/nova")}
            className="flex w-full items-center gap-3 rounded-xl bg-primary p-4 text-primary-foreground shadow-sm active:scale-[0.98] transition-transform"
          >
            <PlusCircle className="h-6 w-6" />
            <span className="font-semibold">Nova Entrada</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-foreground shadow-sm active:scale-[0.98] transition-transform">
            <QrCode className="h-6 w-6 text-primary" />
            <span className="font-semibold">Escanear QR Code</span>
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-2 gap-3 px-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
              <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Últimas peças</h2>
        {recentPecas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma peça registrada ainda</p>
          </div>
        ) : (
          recentPecas.map((p) => <PecaCard key={p.id} peca={p} />)
        )}
      </div>
    </div>
  );
}
