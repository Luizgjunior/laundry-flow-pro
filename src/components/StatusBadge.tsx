import type { PecaStatus } from "@/types/database";

const statusConfig: Record<PecaStatus, { label: string; className: string }> = {
  entrada: { label: "Entrada", className: "bg-blue-100 text-blue-700" },
  diagnostico: { label: "Diagnóstico", className: "bg-purple-100 text-purple-700" },
  aguardando_aprovacao: { label: "Aguardando", className: "bg-amber-100 text-amber-700" },
  aprovado: { label: "Aprovado", className: "bg-green-100 text-green-700" },
  em_processo: { label: "Em Processo", className: "bg-cyan-100 text-cyan-700" },
  inspecao: { label: "Inspeção", className: "bg-violet-100 text-violet-700" },
  pronto: { label: "Pronto", className: "bg-emerald-100 text-emerald-700" },
  entregue: { label: "Entregue", className: "bg-teal-100 text-teal-700" },
  recusado: { label: "Recusado", className: "bg-red-100 text-red-700" },
  incidente: { label: "Incidente", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: PecaStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
