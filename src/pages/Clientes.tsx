import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { maskCPF, maskPhone, maskEmail } from "@/lib/dataProtection";
import type { Cliente } from "@/types/database";

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("clientes").select("*").order("nome").then(({ data }) => {
      setClientes((data as Cliente[]) || []);
      setLoading(false);
    });
  }, []);

  const filtered = clientes.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.nome.toLowerCase().includes(s) || c.cpf.includes(s) || c.telefone.includes(s);
  });

  return (
    <div className="space-y-3">
      <PageHeader title="Clientes" subtitle={`${filtered.length} cadastrados`} />

      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
              <p className="font-medium text-foreground">{c.nome}</p>
              <p className="text-xs text-muted-foreground">
                CPF: {maskCPF(c.cpf)} • Tel: {maskPhone(c.telefone)}
              </p>
              {c.email && <p className="text-xs text-muted-foreground">{maskEmail(c.email)}</p>}
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => navigate("/clientes/novo")}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>
    </div>
  );
}
