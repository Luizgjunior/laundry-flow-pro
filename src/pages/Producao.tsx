import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Clock, CheckCircle2, Play, Send, Camera, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Peca } from "@/types/database";

interface PlanoEtapa {
  id: string;
  etapa: number;
  tipo: string;
  produto_id: string | null;
  maquina_id: string | null;
  programa: string | null;
  temperatura: number | null;
  duracao_minutos: number | null;
  observacoes: string | null;
  produtos?: { nome: string } | null;
  maquinas?: { nome: string } | null;
}

interface Execucao {
  id: string;
  plano_tecnico_id: string | null;
  etapa_numero: number;
  resultado: string | null;
}

export default function Producao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [peca, setPeca] = useState<Peca | null>(null);
  const [etapas, setEtapas] = useState<PlanoEtapa[]>([]);
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [tecnicos, setTecnicos] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState("");

  // Execution modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeEtapa, setActiveEtapa] = useState<PlanoEtapa | null>(null);
  const [execForm, setExecForm] = useState({ temperatura_real: 0, duracao_real_minutos: 0, observacoes: "", resultado: "sucesso" });

  // Photos for execution
  const [execPhotos, setExecPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (id) loadData(); }, [id]);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Date.now() - startTime.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setElapsed(`${h}h${m.toString().padStart(2, "0")}m`);
    }, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  const loadData = async () => {
    const [pecaRes, etapasRes, execRes, tecRes] = await Promise.all([
      supabase.from("pecas").select("*, clientes(nome)").eq("id", id).single(),
      supabase.from("planos_tecnicos").select("*, produtos:produto_id(nome), maquinas:maquina_id(nome)").eq("peca_id", id).order("etapa"),
      supabase.from("execucoes").select("id, plano_tecnico_id, etapa_numero, resultado").eq("peca_id", id),
      supabase.from("users").select("id, nome").eq("ativo", true),
    ]);
    const p = pecaRes.data as unknown as Peca;
    setPeca(p);
    setEtapas((etapasRes.data as unknown as PlanoEtapa[]) || []);
    setExecucoes((execRes.data as Execucao[]) || []);
    setTecnicos((tecRes.data as { id: string; nome: string }[]) || []);
    if (p?.data_inicio_processo) setStartTime(new Date(p.data_inicio_processo));
    setLoading(false);
  };

  const iniciarProcesso = async () => {
    if (!peca) return;
    setSaving(true);
    const now = new Date().toISOString();
    await supabase.from("pecas").update({ status: "em_processo", etapa_atual: 7, data_inicio_processo: now }).eq("id", peca.id);
    setPeca({ ...peca, status: "em_processo", etapa_atual: 7, data_inicio_processo: now });
    setStartTime(new Date(now));
    toast.success("Processo iniciado!");
    setSaving(false);
  };

  const atribuirTecnico = async (userId: string) => {
    if (!peca) return;
    await supabase.from("pecas").update({ atribuido_a: userId }).eq("id", peca.id);
    setPeca({ ...peca, atribuido_a: userId });
    toast.success("Peça atribuída!");
  };

  const openExecModal = (etapa: PlanoEtapa) => {
    setActiveEtapa(etapa);
    setExecForm({
      temperatura_real: etapa.temperatura || 30,
      duracao_real_minutos: etapa.duracao_minutos || 30,
      observacoes: "",
      resultado: "sucesso",
    });
    setExecPhotos([]);
    setPhotoPreviews([]);
    setModalOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = [...execPhotos, ...files];
    setExecPhotos(newPhotos);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setExecPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const compressImage = (file: File, maxSize = 800): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize; }
          else { width = (width / height) * maxSize; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
      };
      img.src = url;
    });
  };

  const uploadPhotos = async (execucaoId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of execPhotos) {
      const compressed = await compressImage(file);
      const path = `${id}/processo/${execucaoId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("pecas-fotos").upload(path, compressed, { contentType: "image/jpeg" });
      if (!error) {
        urls.push(path);
      }
    }
    return urls;
  };

  const finalizarEtapa = async () => {
    if (!activeEtapa || !id || !user) return;

    if (execPhotos.length === 0) {
      toast.error("Adicione pelo menos uma foto da peça para finalizar a etapa.");
      return;
    }

    setSaving(true);
    setUploadingPhotos(true);

    const { data, error } = await supabase.from("execucoes").insert({
      peca_id: id,
      plano_tecnico_id: activeEtapa.id,
      etapa_numero: activeEtapa.etapa,
      maquina_id: activeEtapa.maquina_id,
      produto_id: activeEtapa.produto_id,
      temperatura_real: execForm.temperatura_real,
      duracao_real_minutos: execForm.duracao_real_minutos,
      observacoes: execForm.observacoes || null,
      resultado: execForm.resultado,
      executado_por: user.id,
      iniciado_em: new Date().toISOString(),
      finalizado_em: new Date().toISOString(),
    }).select("id, plano_tecnico_id, etapa_numero, resultado").single();

    if (error) { toast.error("Erro ao registrar execução"); setSaving(false); setUploadingPhotos(false); return; }

    // Upload photos and save paths to execution
    const fotoPaths = await uploadPhotos(data.id);
    if (fotoPaths.length > 0) {
      await supabase.from("execucoes").update({ fotos: fotoPaths }).eq("id", data.id);

      // Also register in fotos table for each photo
      const fotoInserts = fotoPaths.map((path) => ({
        peca_id: id!,
        storage_path: path,
        tipo: "processo" as const,
        created_by: user.id,
        tamanho_bytes: 0,
      }));
      await supabase.from("fotos").insert(fotoInserts);
    }

    setExecucoes((prev) => [...prev, data as Execucao]);
    setModalOpen(false);
    setSaving(false);
    setUploadingPhotos(false);
    toast.success("Etapa finalizada!");
  };

  const enviarParaInspecao = async () => {
    if (!peca) return;
    setSaving(true);
    const now = new Date().toISOString();
    await supabase.from("pecas").update({ status: "inspecao", etapa_atual: 8, data_fim_processo: now }).eq("id", peca.id);
    toast.success("Peça enviada para inspeção!");
    navigate(`/pecas/${peca.id}`);
    setSaving(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!peca) return <p className="p-4 text-muted-foreground">Peça não encontrada.</p>;

  const isEtapaExecutada = (etapaId: string) => execucoes.some((e) => e.plano_tecnico_id === etapaId);
  const allDone = etapas.length > 0 && etapas.every((e) => isEtapaExecutada(e.id));
  const tipoLabels: Record<string, string> = { pre_tratamento: "Pré-tratamento", lavadoria: "Lavadoria", lavagem: "Lavadoria", secagem: "Secagem", passadoria: "Passadoria", controle_qualidade: "Controle de Qualidade", acabamento: "Controle de Qualidade" };

  return (
    <div className="space-y-4 pb-28">
      <PageHeader title="Produção" subtitle={peca.codigo_interno}
        actions={<button onClick={() => navigate(-1)} className="p-2 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>}
      />

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusBadge status={peca.status} />
            <span className="text-sm text-muted-foreground">{peca.clientes?.nome}</span>
          </div>
          {startTime && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {elapsed || "0h00m"}
            </div>
          )}
        </div>

        {/* Assign technician */}
        <Select value={peca.atribuido_a || ""} onValueChange={atribuirTecnico}>
          <SelectTrigger><SelectValue placeholder="Atribuir técnico..." /></SelectTrigger>
          <SelectContent>
            {tecnicos.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        {peca.status === "aprovado" && (
          <Button onClick={iniciarProcesso} className="w-full h-12" disabled={saving}>
            <Play className="h-5 w-5 mr-2" /> Iniciar Processo
          </Button>
        )}

        {/* Steps */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Plano Técnico</h2>
          {etapas.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma etapa planejada</p>
          ) : etapas.map((e, idx) => {
            const done = isEtapaExecutada(e.id);
            const previousDone = idx === 0 || isEtapaExecutada(etapas[idx - 1].id);
            const locked = !done && !previousDone;
            const isDisabled = done || peca.status !== "em_processo" || locked;
            return (
              <button key={e.id} onClick={() => !isDisabled && openExecModal(e)} disabled={isDisabled}
                className={`w-full text-left rounded-xl border p-3 flex items-start gap-3 transition-colors ${done ? "border-green-200 bg-green-50/50" : locked ? "border-border bg-muted/30 opacity-60" : "border-border bg-card active:bg-muted"}`}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${done ? "bg-green-500 text-white" : locked ? "bg-muted text-muted-foreground/50" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : e.etapa}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${locked ? "text-muted-foreground" : "text-foreground"}`}>{tipoLabels[e.tipo] || e.tipo}</p>
                  <p className="text-xs text-muted-foreground">
                    {locked ? "🔒 Conclua a etapa anterior primeiro" : [e.produtos?.nome, e.maquinas?.nome, e.temperatura ? `${e.temperatura}°C` : null, e.duracao_minutos ? `${e.duracao_minutos}min` : null].filter(Boolean).join(" • ")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Execution modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Executar: {activeEtapa ? tipoLabels[activeEtapa.tipo] || activeEtapa.tipo : ""}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {activeEtapa?.maquinas?.nome && <p className="text-sm text-muted-foreground">Máquina: {activeEtapa.maquinas.nome}</p>}
            {activeEtapa?.produtos?.nome && <p className="text-sm text-muted-foreground">Produto: {activeEtapa.produtos.nome}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Temp. real (°C)</label>
                <Input type="number" value={execForm.temperatura_real} onChange={(e) => setExecForm({ ...execForm, temperatura_real: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duração real (min)</label>
                <Input type="number" value={execForm.duracao_real_minutos} onChange={(e) => setExecForm({ ...execForm, duracao_real_minutos: +e.target.value })} />
              </div>
            </div>
            <Select value={execForm.resultado} onValueChange={(v) => setExecForm({ ...execForm, resultado: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sucesso">✅ Sucesso</SelectItem>
                <SelectItem value="parcial">⚠️ Parcial</SelectItem>
                <SelectItem value="retrabalho_necessario">🔄 Retrabalho necessário</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Observações" value={execForm.observacoes} onChange={(e) => setExecForm({ ...execForm, observacoes: e.target.value })} rows={2} />

            {/* Photo section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  Fotos da peça <span className="text-destructive">*</span>
                </label>
                <span className="text-xs text-muted-foreground">{execPhotos.length} foto(s)</span>
              </div>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                {execPhotos.length === 0 ? "Tirar / Selecionar Foto" : "Adicionar mais fotos"}
              </Button>

              {execPhotos.length === 0 && (
                <p className="text-xs text-destructive text-center">
                  📸 Obrigatório: pelo menos 1 foto para finalizar a etapa
                </p>
              )}
            </div>

            <Button onClick={finalizarEtapa} className="w-full" disabled={saving || execPhotos.length === 0}>
              {uploadingPhotos ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando fotos...</>
              ) : saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalizar Etapa
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom action */}
      {allDone && peca.status === "em_processo" && (
        <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur lg:ml-64">
          <Button onClick={enviarParaInspecao} className="w-full h-12 text-base font-semibold" disabled={saving}>
            <Send className="h-5 w-5 mr-2" /> Enviar para Inspeção
          </Button>
        </div>
      )}
    </div>
  );
}
