import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  };
  tenant: {
    nome_fantasia: string;
    logo_url: string | null;
  };
  fotos: { url: string; tipo: string }[];
  diagnosticos: { nome: string; localizacao: string }[];
  etapas: string[];
}

const riscoTexts: Record<string, { label: string; desc: string; color: string }> = {
  baixo: { label: "Baixo", desc: "Tratamento padrão com alta taxa de sucesso.", color: "bg-green-100 text-green-700" },
  medio: { label: "Médio", desc: "Requer cuidados especiais. Pequeno risco de alteração.", color: "bg-amber-100 text-amber-700" },
  alto: { label: "Alto", desc: "Tecido delicado ou manchas difíceis. Risco de danos.", color: "bg-red-100 text-red-700" },
};

const tipoEtapaLabels: Record<string, string> = {
  pre_tratamento: "Pré-tratamento de manchas",
  lavagem: "Lavagem especial",
  secagem: "Secagem controlada",
  passadoria: "Passadoria profissional",
  acabamento: "Acabamento final",
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

    // Load piece data
    const { data: peca } = await supabase.from("pecas").select("*").eq("id", aprov.peca_id).single();
    if (!peca) { setError("Peça não encontrada."); setLoading(false); return; }

    const [tenantRes, fotosRes, diagRes, planoRes] = await Promise.all([
      supabase.from("tenants").select("nome_fantasia, logo_url").eq("id", peca.tenant_id).single(),
      supabase.from("fotos").select("storage_path, tipo").eq("peca_id", peca.id),
      supabase.from("diagnosticos").select("*, tipos_manchas:tipo_mancha_id(nome)").eq("peca_id", peca.id),
      supabase.from("planos_tecnicos").select("tipo").eq("peca_id", peca.id).order("etapa"),
    ]);

    const fotos = (fotosRes.data || []).map((f: any) => ({
      url: supabase.storage.from("pecas-fotos").getPublicUrl(f.storage_path).data.publicUrl,
      tipo: f.tipo,
    }));

    setData({
      id: aprov.id,
      token: aprov.token,
      status: aprov.status,
      expires_at: aprov.expires_at,
      peca: { id: peca.id, codigo_interno: peca.codigo_interno, tipo: peca.tipo, cor: peca.cor, marca: peca.marca, risco_calculado: peca.risco_calculado, tenant_id: peca.tenant_id },
      tenant: tenantRes.data as any,
      fotos,
      diagnosticos: (diagRes.data || []).map((d: any) => ({ nome: d.tipos_manchas?.nome || "Mancha", localizacao: d.localizacao })),
      etapas: (planoRes.data || []).map((p: any) => p.tipo),
    });
    setLoading(false);
  };

  const handleRespond = async (status: "aprovado" | "recusado") => {
    if (!data) return;
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

    if (status === "aprovado") {
      await supabase.from("pecas").update({ status: "em_processo", etapa_atual: 7 }).eq("id", data.peca.id);
    } else {
      await supabase.from("pecas").update({ status: "recusado", etapa_atual: 6 }).eq("id", data.peca.id);
    }

    setResult(status);
    setSubmitting(false);
  };

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
      </div>
    );
  }

  if (!data) return null;

  const risco = riscoTexts[data.peca.risco_calculado || "baixo"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-6 py-6 text-center">
        {data.tenant.logo_url ? (
          <img src={data.tenant.logo_url} alt="" className="h-12 w-12 mx-auto rounded-xl mb-2" />
        ) : (
          <div className="h-12 w-12 mx-auto rounded-xl bg-primary-foreground/20 flex items-center justify-center mb-2">
            <span className="text-lg font-bold text-primary-foreground">T</span>
          </div>
        )}
        <p className="text-primary-foreground font-semibold">{data.tenant.nome_fantasia}</p>
        <p className="text-primary-foreground/80 text-sm mt-1">Aprovação de Tratamento</p>
      </div>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* Piece info */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Código</p>
          <p className="font-bold text-foreground">{data.peca.codigo_interno}</p>
          <p className="text-sm text-muted-foreground mt-1">{data.peca.tipo} • {data.peca.cor}{data.peca.marca ? ` • ${data.peca.marca}` : ""}</p>
        </div>

        {/* Photos carousel */}
        {data.fotos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Fotos da Peça</h2>
            <div className="relative rounded-xl overflow-hidden border border-border bg-card aspect-[4/3]">
              <img src={data.fotos[currentPhoto]?.url} alt="" className="w-full h-full object-cover" />
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
          </div>
        )}

        {/* Diagnostics */}
        {data.diagnosticos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Diagnóstico</h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-foreground mb-2">Encontramos {data.diagnosticos.length} mancha(s) na sua peça:</p>
              <ul className="space-y-1">
                {data.diagnosticos.map((d, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {d.nome}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Risk level */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Nível de Risco</h2>
          <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              data.peca.risco_calculado === "alto" ? "text-red-500" : data.peca.risco_calculado === "medio" ? "text-amber-500" : "text-green-500"
            }`} />
            <div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${risco.color}`}>{risco.label}</span>
              <p className="text-sm text-muted-foreground mt-1">{risco.desc}</p>
            </div>
          </div>
        </div>

        {/* Treatment proposed */}
        {data.etapas.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Tratamento Proposto</h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-foreground mb-2">Sua peça passará por:</p>
              <ul className="space-y-1">
                {[...new Set(data.etapas)].map((e, i) => (
                  <li key={i} className="text-sm text-muted-foreground">✓ {tipoEtapaLabels[e] || e}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Checkbox id="terms" checked={accepted} onCheckedChange={(c) => setAccepted(!!c)} className="mt-0.5" />
          <label htmlFor="terms" className="text-sm text-foreground">
            Li e aceito os{" "}
            <button onClick={() => setTermosOpen(true)} className="text-primary underline font-medium">termos de tratamento</button>
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
        </div>
      </div>

      {/* Terms dialog */}
      <Dialog open={termosOpen} onOpenChange={setTermosOpen}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Termos de Tratamento</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3">
            <p><strong>1. Descrição dos Riscos</strong><br />
            O tratamento de tecidos envolve processos químicos e mecânicos que podem, em casos excepcionais, causar alterações na cor, textura ou integridade da peça.</p>
            <p><strong>2. Isenção de Responsabilidade</strong><br />
            Para peças classificadas como risco MÉDIO ou ALTO, o estabelecimento não se responsabiliza por eventuais danos decorrentes do processo, desde que devidamente informados neste documento.</p>
            <p><strong>3. Política de Reembolso</strong><br />
            Em caso de danos em peças de risco BAIXO, o cliente será indenizado conforme política vigente do estabelecimento.</p>
            <p><strong>4. Prazo de Retirada</strong><br />
            A peça deve ser retirada em até 30 dias após a conclusão do tratamento. Após esse prazo, poderão ser cobradas taxas de armazenamento.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
