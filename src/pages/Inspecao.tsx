import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Peca } from "@/types/database";

interface CheckItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
  observation: string;
}

const defaultChecklist: CheckItem[] = [
  { id: "limpeza", label: "Peça está limpa e sem odores", required: true, checked: false, observation: "" },
  { id: "manchas", label: "Manchas foram removidas", required: true, checked: false, observation: "" },
  { id: "integridade", label: "Sem danos ou desgastes novos", required: true, checked: false, observation: "" },
  { id: "cor", label: "Cor preservada (sem desbotamento)", required: true, checked: false, observation: "" },
  { id: "forma", label: "Forma e caimento preservados", required: false, checked: false, observation: "" },
  { id: "aviamentos", label: "Botões, zíperes, etc. funcionando", required: false, checked: false, observation: "" },
  { id: "passadoria", label: "Passadoria adequada (se aplicável)", required: false, checked: false, observation: "" },
];

export default function Inspecao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [peca, setPeca] = useState<Peca | null>(null);
  const [checklist, setChecklist] = useState<CheckItem[]>(defaultChecklist);
  const [manchasRemovidas, setManchasRemovidas] = useState(true);
  const [manchasParciais, setManchasParciais] = useState(false);
  const [danosIdentificados, setDanosIdentificados] = useState(false);
  const [danosDescricao, setDanosDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    const { data } = await supabase.from("pecas").select("*, clientes(nome)").eq("id", id).single();
    setPeca(data as unknown as Peca);
    setLoading(false);
  };

  const toggleCheck = (idx: number) => {
    const updated = [...checklist];
    updated[idx].checked = !updated[idx].checked;
    setChecklist(updated);
  };

  const setCheckObs = (idx: number, obs: string) => {
    const updated = [...checklist];
    updated[idx].observation = obs;
    setChecklist(updated);
  };

  const requiredOk = checklist.filter((c) => c.required).every((c) => c.checked);

  const salvarInspecao = async (aprovado: boolean) => {
    if (!peca || !user) return;
    if (aprovado && !requiredOk) {
      toast.error("Marque todos os itens obrigatórios antes de aprovar.");
      return;
    }
    setSaving(true);

    const { error } = await supabase.from("inspecoes").insert({
      peca_id: peca.id,
      checklist: checklist.map(({ id, label, checked, observation }) => ({ id, label, checked, observation })),
      manchas_removidas: manchasRemovidas,
      manchas_parciais: manchasParciais,
      danos_identificados: danosIdentificados,
      danos_descricao: danosIdentificados ? danosDescricao : null,
      aprovado,
      requer_retrabalho: !aprovado,
      observacoes: observacoes || null,
      inspecionado_por: user.id,
    });

    if (error) { toast.error("Erro ao salvar inspeção"); setSaving(false); return; }

    const newStatus = aprovado ? "pronto" : "em_processo";
    const newEtapa = aprovado ? 9 : 7;

    await supabase.from("pecas").update({ status: newStatus, etapa_atual: newEtapa }).eq("id", peca.id);

    if (aprovado) {
      // Notify via WhatsApp
      const cliente = peca.clientes as any;
      if (cliente?.telefone) {
        const tel = (cliente.telefone as string).replace(/\D/g, "");
        const msg = `Olá ${cliente.nome}! 🎉\n\nSua peça (${peca.tipo} ${peca.cor}) está pronta para retirada!\n\nAguardamos você!`;
        window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    }

    toast.success(aprovado ? "Peça aprovada! Status: Pronto" : "Peça enviada para retrabalho");
    navigate(`/pecas/${peca.id}`);
    setSaving(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!peca) return <p className="p-4 text-muted-foreground">Peça não encontrada.</p>;

  return (
    <div className="space-y-4 pb-28">
      <PageHeader title="Inspeção de Qualidade" subtitle={`${peca.codigo_interno} • ${peca.tipo}`}
        actions={<button onClick={() => navigate(-1)} className="p-2 text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>}
      />

      <div className="px-4 space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={peca.status} />
          <span className="text-sm text-muted-foreground">{peca.clientes?.nome}</span>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Checklist de Qualidade</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {checklist.map((item, idx) => (
              <div key={item.id} className="p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleCheck(idx)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      {item.label}
                      {item.required && <span className="text-destructive ml-1">*</span>}
                    </p>
                  </div>
                </div>
                {!item.checked && item.required && (
                  <Textarea
                    placeholder="Descreva o problema..."
                    value={item.observation}
                    onChange={(e) => setCheckObs(idx, e.target.value)}
                    rows={1}
                    className="text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stain results */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Resultado das Manchas</h2>
          <div className="rounded-xl border border-border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Manchas totalmente removidas</span>
              <Switch checked={manchasRemovidas} onCheckedChange={(v) => { setManchasRemovidas(v); if (v) setManchasParciais(false); }} />
            </div>
            {!manchasRemovidas && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Remoção parcial</span>
                <Switch checked={manchasParciais} onCheckedChange={setManchasParciais} />
              </div>
            )}
          </div>
        </div>

        {/* Damage check */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Danos</h2>
          <div className="rounded-xl border border-border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Danos identificados durante processo</span>
              <Switch checked={danosIdentificados} onCheckedChange={setDanosIdentificados} />
            </div>
            {danosIdentificados && (
              <Textarea placeholder="Descreva os danos..." value={danosDescricao} onChange={(e) => setDanosDescricao(e.target.value)} rows={2} />
            )}
          </div>
        </div>

        {/* General observations */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Observações Gerais</h2>
          <Textarea placeholder="Observações adicionais..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
        </div>
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur lg:ml-64 space-y-2">
        <Button onClick={() => salvarInspecao(true)} className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700" disabled={saving || !requiredOk}>
          <CheckCircle2 className="h-5 w-5 mr-2" /> Aprovar para Entrega
        </Button>
        <Button onClick={() => salvarInspecao(false)} variant="outline" className="w-full h-10 text-amber-600 border-amber-300" disabled={saving}>
          <AlertTriangle className="h-4 w-4 mr-2" /> Enviar para Retrabalho
        </Button>
      </div>
    </div>
  );
}
