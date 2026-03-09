import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

const TIPOS_PECA = [
  "Camisa", "Calça", "Vestido", "Saia", "Blazer", "Terno",
  "Casaco", "Jaqueta", "Moletom", "Camiseta", "Bermuda",
  "Short", "Macacão", "Conjunto", "Roupa de Cama", "Cortina",
  "Tapete", "Estofado", "Bolsa", "Sapato", "Outro"
];

const CORES = [
  "Branco", "Preto", "Azul", "Vermelho", "Verde", "Amarelo",
  "Rosa", "Roxo", "Laranja", "Marrom", "Cinza", "Bege",
  "Multicolor", "Estampado"
];

export default function EditarPeca() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    tipo: "",
    cor: "",
    marca: "",
    composicao: "",
    valor_servico: "",
    previsao_entrega: "",
    observacoes: "",
    risco_calculado: "baixo",
  });

  useEffect(() => {
    loadPeca();
  }, [id]);

  const loadPeca = async () => {
    const { data, error } = await supabase
      .from("pecas")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast.error("Peça não encontrada");
      navigate("/pecas");
      return;
    }

    setFormData({
      tipo: data.tipo || "",
      cor: data.cor || "",
      marca: data.marca || "",
      composicao: data.composicao ? JSON.stringify(data.composicao) : "",
      valor_servico: data.valor_servico?.toString() || "",
      previsao_entrega: data.previsao_entrega?.split("T")[0] || "",
      observacoes: data.observacoes || "",
      risco_calculado: data.risco_calculado || "baixo",
    });
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let composicaoJson = null;
      if (formData.composicao) {
        try {
          composicaoJson = JSON.parse(formData.composicao);
        } catch {
          composicaoJson = { descricao: formData.composicao };
        }
      }

      const { error } = await supabase
        .from("pecas")
        .update({
          tipo: formData.tipo,
          cor: formData.cor,
          marca: formData.marca || null,
          composicao: composicaoJson,
          valor_servico: formData.valor_servico ? parseFloat(formData.valor_servico) : null,
          previsao_entrega: formData.previsao_entrega || null,
          observacoes: formData.observacoes || null,
          risco_calculado: formData.risco_calculado as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Peça atualizada com sucesso!");
      navigate(`/pecas/${id}`);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Editar Peça"
        subtitle="Atualize as informações da peça"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <div className="px-4 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Peça *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PECA.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cor *</Label>
                <Select
                  value={formData.cor}
                  onValueChange={(v) => setFormData({ ...formData, cor: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CORES.map(cor => (
                      <SelectItem key={cor} value={cor}>{cor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Marca</Label>
              <Input
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ex: Zara, Nike, Artesanal..."
              />
            </div>

            <div className="space-y-2">
              <Label>Composição</Label>
              <Input
                value={formData.composicao}
                onChange={(e) => setFormData({ ...formData, composicao: e.target.value })}
                placeholder="Ex: 100% algodão, 50% poliéster 50% viscose"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor do Serviço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_servico}
                  onChange={(e) => setFormData({ ...formData, valor_servico: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label>Previsão de Entrega</Label>
                <Input
                  type="date"
                  value={formData.previsao_entrega}
                  onChange={(e) => setFormData({ ...formData, previsao_entrega: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nível de Risco</Label>
              <Select
                value={formData.risco_calculado}
                onValueChange={(v) => setFormData({ ...formData, risco_calculado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre a peça..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
          )}
        </Button>
      </div>
    </div>
  );
}
