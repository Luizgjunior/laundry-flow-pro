import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminFinanceiro() {
  const [loading, setLoading] = useState(true);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [stats, setStats] = useState({ pendentes: 0, valorPendente: 0, pagas: 0, valorPago: 0 });
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("faturas").select("*, tenants(nome_fantasia)").order("created_at", { ascending: false });
    const items = data || [];
    setFaturas(items);
    const pendentes = items.filter((f: any) => f.status === "pendente" || f.status === "vencido");
    const pagas = items.filter((f: any) => f.status === "pago");
    setStats({
      pendentes: pendentes.length,
      valorPendente: pendentes.reduce((s: number, f: any) => s + Number(f.valor), 0),
      pagas: pagas.length,
      valorPago: pagas.reduce((s: number, f: any) => s + Number(f.valor), 0),
    });
    setLoading(false);
  };

  const marcarPaga = async (id: string) => {
    await supabase.from("faturas").update({ status: "pago", data_pagamento: new Date().toISOString().split("T")[0] }).eq("id", id);
    setFaturas((prev) => prev.map((f) => f.id === id ? { ...f, status: "pago" } : f));
    toast.success("Fatura marcada como paga");
  };

  const filtered = faturas.filter((f) => filterStatus === "all" || f.status === filterStatus);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const filters = ["all", "pendente", "pago", "vencido", "cancelado"];

  return (
    <div className="space-y-4 pb-8">
      <PageHeader title="Financeiro" subtitle="Faturas e cobranças" />

      <div className="grid grid-cols-2 gap-3 px-4">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-xs text-muted-foreground">Receita Recebida</p>
          <p className="text-xl font-bold text-green-600">R$ {stats.valorPago.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{stats.pagas} faturas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-xs text-muted-foreground">Pendente</p>
          <p className="text-xl font-bold text-amber-600">R$ {stats.valorPendente.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{stats.pendentes} faturas</p>
        </div>
      </div>

      <div className="px-4">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterStatus === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
              }`}
            >{f === "all" ? "Todas" : f}</button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-8">Nenhuma fatura encontrada</p>
        ) : filtered.map((f) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{f.numero}</p>
              <p className="text-xs text-muted-foreground">{(f as any).tenants?.nome_fantasia}</p>
              <p className="text-xs text-muted-foreground">R$ {Number(f.valor).toFixed(2)} • Venc: {f.data_vencimento}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                f.status === "pago" ? "bg-green-100 text-green-700" :
                f.status === "vencido" ? "bg-red-100 text-red-700" :
                f.status === "cancelado" ? "bg-muted text-muted-foreground" :
                "bg-amber-100 text-amber-700"
              }`}>{f.status}</span>
              {f.status !== "pago" && f.status !== "cancelado" && (
                <Button size="sm" variant="ghost" onClick={() => marcarPaga(f.id)}>
                  <DollarSign className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
