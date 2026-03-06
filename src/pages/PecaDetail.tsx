import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { PhotoGrid } from "@/components/PhotoGrid";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ChevronRight, Stethoscope, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Peca, PecaStatus } from "@/types/database";

const statusFlow: PecaStatus[] = [
  "entrada", "diagnostico", "aguardando_aprovacao", "aprovado",
  "em_processo", "inspecao", "pronto", "entregue",
];

const nextStatusLabel: Partial<Record<PecaStatus, string>> = {
  entrada: "Iniciar Triagem",
  aprovado: "Iniciar Processo",
  em_processo: "Enviar p/ Inspeção",
  inspecao: "Marcar Pronto",
  pronto: "Registrar Entrega",
};

export default function PecaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [peca, setPeca] = useState<Peca | null>(null);
  const [photos, setPhotos] = useState<{ id: string; url: string; tipo: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    const [pecaRes, fotosRes] = await Promise.all([
      supabase.from("pecas").select("*, clientes(nome, cpf, telefone)").eq("id", id).single(),
      supabase.from("fotos").select("*").eq("peca_id", id).order("created_at"),
    ]);
    setPeca(pecaRes.data as Peca);
    const fotosData = fotosRes.data || [];
    setPhotos(fotosData.map((f: any) => ({
      id: f.id,
      url: supabase.storage.from("pecas-fotos").getPublicUrl(f.storage_path).data.publicUrl,
      tipo: f.tipo,
    })));
    setLoading(false);
  };

  const advanceStatus = async () => {
    if (!peca) return;
    // Special: entrada → goes to triage page
    if (peca.status === "entrada") {
      navigate(`/pecas/${peca.id}/triagem`);
      return;
    }

    const currentIdx = statusFlow.indexOf(peca.status);
    if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[currentIdx + 1];

    const { error } = await supabase.from("pecas").update({
      status: nextStatus,
      etapa_atual: currentIdx + 2,
    }).eq("id", peca.id);

    if (error) { toast.error("Erro ao atualizar status."); return; }
    toast.success(`Status alterado para ${nextStatus.replace("_", " ")}`);
    setPeca({ ...peca, status: nextStatus, etapa_atual: currentIdx + 2 });
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!peca) return <p className="p-4 text-muted-foreground">Peça não encontrada.</p>;

  const cliente = peca.clientes as any;
  const riscoColors: Record<string, string> = { baixo: "bg-green-100 text-green-700", medio: "bg-amber-100 text-amber-700", alto: "bg-red-100 text-red-700" };

  return (
    <div className="space-y-4 pb-28">
      <PageHeader title={peca.codigo_interno}
        actions={<button onClick={() => navigate(-1)} className="p-2 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>}
      />

      <div className="px-4 space-y-4">
        {/* Status + Risk */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status atual</p>
            <StatusBadge status={peca.status} />
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground">Etapa</p>
            <p className="text-lg font-bold text-foreground">{peca.etapa_atual}/9</p>
          </div>
        </div>

        {/* Risk badge */}
        {peca.risco_calculado && (
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riscoColors[peca.risco_calculado] || ""}`}>
              Risco {peca.risco_calculado}
            </span>
          </div>
        )}

        {/* Quick actions */}
        {(peca.status === "entrada" || peca.status === "diagnostico") && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12" onClick={() => navigate(`/pecas/${peca.id}/triagem`)}>
              <Stethoscope className="h-4 w-4 mr-2" /> Triagem
            </Button>
            <Button variant="outline" className="h-12" onClick={() => navigate(`/pecas/${peca.id}/plano`)}>
              <ClipboardList className="h-4 w-4 mr-2" /> Plano
            </Button>
          </div>
        )}

        {/* Client */}
        {cliente && (
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-1">Cliente</p>
            <p className="font-medium text-foreground">{cliente.nome}</p>
            <p className="text-xs text-muted-foreground">CPF: {cliente.cpf} • Tel: {cliente.telefone}</p>
          </div>
        )}

        {/* Piece info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="font-medium text-foreground capitalize">{peca.tipo}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Cor</p>
            <p className="font-medium text-foreground capitalize">{peca.cor}</p>
          </div>
          {peca.marca && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Marca</p>
              <p className="font-medium text-foreground">{peca.marca}</p>
            </div>
          )}
          {peca.valor_servico && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="font-medium text-foreground">R$ {Number(peca.valor_servico).toFixed(2)}</p>
            </div>
          )}
        </div>

        {peca.observacoes && (
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-1">Observações</p>
            <p className="text-sm text-foreground">{peca.observacoes}</p>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Fotos</h2>
            <PhotoGrid photos={photos} />
          </div>
        )}

        {/* QR Code */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">QR Code</h2>
          <QRCodeGenerator value={peca.codigo_interno} size={160} />
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
          <div className="rounded-xl border border-border bg-card p-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Entrada registrada</p>
                <p className="text-xs text-muted-foreground">{format(new Date(peca.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
            {peca.updated_at !== peca.created_at && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Última atualização</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(peca.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action button */}
      {nextStatusLabel[peca.status] && (
        <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur lg:ml-64">
          <Button onClick={advanceStatus} className="w-full h-12 text-base font-semibold">
            {nextStatusLabel[peca.status]} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
