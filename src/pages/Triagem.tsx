import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CameraCapture } from "@/components/CameraCapture";
import { GarmentSilhouette, getLocalizacoes, getLocLabels } from "@/components/GarmentSilhouette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Plus, X, AlertTriangle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { Peca } from "@/types/database";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface TipoMancha {
  id: string;
  nome: string;
  icone: string;
  cor_hex: string;
  dificuldade: number;
}

interface Diagnostico {
  id: string;
  tipo_mancha_id: string;
  localizacao: string;
  tamanho: string;
  observacao: string | null;
  lado: string;
  tipo_mancha?: TipoMancha;
}

const localizacoesFrente = [
  "frente_superior", "frente_inferior", "manga_esquerda", "manga_direita", "gola", "punho"
];
const localizacoesVerso = [
  "costas_superior", "costas_inferior", "manga_esquerda", "manga_direita", "gola", "etiqueta"
];
const locLabels: Record<string, string> = {
  frente_superior: "Frente Superior", frente_inferior: "Frente Inferior",
  costas_superior: "Costas Superior", costas_inferior: "Costas Inferior",
  manga_esquerda: "Manga Esquerda", manga_direita: "Manga Direita",
  gola: "Gola", punho: "Punho", etiqueta: "Etiqueta",
};
const tamanhos = ["pequena", "media", "grande"];
const tamLabels: Record<string, string> = { pequena: "Pequena", media: "Média", grande: "Grande" };

const grifes = ["Hugo Boss", "Armani", "Gucci", "Prada", "Burberry", "Louis Vuitton", "Dior", "Chanel", "Versace", "Balenciaga", "Animale", "Le Lis", "Farm"];

