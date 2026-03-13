import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Plus, X, Trash2, GripVertical, Send } from "lucide-react";
import { IASugestaoProcesso } from "@/components/IASugestaoProcesso";
import { toast } from "sonner";
import type { Peca } from "@/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlanoEtapa {
  id?: string;
  etapa: number;
  tipo: string;
  produto_id: string | null;
  produto_nome?: string;
  maquina_id: string | null;
  maquina_nome?: string;
  programa: string;
  temperatura: number;
  duracao_minutos: number;
  observacoes: string;
}

interface Produto { id: string; nome: string; tipo: string }
interface Maquina { id: string; nome: string; tipo: string; programas: any[] }

const tipoEtapas = [
  { value: "pre_tratamento", label: "Pré-tratamento" },
  { value: "lavadoria", label: "Lavadoria" },
  { value: "secagem", label: "Secagem" },
  { value: "passadoria", label: "Passadoria" },
  { value: "controle_qualidade", label: "Controle de Qualidade" },
];

export default function PlanoTecnico() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [peca, setPeca] = useState<Peca | null>(null);
  const [etapas, setEtapas] = useState<PlanoEtapa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [diagCount, setDiagCount] = useState(0);
  const [riscoLevel, setRiscoLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<PlanoEtapa>({
    etapa: 1, tipo: "", produto_id: null, maquina_id: null, programa: "", temperatura: 30, duracao_minutos: 30, observacoes: ""
  });

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    const [pecaRes, prodRes, maqRes, diagRes, planoRes] = await Promise.all([
      supabase.from("pecas").select("*, clientes(nome, telefone)").eq("id", id).single(),
      supabase.from("produtos").select("*"),
      supabase.from("maquinas").select("*").eq("ativa", true),
      supabase.from("diagnosticos").select("*, tipos_manchas(nome)").eq("peca_id", id),
      supabase.from("planos_tecnicos").select("*, produtos:produto_id(nome), maquinas:maquina_id(nome)").eq("peca_id", id).order("etapa"),
    ]);
    setPeca(pecaRes.data as unknown as Peca);
    setProdutos((prodRes.data as Produto[]) || []);
    setMaquinas((maqRes.data as Maquina[]) || []);
    const diags = (diagRes.data || []).map((d: any) => ({ ...d, tipo: d.tipos_manchas?.nome || "mancha" }));
    setDiagnosticos(diags);
    setDiagCount(diags.length);
    setRiscoLevel((pecaRes.data as any)?.risco_calculado || "");
    setEtapas((planoRes.data as any[])?.map((p: any) => ({
      ...p,
      produto_nome: p.produtos?.nome,
      maquina_nome: p.maquinas?.nome,
    })) || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditIdx(null);
    setForm({ etapa: etapas.length + 1, tipo: "", produto_id: null, maquina_id: null, programa: "", temperatura: 30, duracao_minutos: 30, observacoes: "" });
    setModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    setEditIdx(idx);
    setForm(etapas[idx]);
    setModalOpen(true);
  };

  const saveEtapa = async () => {
    if (!form.tipo || !id) return;
    setSaving(true);

    if (editIdx !== null && etapas[editIdx].id) {
      await supabase.from("planos_tecnicos").update({
        tipo: form.tipo, produto_id: form.produto_id, maquina_id: form.maquina_id,
        programa: form.programa, temperatura: form.temperatura, duracao_minutos: form.duracao_minutos,
        observacoes: form.observacoes,
      }).eq("id", etapas[editIdx].id!);
      const updated = [...etapas];
      updated[editIdx] = { ...updated[editIdx], ...form };
      setEtapas(updated);
    } else {
      const { data } = await supabase.from("planos_tecnicos").insert({
        peca_id: id, etapa: form.etapa, tipo: form.tipo,
        produto_id: form.produto_id, maquina_id: form.maquina_id,
        programa: form.programa, temperatura: form.temperatura,
        duracao_minutos: form.duracao_minutos, observacoes: form.observacoes,
        created_by: user?.id,
      }).select().single();
      if (data) setEtapas((prev) => [...prev, { ...data, produto_nome: produtos.find(p => p.id === form.produto_id)?.nome, maquina_nome: maquinas.find(m => m.id === form.maquina_id)?.nome }]);
    }

    setModalOpen(false);
    setSaving(false);
    toast.success("Etapa salva!");
  };

  const removeEtapa = async (idx: number) => {
    if (etapas[idx].id) await supabase.from("planos_tecnicos").delete().eq("id", etapas[idx].id!);
    setEtapas((prev) => prev.filter((_, i) => i !== idx));
  };

  const enviarParaAprovacao = async () => {
    if (!peca || etapas.length === 0) { toast.error("Adicione pelo menos uma etapa."); return; }
    setSaving(true);

    const token = crypto.randomUUID().replace(/-/g, "");
    await supabase.from("aprovacoes").insert({
      peca_id: peca.id,
      token,
      status: "pendente",
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

    await supabase.from("pecas").update({ status: "aguardando_aprovacao", etapa_atual: 6 }).eq("id", peca.id);

    const cliente = peca.clientes as any;
    const linkAprovacao = `${window.location.origin}/aprovar/${token}`;
    
    const etapasResumo = etapas.map((e, i) => {
      const label = tipoEtapas.find(t => t.value === e.tipo)?.label || e.tipo;
      return `   ${i + 1}. ${label}${e.temperatura ? ` (${e.temperatura}°C)` : ""}${e.duracao_minutos ? ` - ${e.duracao_minutos}min` : ""}`;
    }).join("\n");
    
    const valorTexto = peca.valor_servico ? `\n💰 *Valor do serviço:* R$ ${Number(peca.valor_servico).toFixed(2).replace(".", ",")}\n` : "";
    const riscoTexto = riscoLevel ? `\n⚠️ *Nível de risco:* ${riscoLevel.charAt(0).toUpperCase() + riscoLevel.slice(1)}` : "";
    const previsaoTexto = peca.previsao_entrega ? `\n📅 *Previsão de entrega:* ${new Date(peca.previsao_entrega + "T12:00:00").toLocaleDateString("pt-BR")}` : "";
    const diagTexto = diagnosticos.length > 0 ? `\n🔍 *Diagnóstico:* ${diagnosticos.length} mancha(s) identificada(s)` : "";
    
    const mensagem = `Olá ${cliente?.nome}! 👋\n\nSua peça *${peca.tipo} ${peca.cor}*${peca.marca ? ` (${peca.marca})` : ""} foi analisada pela nossa equipe e está aguardando sua aprovação.\n${diagTexto}${riscoTexto}\n\n🧪 *Plano de tratamento (${etapas.length} etapas):*\n${etapasResumo}\n${valorTexto}${previsaoTexto}\n\n📋 Revise todos os detalhes, fotos e termos no link abaixo:\n${linkAprovacao}\n\n⏰ Este link expira em 48 horas.`;
    const telefone = (cliente?.telefone || "").replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, "_blank");

    toast.success("Link de aprovação gerado e WhatsApp aberto!");
    navigate(`/pecas/${peca.id}`);
    setSaving(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!peca) return <p className="p-4 text-muted-foreground">Peça não encontrada.</p>;

  const riscoColors: Record<string, string> = { baixo: "bg-green-100 text-green-700", medio: "bg-amber-100 text-amber-700", alto: "bg-red-100 text-red-700" };

  return (
    <div className="space-y-4 pb-28">
      <PageHeader title="Plano Técnico" subtitle={peca.codigo_interno}
        actions={<button onClick={() => navigate(-1)} className="p-2 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>}
      />

      <div className="px-4 space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={peca.status} />
          <span className="text-xs text-muted-foreground">{diagCount} manchas</span>
          {riscoLevel && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riscoColors[riscoLevel] || ""}`}>
              Risco {riscoLevel}
            </span>
          )}
        </div>

        {/* IA Suggestion */}
        <IASugestaoProcesso
          peca={peca}
          diagnosticos={diagnosticos}
          maquinas={maquinas}
          produtos={produtos}
          onAplicarSugestao={async (sugestao) => {
            // Clear existing steps and create from AI suggestion
            for (const e of etapas) {
              if (e.id) await supabase.from("planos_tecnicos").delete().eq("id", e.id);
            }
            const novasEtapas: PlanoEtapa[] = [];
            for (const [i, etapa] of (sugestao.etapas || []).entries()) {
              const prodMatch = produtos.find(p => p.nome.toLowerCase().includes((etapa.produtos?.[0]?.nome || "").toLowerCase()));
              const maqMatch = maquinas.find(m => m.nome.toLowerCase().includes((etapa.maquina_sugerida || "").toLowerCase()));
              const { data } = await supabase.from("planos_tecnicos").insert({
                peca_id: id!, etapa: i + 1, tipo: etapa.tipo || "pre_tratamento",
                produto_id: prodMatch?.id || null, maquina_id: maqMatch?.id || null,
                programa: "", temperatura: etapa.temperatura || 30,
                duracao_minutos: etapa.duracao_minutos || 30,
                observacoes: etapa.descricao || "", created_by: user?.id,
              }).select().single();
              if (data) novasEtapas.push({ ...data, produto_nome: prodMatch?.nome, maquina_nome: maqMatch?.nome });
            }
            setEtapas(novasEtapas);
            if (sugestao.valor_sugerido) {
              await supabase.from("pecas").update({ valor_servico: sugestao.valor_sugerido }).eq("id", id!);
            }
          }}
        />

        {/* Steps list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Etapas do Tratamento</h2>
            <Button size="sm" variant="outline" onClick={openAddModal}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </div>

          {etapas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma etapa adicionada</p>
              <Button size="sm" className="mt-3" onClick={openAddModal}><Plus className="h-4 w-4 mr-1" /> Primeira Etapa</Button>
            </div>
          ) : (
            etapas.map((e, i) => (
              <div key={e.id || i} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0" onClick={() => openEditModal(i)}>
                  <p className="text-sm font-medium text-foreground capitalize">{e.tipo.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {[e.produto_nome, e.maquina_nome, e.temperatura ? `${e.temperatura}°C` : null, e.duracao_minutos ? `${e.duracao_minutos}min` : null]
                      .filter(Boolean).join(" • ")}
                  </p>
                </div>
                <button onClick={() => removeEtapa(i)} className="p-1 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))
          )}
        </div>

        {/* Preview for client */}
        {etapas.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Preview para o Cliente</h2>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm text-foreground">Sua peça passará por:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {etapas.map((e, i) => <li key={i}>• {tipoEtapas.find(t => t.value === e.tipo)?.label || e.tipo}</li>)}
              </ul>
              {riscoLevel && <p className="text-xs text-muted-foreground mt-2">⚠️ Nível de risco: {riscoLevel}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editIdx !== null ? "Editar Etapa" : "Nova Etapa"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue placeholder="Tipo de etapa" /></SelectTrigger>
              <SelectContent>{tipoEtapas.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            {produtos.length > 0 && (
              <Select value={form.produto_id || ""} onValueChange={(v) => setForm({ ...form, produto_id: v || null })}>
                <SelectTrigger><SelectValue placeholder="Produto (opcional)" /></SelectTrigger>
                <SelectContent>{produtos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {maquinas.length > 0 && (
              <Select value={form.maquina_id || ""} onValueChange={(v) => setForm({ ...form, maquina_id: v || null })}>
                <SelectTrigger><SelectValue placeholder="Máquina (opcional)" /></SelectTrigger>
                <SelectContent>{maquinas.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Temperatura (°C)</label>
                <Input type="number" value={form.temperatura} onChange={(e) => setForm({ ...form, temperatura: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duração (min)</label>
                <Input type="number" value={form.duracao_minutos} onChange={(e) => setForm({ ...form, duracao_minutos: +e.target.value })} />
              </div>
            </div>
            <Textarea placeholder="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            <Button onClick={saveEtapa} className="w-full" disabled={!form.tipo || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editIdx !== null ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom actions - only show save hint, approval moved to PecaDetail */}
      {etapas.length > 0 && peca.status !== "aguardando_aprovacao" && (
        <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur lg:ml-64 space-y-2">
          <Button onClick={enviarParaAprovacao} className="w-full h-12 text-base font-semibold" disabled={saving || etapas.length === 0}>
            <Send className="h-5 w-5 mr-2" /> Enviar para Aprovação
          </Button>
        </div>
      )}
    </div>
  );
}
