import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { ClienteSearch } from "@/components/ClienteSearch";
import { InlineClienteForm } from "@/components/InlineClienteForm";
import { PillSelector } from "@/components/PillSelector";
import { CameraCapture } from "@/components/CameraCapture";
import { PhotoGrid } from "@/components/PhotoGrid";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Camera, Printer, Plus, Eye } from "lucide-react";
import type { Cliente } from "@/types/database";
import { useSubscription } from "@/hooks/useSubscription";

type Step = "cliente" | "detalhes" | "fotos" | "confirmacao";
type ClienteMode = "search" | "create";

const tipoOptions = [
  { value: "camisa", label: "Camisa" }, { value: "camiseta", label: "Camiseta" },
  { value: "calca", label: "Calça" }, { value: "vestido", label: "Vestido" },
  { value: "saia", label: "Saia" }, { value: "blazer", label: "Blazer" },
  { value: "terno", label: "Terno" }, { value: "jaqueta", label: "Jaqueta" },
  { value: "casaco", label: "Casaco" }, { value: "sobretudo", label: "Sobretudo" },
  { value: "edredom", label: "Edredom" }, { value: "cortina", label: "Cortina" },
  { value: "tapete", label: "Tapete" }, { value: "outro", label: "Outro" },
];

const corOptions = [
  { value: "branco", label: "Branco", color: "#FFFFFF" },
  { value: "preto", label: "Preto", color: "#1a1a1a" },
  { value: "azul", label: "Azul", color: "#2563EB" },
  { value: "vermelho", label: "Vermelho", color: "#DC2626" },
  { value: "verde", label: "Verde", color: "#16A34A" },
  { value: "amarelo", label: "Amarelo", color: "#EAB308" },
  { value: "rosa", label: "Rosa", color: "#EC4899" },
  { value: "roxo", label: "Roxo", color: "#9333EA" },
  { value: "laranja", label: "Laranja", color: "#EA580C" },
  { value: "marrom", label: "Marrom", color: "#92400E" },
  { value: "cinza", label: "Cinza", color: "#9CA3AF" },
  { value: "bege", label: "Bege", color: "#D4B896" },
  { value: "estampado", label: "Estampado" },
  { value: "multicolor", label: "Multicolor" },
];

const composicaoOptions = [
  { value: "algodao", label: "Algodão" }, { value: "poliester", label: "Poliéster" },
  { value: "seda", label: "Seda" }, { value: "la", label: "Lã" },
  { value: "linho", label: "Linho" }, { value: "viscose", label: "Viscose" },
  { value: "elastano", label: "Elastano" }, { value: "nylon", label: "Nylon" },
  { value: "couro", label: "Couro" }, { value: "camurca", label: "Camurça" },
  { value: "sintetico", label: "Sintético" },
];

const marcaSugestoes = ["Zara", "H&M", "Renner", "C&A", "Farm", "Animale", "Le Lis", "Dudalina", "Aramis", "Hugo Boss", "Tommy", "Lacoste"];

interface LocalPhoto {
  id: string;
  url: string;
  tipo: string;
  blob: Blob;
}

