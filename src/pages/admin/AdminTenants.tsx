import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Tenant } from "@/types/database";

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlano, setFilterPlano] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("tenants").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setTenants((data as Tenant[]) || []);
      setLoading(false);
    });
  }, []);

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

  const planos = ["all", "free", "starter", "pro", "enterprise"];
  const statusOpts = ["all", "ativo", "bloqueado"];

  return (
    <div className="space-y-3">
      <PageHeader title="Tenants" subtitle={`${filtered.length} empresas`} />

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
            <p className="text-sm text-muted-foreground">Nenhum tenant encontrado</p>
          </div>
        ) : (
          filtered.map((t) => (
            <button key={t.id} onClick={() => navigate(`/admin/tenants/${t.id}`)}
              className="w-full rounded-xl border border-border bg-card p-3.5 shadow-sm text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{t.nome_fantasia}</p>
                    {!t.ativo && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Bloqueado</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">CNPJ: {t.cnpj}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    t.plano === "enterprise" ? "bg-purple-100 text-purple-700" :
                    t.plano === "pro" ? "bg-blue-100 text-blue-700" :
                    t.plano === "starter" ? "bg-green-100 text-green-700" :
                    "bg-muted text-muted-foreground"
                  }`}>{t.plano}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
