import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, CheckCircle2, Eraser } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Peca } from "@/types/database";

export default function Entrega() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [peca, setPeca] = useState<Peca | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [conferido, setConferido] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [pagamentoRealizado, setPagamentoRealizado] = useState(false);
  const [recebidoPor, setRecebidoPor] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [loading]);

  const loadData = async () => {
    const { data } = await supabase.from("pecas").select("*, clientes(nome, cpf, telefone)").eq("id", id).single();
    setPeca(data as unknown as Peca);
    setLoading(false);
  };

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasSignature(true);
    const ctx = canvasRef.current?.getContext("2d");
    const pos = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const pos = getPos(e);
    ctx?.lineTo(pos.x, pos.y);
    ctx?.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const finalizarEntrega = async () => {
    if (!peca || !user) return;
    if (!conferido) { toast.error("Confirme que o cliente conferiu a peça."); return; }
    if (!formaPagamento) { toast.error("Selecione a forma de pagamento."); return; }

    setSaving(true);

    let assinatura: string | null = null;
    if (hasSignature && canvasRef.current) {
      assinatura = canvasRef.current.toDataURL("image/png");
    }

    const { error } = await supabase.from("entregas").insert({
      peca_id: peca.id,
      metodo: "presencial",
      assinatura_base64: assinatura,
      documento_conferido: conferido,
      valor_cobrado: peca.valor_servico,
      forma_pagamento: formaPagamento,
      observacoes: observacoes || null,
      entregue_por: user.id,
      recebido_por: recebidoPor || null,
    });

    if (error) { toast.error("Erro ao registrar entrega"); setSaving(false); return; }

    await supabase.from("pecas").update({
      status: "entregue",
      etapa_atual: 9,
      data_entrega: new Date().toISOString(),
    }).eq("id", peca.id);

    toast.success("Entrega registrada com sucesso!");
    navigate("/pecas");
    setSaving(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!peca) return <p className="p-4 text-muted-foreground">Peça não encontrada.</p>;

  const cliente = peca.clientes as any;
  const diasProcesso = differenceInDays(new Date(), new Date(peca.created_at));

  return (
    <div className="space-y-4 pb-28">
      <PageHeader title="Entrega" subtitle={peca.codigo_interno}
        actions={<button onClick={() => navigate(-1)} className="p-2 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>}
      />

      <div className="px-4 space-y-4">
        {/* Header info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <StatusBadge status={peca.status} />
            <span className="text-xs text-muted-foreground">{diasProcesso} dias em processo</span>
          </div>
          {cliente && (
            <div>
              <p className="font-medium text-foreground">{cliente.nome}</p>
              <p className="text-xs text-muted-foreground">Tel: {cliente.telefone}</p>
            </div>
          )}
          <p className="text-sm text-foreground">{peca.tipo} • {peca.cor}</p>
          <p className="text-xs text-muted-foreground">
            Entrada: {format(new Date(peca.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Confirm inspection */}
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start gap-3">
            <Checkbox checked={conferido} onCheckedChange={(v) => setConferido(v === true)} className="mt-0.5" />
            <p className="text-sm text-foreground">Cliente conferiu a peça e está de acordo</p>
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Pagamento</h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {peca.valor_servico && (
              <p className="text-2xl font-bold text-foreground">R$ {Number(peca.valor_servico).toFixed(2)}</p>
            )}
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger><SelectValue placeholder="Forma de pagamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="faturado">Faturado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Receiver */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Recebedor</h2>
          <Input placeholder="Nome de quem está retirando (se diferente do cliente)" value={recebidoPor} onChange={(e) => setRecebidoPor(e.target.value)} />
        </div>

        {/* Signature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Assinatura Digital</h2>
            {hasSignature && (
              <button onClick={clearSignature} className="text-xs text-muted-foreground flex items-center gap-1">
                <Eraser className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
          <div className="rounded-xl border-2 border-dashed border-border bg-card overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-32 touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Assinatura confirma o recebimento da peça em perfeito estado
          </p>
        </div>

        {/* Observations */}
        <Textarea placeholder="Observações da entrega..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur lg:ml-64">
        <Button
          onClick={finalizarEntrega}
          className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
          disabled={saving || !conferido || !formaPagamento}
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5 mr-2" /> Finalizar Entrega</>}
        </Button>
      </div>
    </div>
  );
}
