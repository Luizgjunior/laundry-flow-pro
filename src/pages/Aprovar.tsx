import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronLeft, ChevronRight, FileSignature, Thermometer, Timer, Beaker, Cog, Info, ShieldCheck, Shirt, Eraser } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EnviarAssinaturaButton } from "@/components/EnviarAssinaturaButton";

interface EtapaDetalhe {
  tipo: string;
  etapa: number;
  temperatura: number | null;
  duracao_minutos: number | null;
  observacoes: string | null;
  programa: string | null;
  produto_nome: string | null;
  maquina_nome: string | null;
}

interface AprovacaoData {
  id: string;
  token: string;
  status: string;
  expires_at: string;
  peca: {
    id: string;
    codigo_interno: string;
    tipo: string;
    cor: string;
    marca: string | null;
    risco_calculado: string | null;
    tenant_id: string;
    composicao: any;
    valor_servico: number | null;
    previsao_entrega: string | null;
    observacoes: string | null;
  };
  tenant: {
    nome_fantasia: string;
    logo_url: string | null;
    termos_customizados: string | null;
  };
  cliente: {
    nome: string;
    email: string | null;
    telefone: string;
  };
  fotos: { url: string; tipo: string }[];
  diagnosticos: { nome: string; localizacao: string; tamanho: string | null; observacao: string | null }[];
  etapasDetalhadas: EtapaDetalhe[];
}

const riscoTexts: Record<string, { label: string; desc: string; color: string; icon: string }> = {
  baixo: {
    label: "Baixo",
    desc: "Tratamento padrão com alta taxa de sucesso. Sua peça será tratada com os cuidados habituais e não apresenta riscos significativos durante o processo.",
    color: "bg-green-100 text-green-700",
    icon: "🟢",
  },
  medio: {
    label: "Médio",
    desc: "Esta peça requer cuidados especiais durante o tratamento. Existe um pequeno risco de alteração de cor ou textura devido às características do tecido ou tipo de mancha. Nossa equipe utilizará técnicas específicas para minimizar qualquer risco.",
    color: "bg-amber-100 text-amber-700",
    icon: "🟡",
  },
  alto: {
    label: "Alto",
    desc: "Tecido delicado ou manchas de difícil remoção identificadas. Há risco de danos como alteração de cor, encolhimento ou desgaste da fibra. Utilizaremos os métodos mais seguros disponíveis, porém não podemos garantir a integridade total da peça.",
    color: "bg-red-100 text-red-700",
    icon: "🔴",
  },
};

const tipoEtapaLabels: Record<string, { label: string; desc: string }> = {
  pre_tratamento: {
    label: "Pré-tratamento de Manchas",
    desc: "Aplicação localizada de produtos específicos nas manchas identificadas para facilitar a remoção durante a lavagem principal.",
  },
  lavadoria: {
    label: "Lavagem Especializada",
    desc: "Processo de lavagem profissional com produtos e técnicas adequadas ao tipo de tecido e manchas da sua peça.",
  },
  lavagem: {
    label: "Lavagem Especializada",
    desc: "Processo de lavagem profissional com produtos e técnicas adequadas ao tipo de tecido e manchas da sua peça.",
  },
  secagem: {
    label: "Secagem Controlada",
    desc: "Secagem com temperatura e tempo controlados para preservar a forma, cor e textura do tecido.",
  },
  passadoria: {
    label: "Passadoria Profissional",
    desc: "Finalização com passadoria profissional para devolver o caimento e aparência original da peça.",
  },
  controle_qualidade: {
    label: "Controle de Qualidade",
    desc: "Inspeção final detalhada para garantir que todas as manchas foram tratadas e a peça está em perfeitas condições.",
  },
  acabamento: {
    label: "Acabamento Final",
    desc: "Revisão final, embalagem e preparação da peça para entrega com os mais altos padrões de qualidade.",
  },
};

const fotoTipoLabels: Record<string, string> = {
  entrada_frente: "Frente",
  entrada_costas: "Costas",
  avaria: "Avaria identificada",
  processo: "Durante processo",
  saida: "Após tratamento",
};