export default function Triagem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [peca, setPeca] = useState<Peca | null>(null);
  const [tiposManchas, setTiposManchas] = useState<TipoMancha[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ladoAtual, setLadoAtual] = useState<"frente" | "verso">("frente");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMancha, setSelectedMancha] = useState<TipoMancha | null>(null);
  const [modalLoc, setModalLoc] = useState("");
  const [modalTam, setModalTam] = useState("media");
  const [modalObs, setModalObs] = useState("");

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const [cliente, setCliente] = useState<any>(null);

  const loadData = async () => {
    const [pecaRes, manchasRes, diagRes] = await Promise.all([
      supabase.from("pecas").select("*, clientes(*)").eq("id", id).single(),
      supabase.from("tipos_manchas").select("*").order("nome"),
      supabase.from("diagnosticos").select("*, tipos_manchas:tipo_mancha_id(*)").eq("peca_id", id),
    ]);
    const pecaData = pecaRes.data as any;
    setPeca(pecaData as unknown as Peca);
    setCliente(pecaData?.clientes || null);
    setTiposManchas((manchasRes.data as TipoMancha[]) || []);
    setDiagnosticos((diagRes.data as any[])?.map((d: any) => ({
      ...d,
      tipo_mancha: d.tipos_manchas,
      lado: d.lado || "frente",
    })) || []);
    setLoading(false);
  };

  // Risk calculation
  const risco = useMemo(() => {
    if (!peca || diagnosticos.length === 0) return { score: 0, level: "baixo" as const, text: "Nenhuma mancha registrada" };
    let score = diagnosticos.reduce((sum, d) => sum + (d.tipo_mancha?.dificuldade || 2), 0);

    const comp = peca.composicao as Record<string, number> | null;
    if (comp) {
      if ("seda" in comp) score = Math.ceil(score * 1.5);
      if ("la" in comp) score = Math.ceil(score * 1.3);
    }
    if (peca.marca && grifes.some((g) => g.toLowerCase() === peca.marca?.toLowerCase())) {
      score = Math.ceil(score * 1.2);
    }

    const level = score <= 3 ? "baixo" as const : score <= 6 ? "medio" as const : "alto" as const;
    const texts = {
      baixo: "Tratamento padrão com alta taxa de sucesso",
      medio: "Requer cuidados especiais. Pequeno risco de alteração",
      alto: "Tecido delicado ou manchas difíceis. Risco de danos",
    };
    return { score, level, text: texts[level] };
  }, [peca, diagnosticos]);

  const openManchaModal = (mancha: TipoMancha, loc?: string) => {
    setSelectedMancha(mancha);
    setModalLoc(loc || "");
    setModalTam("media");
    setModalObs("");
    setModalOpen(true);
  };

  const addDiagnostico = async () => {
    if (!selectedMancha || !modalLoc || !id) return;
    const { data, error } = await supabase.from("diagnosticos").insert({
      peca_id: id,
      tipo_mancha_id: selectedMancha.id,
      localizacao: modalLoc,
      tamanho: modalTam,
      observacao: modalObs || null,
      lado: ladoAtual,
      created_by: user?.id,
    }).select("*, tipos_manchas:tipo_mancha_id(*)").single();

    if (error) { toast.error("Erro ao registrar mancha."); return; }
    setDiagnosticos((prev) => [...prev, { ...data, tipo_mancha: (data as any).tipos_manchas, lado: ladoAtual }]);
    setModalOpen(false);
    toast.success("Mancha registrada!");
  };

  const removeDiagnostico = async (diagId: string) => {
    await supabase.from("diagnosticos").delete().eq("id", diagId);
    setDiagnosticos((prev) => prev.filter((d) => d.id !== diagId));
  };

  const enviarWhatsApp = async () => {
    if (!peca || !cliente) {
      toast.error("Dados da peça não carregados");
      return;
    }

    const { data: existing } = await supabase
      .from("aprovacoes")
      .select("*")
      .eq("peca_id", peca.id)
      .eq("status", "pendente")
      .single();

    let token = existing?.token;

    if (!existing) {
      const novoToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from("aprovacoes").insert({
        peca_id: peca.id,
        token: novoToken,
        status: "pendente",
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

      if (error) { toast.error("Erro ao gerar link de aprovação"); return; }
      token = novoToken;

      await supabase.from("pecas").update({ status: "aguardando_aprovacao", etapa_atual: 5 }).eq("id", peca.id);
    }

    const urlAprovacao = `${window.location.origin}/aprovar/${token}`;
    const mensagem = `Olá ${cliente.nome}! 👋\n\nSua peça está pronta para aprovação: *${peca.tipo}* (${peca.cor}).\n\n📋 *Código:* ${peca.codigo_interno}\n⚠️ *Risco:* ${risco.level === 'alto' ? 'Alto' : risco.level === 'medio' ? 'Médio' : 'Baixo'}\n\nAcesse o link para aprovar:\n👉 ${urlAprovacao}\n\n_Este link expira em 48 horas._`;

    const tel = cliente.telefone.replace(/\D/g, '');
    const telFormatado = tel.startsWith('55') ? tel : `55${tel}`;
    window.open(`https://wa.me/${telFormatado}?text=${encodeURIComponent(mensagem)}`, '_blank');
    toast.success("WhatsApp aberto!");
  };

  const handleContinue = async () => {
    if (!peca) return;
    setSaving(true);
    await supabase.from("pecas").update({
      status: "diagnostico",
      etapa_atual: 3,
      risco_calculado: risco.level,
    }).eq("id", peca.id);
    toast.success("Avaliação salva!");
    navigate(`/pecas/${peca.id}/plano`);
    setSaving(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!peca) return <p className="p-4 text-muted-foreground">Peça não encontrada.</p>;

  const riscoColors = { baixo: "bg-green-100 text-green-700", medio: "bg-amber-100 text-amber-700", alto: "bg-red-100 text-red-700" };
  const riscoBarColors = { baixo: "bg-green-500", medio: "bg-amber-500", alto: "bg-red-500" };
  const currentLocalizacoes = ladoAtual === "frente" ? localizacoesFrente : localizacoesVerso;

  return (
    <div className="space-y-4 pb-28">
      <PageHeader
        title="Avaliação de Entrada"
        subtitle={`${peca.codigo_interno} • ${peca.tipo} ${peca.cor}`}
        actions={<button onClick={() => navigate(-1)} className="p-2 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>}
      />

      <div className="px-4 space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={peca.status} />
          {peca.marca && <span className="text-xs text-muted-foreground">• {peca.marca}</span>}
        </div>

        {/* Garment silhouette with frente/verso */}
        <GarmentSilhouette
          tipo={peca.tipo}
          lado={ladoAtual}
          onLadoChange={setLadoAtual}
          diagnosticos={diagnosticos
            .filter(d => d.lado === ladoAtual)
            .map((d) => ({
              localizacao: d.localizacao,
              cor: d.tipo_mancha?.cor_hex || "#6B7280",
            }))}
          onAreaClick={(loc) => {
            if (tiposManchas.length > 0) {
              setModalLoc(loc);
              setSelectedMancha(null);
              setModalOpen(true);
            }
          }}
        />

        {/* Stain type grid */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Tipos de Manchas</h2>
          <div className="grid grid-cols-4 gap-2">
            {tiposManchas.map((m) => (
              <button key={m.id} onClick={() => openManchaModal(m)}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 active:scale-95 transition-transform"
              >
                <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: m.cor_hex + "20" }}>
                  <span className="text-xs" style={{ color: m.cor_hex }}>●</span>
                </div>
                <span className="text-[10px] text-center text-foreground leading-tight">{m.nome}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Registered stains */}
        {diagnosticos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Manchas Registradas ({diagnosticos.length})</h2>
            {diagnosticos.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: (d.tipo_mancha?.cor_hex || "#6B7280") + "20" }}>
                  <span style={{ color: d.tipo_mancha?.cor_hex }}>●</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{d.tipo_mancha?.nome}</p>
                  <p className="text-xs text-muted-foreground">{locLabels[d.localizacao]} • {tamLabels[d.tamanho]} • {d.lado === "verso" ? "Verso" : "Frente"}</p>
                </div>
                <button onClick={() => removeDiagnostico(d.id)} className="p-1 text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Risk calculation */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Cálculo de Risco</h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${riscoColors[risco.level]}`}>
                <AlertTriangle className="h-3.5 w-3.5" />
                {risco.level === "baixo" ? "Baixo" : risco.level === "medio" ? "Médio" : "Alto"}
              </span>
              <span className="text-xs text-muted-foreground">Score: {risco.score}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${riscoBarColors[risco.level]}`}
                style={{ width: `${Math.min(100, (risco.score / 10) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{risco.text}</p>
          </div>
        </div>

        {/* WhatsApp approval button */}
        {diagnosticos.length > 0 && cliente && (
          <div className="space-y-2">
            <Button onClick={enviarWhatsApp} variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
              <MessageSquare className="h-4 w-4 mr-2" />
              Enviar para aprovação via WhatsApp
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Abre o WhatsApp com mensagem pronta para o cliente
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedMancha ? `Registrar: ${selectedMancha.nome}` : "Selecionar Mancha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedMancha && (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {tiposManchas.map((m) => (
                  <button key={m.id} onClick={() => setSelectedMancha(m)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 active:scale-95 transition-transform"
                  >
                    <span style={{ color: m.cor_hex }}>●</span>
                    <span className="text-[10px] text-center">{m.nome}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedMancha && (
              <>
                <Select value={modalLoc} onValueChange={setModalLoc}>
                  <SelectTrigger><SelectValue placeholder="Localização" /></SelectTrigger>
                  <SelectContent>
                    {currentLocalizacoes.map((l) => <SelectItem key={l} value={l}>{locLabels[l]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={modalTam} onValueChange={setModalTam}>
                  <SelectTrigger><SelectValue placeholder="Tamanho" /></SelectTrigger>
                  <SelectContent>
                    {tamanhos.map((t) => <SelectItem key={t} value={t}>{tamLabels[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Observação (opcional)" value={modalObs} onChange={(e) => setModalObs(e.target.value)} rows={2} />
                <Button onClick={addDiagnostico} className="w-full" disabled={!modalLoc}>
                  <Plus className="h-4 w-4 mr-2" /> Registrar Mancha
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom action */}
      <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur lg:ml-64">
        <Button onClick={handleContinue} className="w-full h-12 text-base font-semibold" disabled={saving}>
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continuar para Plano Técnico"}
        </Button>
      </div>
    </div>
  );
}
