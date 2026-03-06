import { StatusBadge } from "./StatusBadge";
import type { Peca } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface PecaCardProps {
  peca: Peca;
}

export function PecaCard({ peca }: PecaCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/pecas/${peca.id}`)}
      className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">{peca.codigo_interno}</p>
          <p className="text-sm text-muted-foreground">
            {peca.tipo} • {peca.cor}
          </p>
          {peca.clientes && (
            <p className="text-xs text-muted-foreground">{peca.clientes.nome}</p>
          )}
        </div>
        <StatusBadge status={peca.status} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(new Date(peca.created_at), "dd MMM yyyy", { locale: ptBR })}
        </span>
        <span className="text-xs text-muted-foreground">Etapa {peca.etapa_atual}/9</span>
      </div>
    </button>
  );
}