export default function NovaPeca() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAtLimit, plano } = useSubscription();
  const [step, setStep] = useState<Step>("cliente");
  const [clienteMode, setClienteMode] = useState<ClienteMode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tipo, setTipo] = useState<string[]>([]);
  const [cor, setCor] = useState<string[]>([]);
  const [composicao, setComposicao] = useState<string[]>([]);
  const [marca, setMarca] = useState("");
  const [marcaOpen, setMarcaOpen] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraInstruction, setCameraInstruction] = useState("Foto da FRENTE");
  const [cameraFotoTipo, setCameraFotoTipo] = useState<string>("entrada_frente");

  // Confirmation
  const [createdCodigo, setCreatedCodigo] = useState("");
  const [createdId, setCreatedId] = useState("");

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [value]));
  };

  const handleToggleMulti = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const startPhotoFlow = () => {
    const hasFronte = photos.some((p) => p.tipo === "entrada_frente");
    const hasCostas = photos.some((p) => p.tipo === "entrada_costas");

    if (!hasFronte) {
      setCameraInstruction("Foto da FRENTE");
      setCameraFotoTipo("entrada_frente");
    } else if (!hasCostas) {
      setCameraInstruction("Foto das COSTAS");
      setCameraFotoTipo("entrada_costas");
    } else {
      setCameraInstruction("Foto de AVARIA");
      setCameraFotoTipo("avaria");
    }
    setShowCamera(true);
  };

  const handlePhotoCapture = (blob: Blob) => {
    const newPhoto: LocalPhoto = {
      id: crypto.randomUUID(),
      url: URL.createObjectURL(blob),
      tipo: cameraFotoTipo,
      blob,
    };
    setPhotos((prev) => [...prev, newPhoto]);
    setShowCamera(false);

    // Auto-advance to next required photo
    const hasFronte = photos.some((p) => p.tipo === "entrada_frente") || cameraFotoTipo === "entrada_frente";
    const hasCostas = photos.some((p) => p.tipo === "entrada_costas") || cameraFotoTipo === "entrada_costas";

    if (!hasFronte) {
      setTimeout(() => {
        setCameraInstruction("Foto da FRENTE");
        setCameraFotoTipo("entrada_frente");
        setShowCamera(true);
      }, 500);
    } else if (!hasCostas && cameraFotoTipo !== "entrada_costas") {
      setTimeout(() => {
        setCameraInstruction("Foto das COSTAS");
        setCameraFotoTipo("entrada_costas");
        setShowCamera(true);
      }, 500);
    }
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddAvaria = () => {
    setCameraInstruction("Foto de AVARIA");
    setCameraFotoTipo("avaria");
    setShowCamera(true);
  };

  const compressImage = async (blob: Blob, maxBytes = 800 * 1024): Promise<Blob> => {
    if (blob.size <= maxBytes) return blob;
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, Math.sqrt(maxBytes / blob.size));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.75 });
  };

  const handleSave = async () => {
    if (!cliente || tipo.length === 0 || cor.length === 0) {
      toast.error("Preencha tipo e cor da peça.");
      return;
    }

    if (isAtLimit("pecas_criadas")) {
      toast.error(`Limite de ${plano?.limite_pecas_mes} peças/mês atingido. Faça upgrade.`, {
        action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
      });
      return;
    }

    setSaving(true);
    const now = new Date();
    const codigo = `TT-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const compObj = composicao.length > 0
      ? Object.fromEntries(composicao.map((c) => [c, Math.floor(100 / composicao.length)]))
      : null;

    const { data: pecaData, error } = await supabase.from("pecas").insert({
      tenant_id: user?.tenant_id,
      cliente_id: cliente.id,
      codigo_interno: codigo,
      tipo: tipo[0],
      cor: cor[0],
      marca: marca || null,
      composicao: compObj,
      observacoes: observacoes || null,
    }).select().single();

    if (error || !pecaData) {
      toast.error("Erro ao cadastrar peça.");
      setSaving(false);
      return;
    }

    // Upload photos
    for (const photo of photos) {
      try {
        const compressed = await compressImage(photo.blob);
        const path = `${user?.tenant_id}/${pecaData.id}/${photo.tipo}_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage.from("pecas-fotos").upload(path, compressed, {
          contentType: "image/jpeg",
        });
        if (!uploadErr) {
          await supabase.from("fotos").insert({
            peca_id: pecaData.id,
            tipo: photo.tipo as "entrada_frente" | "entrada_costas" | "avaria" | "processo" | "saida",
            storage_path: path,
            tamanho_bytes: compressed.size,
            created_by: user?.id!,
          });
        }
      } catch {
        // Continue with other photos
      }
    }

    setCreatedCodigo(codigo);
    setCreatedId(pecaData.id);
    setStep("confirmacao");
    setSaving(false);
    toast.success("Peça cadastrada com sucesso!");
  };

  const goBack = () => {
    if (step === "detalhes") setStep("cliente");
    else if (step === "fotos") setStep("detalhes");
    else navigate(-1);
  };

  const stepLabels: Record<Step, string> = {
    cliente: "Selecione o cliente",
    detalhes: "Detalhes da peça",
    fotos: "Fotos obrigatórias",
    confirmacao: "Peça cadastrada!",
  };

  const hasFronte = photos.some((p) => p.tipo === "entrada_frente");
  const hasCostas = photos.some((p) => p.tipo === "entrada_costas");
  const canFinalize = hasFronte && hasCostas;

  const filteredMarcas = marca
    ? marcaSugestoes.filter((m) => m.toLowerCase().includes(marca.toLowerCase()))
    : marcaSugestoes;

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handlePhotoCapture}
        onCancel={() => setShowCamera(false)}
        instruction={cameraInstruction}
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nova Peça"
        subtitle={stepLabels[step]}
        actions={
          step !== "confirmacao" ? (
            <button onClick={goBack} className="p-2 text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      {/* Step indicators */}
      {step !== "confirmacao" && (
        <div className="flex gap-1 px-4">
          {(["cliente", "detalhes", "fotos"] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                s === step ? "bg-primary" : (["cliente", "detalhes", "fotos"].indexOf(step) > i ? "bg-primary/40" : "bg-border")
              }`}
            />
          ))}
        </div>
      )}

      {/* Step 1: Cliente */}
      {step === "cliente" && (
        <div className="px-4 space-y-4">
          {clienteMode === "search" ? (
            <>
              <ClienteSearch
                onSelect={(c) => { setCliente(c); setStep("detalhes"); }}
                onNotFound={() => { setClienteMode("create"); }}
              />
              <div className="text-center pt-2">
                <button
                  onClick={() => setClienteMode("create")}
                  className="text-sm font-semibold text-primary active:scale-95 transition-transform"
                >
                  + Cadastrar novo cliente
                </button>
              </div>
            </>
          ) : (
            <InlineClienteForm
              onCreated={(c) => { setCliente(c); setStep("detalhes"); }}
              onCancel={() => setClienteMode("search")}
              initialQuery={searchQuery}
            />
          )}
        </div>
      )}

      {/* Step 2: Detalhes */}
      {step === "detalhes" && (
        <div className="px-4 space-y-5 pb-28">
          {cliente && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="font-medium text-foreground">{cliente.nome}</p>
              <p className="text-xs text-muted-foreground">CPF: {cliente.cpf} • Tel: {cliente.telefone}</p>
            </div>
          )}

          <PillSelector label="Tipo de peça *" options={tipoOptions} selected={tipo} onToggle={(v) => handleToggle(setTipo, v)} />
          <PillSelector label="Cor principal *" options={corOptions} selected={cor} onToggle={(v) => handleToggle(setCor, v)} />
          <PillSelector label="Composição" options={composicaoOptions} selected={composicao} onToggle={(v) => handleToggleMulti(setComposicao, v)} multiple />

          {/* Marca with autocomplete */}
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-foreground">Marca</label>
            <Input
              placeholder="Ex: Zara, Hugo Boss..."
              value={marca}
              onChange={(e) => { setMarca(e.target.value); setMarcaOpen(true); }}
              onFocus={() => setMarcaOpen(true)}
              onBlur={() => setTimeout(() => setMarcaOpen(false), 200)}
            />
            {marcaOpen && marca && filteredMarcas.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-xl border border-border bg-card shadow-lg max-h-40 overflow-y-auto">
                {filteredMarcas.map((m) => (
                  <button
                    key={m}
                    onMouseDown={() => { setMarca(m); setMarcaOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                  >{m}</button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Observações</label>
            <Textarea
              placeholder="Botões faltando, zíper quebrado, manchas..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur">
            <Button onClick={() => setStep("fotos")} className="w-full h-12 text-base font-semibold" disabled={tipo.length === 0 || cor.length === 0}>
              <Camera className="h-5 w-5 mr-2" /> Continuar para Fotos
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Fotos */}
      {step === "fotos" && (
        <div className="px-4 space-y-4 pb-28">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm text-foreground">
              {!hasFronte ? "📸 Tire a foto da frente da peça" :
               !hasCostas ? "📸 Agora tire a foto das costas" :
               "✅ Fotos obrigatórias capturadas. Adicione avarias se necessário."}
            </p>
          </div>

          {photos.length > 0 && (
            <PhotoGrid photos={photos} onDelete={handleDeletePhoto} onAdd={handleAddAvaria} />
          )}

          {!hasFronte || !hasCostas ? (
            <Button onClick={startPhotoFlow} className="w-full h-12 text-base font-semibold">
              <Camera className="h-5 w-5 mr-2" /> {!hasFronte ? "Capturar Frente" : "Capturar Costas"}
            </Button>
          ) : (
            <Button onClick={handleAddAvaria} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Adicionar foto de avaria
            </Button>
          )}

          <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur">
            <Button onClick={handleSave} className="w-full h-12 text-base font-semibold" disabled={!canFinalize || saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Finalizar Entrada"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmação */}
      {step === "confirmacao" && (
        <div className="px-4 space-y-6 pb-8">
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="rounded-full bg-green-100 p-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-foreground">Peça Registrada!</p>
          </div>

          <QRCodeGenerator value={createdCodigo} size={180} />

          <div className="space-y-2">
            <Button onClick={() => window.print()} variant="outline" className="w-full">
              <Printer className="h-4 w-4 mr-2" /> Imprimir Etiqueta
            </Button>
            <Button onClick={() => { setStep("cliente"); setCliente(null); setTipo([]); setCor([]); setComposicao([]); setMarca(""); setObservacoes(""); setPhotos([]); }} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Nova Peça
            </Button>
            <Button onClick={() => navigate(`/pecas/${createdId}`)} variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" /> Ver Peça
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
