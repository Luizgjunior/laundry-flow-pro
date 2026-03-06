import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { ClienteSearch } from "@/components/ClienteSearch";
import { PillSelector } from "@/components/PillSelector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Cliente } from "@/types/database";

const tipoOptions = [
  { value: "camisa", label: "Camisa" },
  { value: "calca", label: "Calça" },
  { value: "vestido", label: "Vestido" },
  { value: "terno", label: "Terno" },
  { value: "jaqueta", label: "Jaqueta" },
  { value: "outro", label: "Outro" },
];

const corOptions = [
  { value: "branco", label: "Branco", color: "#FFFFFF" },
  { value: "preto", label: "Preto", color: "#1a1a1a" },
  { value: "azul", label: "Azul", color: "#2563EB" },
  { value: "vermelho", label: "Vermelho", color: "#DC2626" },
  { value: "verde", label: "Verde", color: "#16A34A" },
  { value: "bege", label: "Bege", color: "#D4B896" },
  { value: "cinza", label: "Cinza", color: "#9CA3AF" },
  { value: "rosa", label: "Rosa", color: "#EC4899" },
];

const composicaoOptions = [
  { value: "algodao", label: "Algodão" },
  { value: "poliester", label: "Poliéster" },
  { value: "seda", label: "Seda" },
  { value: "la", label: "Lã" },
  { value: "linho", label: "Linho" },
  { value: "viscose", label: "Viscose" },
];

export default function NovaPeca() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"cliente" | "detalhes">("cliente");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tipo, setTipo] = useState<string[]>([]);
  const [cor, setCor] = useState<string[]>([]);
  const [composicao, setComposicao] = useState<string[]>([]);
  const [marca, setMarca] = useState("");
  const [saving, setSaving] = useState(false);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [value]));
  };

  const handleToggleMulti = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleSave = async () => {
    if (!cliente || tipo.length === 0 || cor.length === 0) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    const codigo = `TX-${Date.now().toString(36).toUpperCase()}`;
    const compObj = composicao.length > 0
      ? Object.fromEntries(composicao.map((c) => [c, Math.floor(100 / composicao.length)]))
      : null;

    const { error } = await supabase.from("pecas").insert({
      tenant_id: user?.tenant_id,
      cliente_id: cliente.id,
      codigo_interno: codigo,
      tipo: tipo[0],
      cor: cor[0],
      marca: marca || null,
      composicao: compObj,
    });

    if (error) {
      toast.error("Erro ao cadastrar peça.");
    } else {
      toast.success("Peça cadastrada com sucesso!");
      navigate("/pecas");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nova Peça"
        subtitle={step === "cliente" ? "Selecione o cliente" : "Detalhes da peça"}
        actions={
          <button onClick={() => (step === "detalhes" ? setStep("cliente") : navigate(-1))} className="p-2 text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      {step === "cliente" && (
        <div className="px-4 space-y-4">
          <ClienteSearch
            onSelect={(c) => {
              setCliente(c);
              setStep("detalhes");
            }}
            onNotFound={() => navigate("/clientes/novo")}
          />
        </div>
      )}

      {step === "detalhes" && (
        <div className="px-4 space-y-5 pb-8">
          {cliente && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="font-medium text-foreground">{cliente.nome}</p>
              <p className="text-xs text-muted-foreground">CPF: {cliente.cpf}</p>
            </div>
          )}

          <PillSelector label="Tipo de peça *" options={tipoOptions} selected={tipo} onToggle={(v) => handleToggle(setTipo, v)} />
          <PillSelector label="Cor *" options={corOptions} selected={cor} onToggle={(v) => handleToggle(setCor, v)} />
          <PillSelector label="Composição" options={composicaoOptions} selected={composicao} onToggle={(v) => handleToggleMulti(setComposicao, v)} multiple />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Marca</label>
            <Input placeholder="Ex: Zara, Hugo Boss..." value={marca} onChange={(e) => setMarca(e.target.value)} />
          </div>

          <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur">
            <Button onClick={handleSave} className="w-full h-12 text-base font-semibold" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cadastrar Peça"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
