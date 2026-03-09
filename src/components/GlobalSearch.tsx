import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Users, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: string;
  type: "peca" | "cliente";
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const searchTerm = `%${q}%`;

    const [pecasRes, clientesRes] = await Promise.all([
      supabase.from("pecas").select("id, codigo_interno, tipo, cor, status").or(`codigo_interno.ilike.${searchTerm},tipo.ilike.${searchTerm},cor.ilike.${searchTerm}`).limit(5),
      supabase.from("clientes").select("id, nome, cpf, telefone").or(`nome.ilike.${searchTerm},cpf.ilike.${searchTerm}`).limit(5),
    ]);

    const items: SearchResult[] = [
      ...(pecasRes.data || []).map((p: any) => ({
        id: p.id,
        type: "peca" as const,
        title: p.codigo_interno,
        subtitle: `${p.tipo} • ${p.cor} • ${p.status}`,
        href: `/pecas/${p.id}`,
      })),
      ...(clientesRes.data || []).map((c: any) => ({
        id: c.id,
        type: "cliente" as const,
        title: c.nome,
        subtitle: c.cpf,
        href: `/clientes`,
      })),
    ];
    setResults(items);
    setSelectedIdx(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const go = (result: SearchResult) => {
    setOpen(false);
    navigate(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      go(results[selectedIdx]);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar peças, clientes..."
              className="border-0 shadow-none focus-visible:ring-0 h-12"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum resultado encontrado</p>
            )}
            {!loading && results.length > 0 && (
              <ul className="py-1">
                {results.map((r, i) => (
                  <li key={r.id}>
                    <button
                      onClick={() => go(r)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        i === selectedIdx ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      {r.type === "peca" ? <Package className="h-4 w-4 flex-shrink-0" /> : <Users className="h-4 w-4 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!loading && query.length < 2 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para buscar
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
