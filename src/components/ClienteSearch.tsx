import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import type { Cliente } from "@/types/database";

interface ClienteSearchProps {
  onSelect: (cliente: Cliente) => void;
  onNotFound: () => void;
}

export function ClienteSearch({ onSelect, onNotFound }: ClienteSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (query.length < 3) return;
    setLoading(true);
    setSearched(true);

    const cleaned = query.replace(/\D/g, "");
    const isNumeric = cleaned.length > 0 && cleaned === query.replace(/[\.\-\s\(\)]/g, "");

    let q = supabase.from("clientes").select("*");
    if (isNumeric) {
      q = q.or(`cpf.ilike.%${cleaned}%,telefone.ilike.%${cleaned}%`);
    } else {
      q = q.ilike("nome", `%${query}%`);
    }

    const { data } = await q.limit(5);
    setResults((data as Cliente[]) || []);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por CPF, telefone ou nome..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Buscando...</p>}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">Nenhum cliente encontrado</p>
          <button
            onClick={onNotFound}
            className="text-sm font-semibold text-primary active:scale-95 transition-transform"
          >
            + Cadastrar novo cliente
          </button>
        </div>
      )}

      {results.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          className="w-full rounded-xl border border-border bg-card p-3 text-left active:scale-[0.98] transition-transform"
        >
          <p className="font-medium text-foreground">{c.nome}</p>
          <p className="text-xs text-muted-foreground">
            CPF: {c.cpf} • Tel: {c.telefone}
          </p>
        </button>
      ))}
    </div>
  );
}
