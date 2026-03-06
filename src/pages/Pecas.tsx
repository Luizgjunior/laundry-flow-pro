import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { PecaCard } from "@/components/PecaCard";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Peca, PecaStatus } from "@/types/database";

const statusFilters: { value: PecaStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "entrada", label: "Entrada" },
  { value: "aguardando_aprovacao", label: "Aguardando" },
  { value: "em_processo", label: "Em Processo" },
  { value: "pronto", label: "Prontas" },
  { value: "entregue", label: "Entregues" },
];

export default function Pecas() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"todas" | "hoje" | "pendentes">("todas");
  const [statusFilter, setStatusFilter] = useState<PecaStatus | "all">("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadPecas();
  }, [tab, statusFilter]);

  const loadPecas = async () => {
    setLoading(true);
    let q = supabase.from("pecas").select("*, clientes(nome)").order("created_at", { ascending: false });

    if (tab === "hoje") {
      q = q.gte("created_at", new Date().toISOString().split("T")[0]);
    } else if (tab === "pendentes") {
      q = q.in("status", ["aguardando_aprovacao", "diagnostico"]);
    }

    if (statusFilter !== "all") {
      q = q.eq("status", statusFilter);
    }

    const { data } = await q.limit(50);
    setPecas((data as Peca[]) || []);
    setLoading(false);
  };

  const filtered = pecas.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.codigo_interno.toLowerCase().includes(s) ||
      p.clientes?.nome?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-3">
      <PageHeader title="Peças" subtitle={`${filtered.length} registros`} />

      {/* Tabs */}
      <div className="flex gap-1 px-4">
        {(["todas", "hoje", "pendentes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {t === "todas" ? "Todas" : t === "hoje" ? "Hoje" : "Pendentes"}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="px-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar código ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {statusFilters.map((sf) => (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === sf.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma peça encontrada</p>
          </div>
        ) : (
          filtered.map((p) => <PecaCard key={p.id} peca={p} />)
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/pecas/nova")}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>
    </div>
  );
}