export default function Aprovar() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<AprovacaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"aprovado" | "recusado" | null>(null);
  const [termosOpen, setTermosOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Signature pad logic
  const getCanvasPoint = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    setHasSignature(true);
    const point = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [getCanvasPoint]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = getCanvasPoint(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }, [isDrawing, getCanvasPoint]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  useEffect(() => { if (token) loadData(); }, [token]);

  const loadData = async () => {
    const { data: aprov, error: err } = await supabase
      .from("aprovacoes")
      .select("*")
      .eq("token", token)
      .single();

    if (err || !aprov) { setError("Link inválido ou não encontrado."); setLoading(false); return; }
    if (aprov.status !== "pendente") {
      setResult(aprov.status as any);
      setLoading(false);
      return;
    }
    if (new Date(aprov.expires_at) < new Date()) {
      setError("Este link expirou. Solicite um novo link ao seu atendente.");
      setLoading(false);
      return;
    }

    const { data: peca } = await supabase.from("pecas").select("*").eq("id", aprov.peca_id).single();
    if (!peca) { setError("Peça não encontrada."); setLoading(false); return; }

    const [tenantRes, fotosRes, diagRes, planoRes, clienteRes] = await Promise.all([
      supabase.from("tenants").select("nome_fantasia, logo_url, termos_customizados").eq("id", peca.tenant_id).single(),
      supabase.from("fotos").select("storage_path, tipo").eq("peca_id", peca.id),
      supabase.from("diagnosticos").select("*, tipos_manchas:tipo_mancha_id(nome)").eq("peca_id", peca.id),
      supabase.from("planos_tecnicos").select("*, produtos:produto_id(nome), maquinas:maquina_id(nome)").eq("peca_id", peca.id).order("etapa"),
      supabase.from("clientes").select("nome, email, telefone").eq("id", peca.cliente_id).single(),
    ]);

    const fotos = (fotosRes.data || []).map((f: any) => ({
      url: supabase.storage.from("pecas-fotos").getPublicUrl(f.storage_path).data.publicUrl,
      tipo: f.tipo,
    }));

    const etapasDetalhadas: EtapaDetalhe[] = (planoRes.data || []).map((p: any) => ({
      tipo: p.tipo,
      etapa: p.etapa,
      temperatura: p.temperatura,
      duracao_minutos: p.duracao_minutos,
      observacoes: p.observacoes,
      programa: p.programa,
      produto_nome: p.produtos?.nome || null,
      maquina_nome: p.maquinas?.nome || null,
    }));

    setData({
      id: aprov.id,
      token: aprov.token,
      status: aprov.status,
      expires_at: aprov.expires_at,
      peca: {
        id: peca.id,
        codigo_interno: peca.codigo_interno,
        tipo: peca.tipo,
        cor: peca.cor,
        marca: peca.marca,
        risco_calculado: peca.risco_calculado,
        tenant_id: peca.tenant_id,
        composicao: peca.composicao,
        valor_servico: peca.valor_servico,
        previsao_entrega: peca.previsao_entrega,
        observacoes: peca.observacoes,
      },
      tenant: tenantRes.data as any,
      cliente: clienteRes.data as any || { nome: "", email: null, telefone: "" },
      fotos,
      diagnosticos: (diagRes.data || []).map((d: any) => ({
        nome: d.tipos_manchas?.nome || "Mancha",
        localizacao: d.localizacao || "",
        tamanho: d.tamanho,
        observacao: d.observacao,
      })),
      etapasDetalhadas,
    });
    setLoading(false);
  };

  const handleApproveClick = () => {
    setShowSignaturePad(true);
  };

  const handleConfirmWithSignature = async () => {
    if (!data) return;
    if (!hasSignature) {
      toast.error("Por favor, assine no campo acima para confirmar a aprovação.");
      return;
    }
    setSubmitting(true);

    const signatureBase64 = canvasRef.current?.toDataURL("image/png") || null;

    let geo = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    await supabase.from("aprovacoes").update({
      status: "aprovado",
      responded_at: new Date().toISOString(),
      ip_cliente: null,
      user_agent: navigator.userAgent,
      geolocation: geo,
      assinatura_base64: signatureBase64,
    }).eq("id", data.id);

    await supabase.from("pecas").update({ status: "em_processo", etapa_atual: 7 }).eq("id", data.peca.id);

    setResult("aprovado");
    setSubmitting(false);
  };

  const handleRespond = async (status: "aprovado" | "recusado") => {
    if (!data) return;
    if (status === "aprovado") {
      handleApproveClick();
      return;
    }
    setSubmitting(true);

    let geo = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    await supabase.from("aprovacoes").update({
      status,
      responded_at: new Date().toISOString(),
      ip_cliente: null,
      user_agent: navigator.userAgent,
      geolocation: geo,
    }).eq("id", data.id);

    await supabase.from("pecas").update({ status: "recusado", etapa_atual: 6 }).eq("id", data.peca.id);

    setResult(status);
    setSubmitting(false);
  };

  const formatComposicao = (comp: any): string[] => {
    if (!comp) return [];
    if (typeof comp === "string") return [comp];
    if (typeof comp === "object") {
      const items: string[] = [];
      Object.entries(comp).forEach(([key, val]: [string, any]) => {
        if (typeof val === "string") {
          items.push(`${key}: ${val}`);
        } else if (Array.isArray(val)) {
          const materiais = val.map((m: any) => {
            const nome = m.material || m.componente || m.nome || "?";
            const pct = m.percentagem ?? m.porcentagem ?? m.percent ?? "";
            return `${nome} ${pct}%`;
          }).join(", ");
          items.push(`${key}: ${materiais}`);
        }
      });
      return items;
    }
    return [];
  };

  const horasRestantes = data ? Math.max(0, Math.round((new Date(data.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4"><XCircle className="h-8 w-8 text-destructive" /></div>
        <p className="text-lg font-bold text-foreground mb-2">Link inválido</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className={`rounded-full p-4 mb-4 ${result === "aprovado" ? "bg-green-100" : "bg-destructive/10"}`}>
          {result === "aprovado" ? <CheckCircle2 className="h-8 w-8 text-green-600" /> : <XCircle className="h-8 w-8 text-destructive" />}
        </div>
        <p className="text-lg font-bold text-foreground mb-2">
          {result === "aprovado" ? "Tratamento aprovado!" : "Tratamento recusado"}
        </p>
        <p className="text-sm text-muted-foreground">
          {result === "aprovado"
            ? "Você receberá uma notificação quando estiver pronto."
            : "Entre em contato para agendar a retirada da peça."}
        </p>
        {data && <p className="text-xs text-muted-foreground mt-4">Protocolo: {data.peca.codigo_interno}</p>}

        {result === "aprovado" && data?.cliente?.email && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Deseja formalizar com assinatura digital?</p>
            <EnviarAssinaturaButton
              pecaId={data.peca.id}
              aprovacaoId={data.id}
              clienteEmail={data.cliente.email}
              clienteNome={data.cliente.nome}
              clienteTelefone={data.cliente.telefone}
            />
          </div>
        )}
      </div>
    );
  }

  if (!data) return null;

  const risco = riscoTexts[data.peca.risco_calculado || "baixo"];
  const composicaoItems = formatComposicao(data.peca.composicao);
  const temValor = data.peca.valor_servico && data.peca.valor_servico > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-6 py-6 text-center">
        {data.tenant.logo_url ? (
          <img src={data.tenant.logo_url} alt="" className="h-14 w-14 mx-auto rounded-xl mb-2 border-2 border-primary-foreground/20" />
        ) : (
          <div className="h-14 w-14 mx-auto rounded-xl bg-primary-foreground/20 flex items-center justify-center mb-2">
            <span className="text-lg font-bold text-primary-foreground">{data.tenant.nome_fantasia?.charAt(0)}</span>
          </div>
        )}
        <p className="text-primary-foreground font-semibold text-lg">{data.tenant.nome_fantasia}</p>
        <p className="text-primary-foreground/80 text-sm mt-1">Aprovação de Tratamento</p>
      </div>

      {/* Expiration warning */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2">
        <Clock className="h-4 w-4 text-amber-600" />
        <p className="text-xs text-amber-700 font-medium">
          Este link expira em {horasRestantes}h — Responda para garantir o atendimento
        </p>
      </div>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* Greeting */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-foreground">
            Olá <strong>{data.cliente.nome}</strong>! 👋
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Recebemos sua peça e realizamos uma análise detalhada. Confira abaixo o diagnóstico completo e o plano de tratamento proposto. Após revisar, você pode aprovar ou recusar o tratamento.
          </p>
        </div>

        {/* Piece info */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Shirt className="h-4 w-4 text-primary" /> Dados da Peça
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Protocolo</p>
                <p className="font-bold text-foreground">{data.peca.codigo_interno}</p>
              </div>
              {temValor && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Valor do Serviço</p>
                  <p className="font-bold text-foreground text-lg">
                    R$ {data.peca.valor_servico!.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm text-foreground capitalize">{data.peca.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cor</p>
                <p className="text-sm text-foreground capitalize">{data.peca.cor}</p>
              </div>
              {data.peca.marca && (
                <div>
                  <p className="text-xs text-muted-foreground">Marca</p>
                  <p className="text-sm text-foreground">{data.peca.marca}</p>
                </div>
              )}
              {data.peca.previsao_entrega && (
                <div>
                  <p className="text-xs text-muted-foreground">Previsão de Entrega</p>
                  <p className="text-sm text-foreground font-medium">
                    {new Date(data.peca.previsao_entrega + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>

            {/* Composition */}
            {composicaoItems.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Composição do Tecido</p>
                {composicaoItems.map((item, i) => (
                  <p key={i} className="text-sm text-foreground capitalize">{item}</p>
                ))}
              </div>
            )}

            {/* Observations */}
            {data.peca.observacoes && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm text-foreground">{data.peca.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Photos carousel */}
        {data.fotos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">📸 Registro Fotográfico</h2>
            <p className="text-xs text-muted-foreground">Fotos registradas no momento da recepção da peça para sua segurança.</p>
            <div className="relative rounded-xl overflow-hidden border border-border bg-card aspect-[4/3]">
              <img src={data.fotos[currentPhoto]?.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white font-medium">
                {fotoTipoLabels[data.fotos[currentPhoto]?.tipo] || data.fotos[currentPhoto]?.tipo}
              </div>
              {data.fotos.length > 1 && (
                <>
                  <button onClick={() => setCurrentPhoto((p) => Math.max(0, p - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setCurrentPhoto((p) => Math.min(data.fotos.length - 1, p + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {data.fotos.map((_, i) => (
                      <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === currentPhoto ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">{currentPhoto + 1} de {data.fotos.length} fotos</p>
          </div>
        )}

        {/* Diagnostics */}
        {data.diagnosticos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">🔍 Diagnóstico Detalhado</h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-foreground mb-3">
                Nossa equipe identificou <strong>{data.diagnosticos.length} mancha(s)</strong> na sua peça que serão tratadas:
              </p>
              <div className="space-y-2.5">
                {data.diagnosticos.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{d.nome}</p>
                      {d.localizacao && <p className="text-xs text-muted-foreground">📍 Localização: {d.localizacao}</p>}
                      {d.tamanho && <p className="text-xs text-muted-foreground">📐 Tamanho: {d.tamanho}</p>}
                      {d.observacao && <p className="text-xs text-muted-foreground mt-0.5">{d.observacao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Risk level */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">⚠️ Nível de Risco</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                data.peca.risco_calculado === "alto" ? "text-red-500" : data.peca.risco_calculado === "medio" ? "text-amber-500" : "text-green-500"
              }`} />
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${risco.color}`}>
                  {risco.icon} Risco {risco.label}
                </span>
                <p className="text-sm text-muted-foreground mt-2">{risco.desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment plan - detailed */}
        {data.etapasDetalhadas.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">🧪 Plano de Tratamento Detalhado</h2>
            <p className="text-xs text-muted-foreground">
              Abaixo está o plano completo de tratamento que será aplicado à sua peça, etapa por etapa:
            </p>
            <div className="space-y-3">
              {data.etapasDetalhadas.map((etapa, i) => {
                const info = tipoEtapaLabels[etapa.tipo] || { label: etapa.tipo, desc: "" };
                return (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{info.label}</p>
                          {info.desc && <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>}
                        </div>

                        {/* Step details */}
                        <div className="grid grid-cols-2 gap-2">
                          {etapa.temperatura && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Thermometer className="h-3.5 w-3.5 text-primary" />
                              <span>Temperatura: <strong className="text-foreground">{etapa.temperatura}°C</strong></span>
                            </div>
                          )}
                          {etapa.duracao_minutos && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Timer className="h-3.5 w-3.5 text-primary" />
                              <span>Duração: <strong className="text-foreground">{etapa.duracao_minutos} min</strong></span>
                            </div>
                          )}
                          {etapa.produto_nome && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Beaker className="h-3.5 w-3.5 text-primary" />
                              <span>Produto: <strong className="text-foreground">{etapa.produto_nome}</strong></span>
                            </div>
                          )}
                          {etapa.maquina_nome && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Cog className="h-3.5 w-3.5 text-primary" />
                              <span>Equipamento: <strong className="text-foreground">{etapa.maquina_nome}</strong></span>
                            </div>
                          )}
                        </div>

                        {etapa.programa && (
                          <p className="text-xs text-muted-foreground">Programa: <strong className="text-foreground">{etapa.programa}</strong></p>
                        )}

                        {etapa.observacoes && (
                          <div className="rounded-lg bg-muted/50 p-2 mt-1">
                            <p className="text-xs text-muted-foreground">💡 {etapa.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total time estimate */}
            {(() => {
              const totalMin = data.etapasDetalhadas.reduce((sum, e) => sum + (e.duracao_minutos || 0), 0);
              if (totalMin <= 0) return null;
              const horas = Math.floor(totalMin / 60);
              const mins = totalMin % 60;
              return (
                <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <p className="text-sm text-foreground">
                    Tempo estimado total: <strong>{horas > 0 ? `${horas}h ` : ""}{mins > 0 ? `${mins}min` : ""}</strong>
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Value summary */}
        {temValor && (
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Valor Total do Serviço</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {data.peca.valor_servico!.toFixed(2).replace(".", ",")}
            </p>
            {data.peca.previsao_entrega && (
              <p className="text-xs text-muted-foreground">
                Previsão de entrega: {new Date(data.peca.previsao_entrega + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        )}

        {/* Guarantee info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-semibold text-foreground">Nossas Garantias</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>✅ Profissionais treinados e equipamentos especializados</li>
            <li>✅ Produtos de alta qualidade e seguros para tecidos</li>
            <li>✅ Registro fotográfico completo antes e depois</li>
            <li>✅ Controle de qualidade em cada etapa</li>
            <li>✅ Comunicação sobre o andamento do serviço</li>
          </ul>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Checkbox id="terms" checked={accepted} onCheckedChange={(c) => setAccepted(!!c)} className="mt-0.5" />
          <label htmlFor="terms" className="text-sm text-foreground">
            Li e aceito os{" "}
            <button onClick={() => setTermosOpen(true)} className="text-primary underline font-medium">termos de tratamento</button>
            {" "}e estou ciente dos riscos informados acima
          </label>
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-8">
          <Button onClick={() => handleRespond("aprovado")} className="w-full h-14 text-base font-semibold bg-green-600 hover:bg-green-700" disabled={!accepted || submitting}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5 mr-2" /> APROVAR TRATAMENTO</>}
          </Button>
          <Button onClick={() => handleRespond("recusado")} variant="outline" className="w-full h-12 text-destructive border-destructive/30" disabled={submitting}>
            <XCircle className="h-4 w-4 mr-2" /> RECUSAR E RETIRAR PEÇA
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Ao aprovar, você autoriza o início do tratamento conforme descrito acima.
          </p>
        </div>
      </div>

      {/* Terms dialog */}
      <Dialog open={termosOpen} onOpenChange={setTermosOpen}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Termos de Tratamento</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3">
            {data.tenant.termos_customizados ? (
              <p className="whitespace-pre-wrap">{data.tenant.termos_customizados}</p>
            ) : (
              <>
                <p><strong>1. Descrição dos Riscos</strong><br />
                O tratamento de tecidos envolve processos químicos e mecânicos que podem, em casos excepcionais, causar alterações na cor, textura ou integridade da peça. Todos os riscos identificados foram informados na seção "Nível de Risco" deste documento.</p>
                <p><strong>2. Isenção de Responsabilidade</strong><br />
                Para peças classificadas como risco MÉDIO ou ALTO, o estabelecimento não se responsabiliza por eventuais danos decorrentes do processo, desde que devidamente informados neste documento. Nossa equipe utilizará as melhores técnicas disponíveis para preservar sua peça.</p>
                <p><strong>3. Política de Reembolso</strong><br />
                Em caso de danos em peças de risco BAIXO, o cliente será indenizado conforme política vigente do estabelecimento.</p>
                <p><strong>4. Prazo de Retirada</strong><br />
                A peça deve ser retirada em até 30 dias após a conclusão do tratamento. Após esse prazo, poderão ser cobradas taxas de armazenamento.</p>
                <p><strong>5. Consentimento</strong><br />
                Ao aprovar este tratamento, o cliente declara ter lido e compreendido todas as informações sobre diagnóstico, plano de tratamento, riscos e valores apresentados.</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
