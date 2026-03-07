import { AlertTriangle, TrendingUp } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LimitWarning() {
  const { plano, usage, percentUsed, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading || !plano) return null;

  const warnings: { resource: string; percent: number; current: string; limit: string }[] = [];

  if (plano.limite_pecas_mes) {
    const p = percentUsed("pecas_criadas");
    if (p >= 80) warnings.push({ resource: "peças/mês", percent: p, current: String(usage.pecas_criadas), limit: String(plano.limite_pecas_mes) });
  }

  const sp = percentUsed("storage_usado_mb");
  if (sp >= 80) warnings.push({ resource: "armazenamento", percent: sp, current: `${usage.storage_usado_mb.toFixed(0)}MB`, limit: `${plano.limite_storage_mb}MB` });

  if (plano.limite_clientes) {
    const cp = percentUsed("clientes_ativos");
    if (cp >= 80) warnings.push({ resource: "clientes", percent: cp, current: String(usage.clientes_ativos), limit: String(plano.limite_clientes) });
  }

  if (warnings.length === 0) return null;

  return (
    <div className="px-4 space-y-2">
      {warnings.map((w) => (
        <div key={w.resource} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {w.percent >= 100 ? "Limite atingido" : "Chegando no limite"}
              </p>
              <p className="text-xs text-amber-600">{w.current} de {w.limit} {w.resource}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => navigate("/upgrade")}>
            <TrendingUp className="h-3 w-3 mr-1" /> Upgrade
          </Button>
        </div>
      ))}
    </div>
  );
}
