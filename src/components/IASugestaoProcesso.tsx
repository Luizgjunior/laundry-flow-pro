import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, X, Scan } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Props {
  peca: any;
  diagnosticos: any[];
  maquinas: any[];
  produtos: any[];
  onAplicarSugestao: (sugestao: any) => void;
}

export function IASugestaoProcesso({ peca, diagnosticos, maquinas, produtos, onAplicarSugestao }: Props) {
  const [loading, setLoading] = useState(false);
  const [sugestao, setSugestao] = useState<any>(null);
  const [lendoEtiqueta, setLendoEtiqueta] = useState(false);
  const [etiquetaInfo, setEtiquetaInfo] = useState<any>(null);

  const buscarSugestao = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ia-sugestao-processo", {
        body: {
          tenant_id: peca.tenant_id,
          peca,
          diagnosticos,
          maquinas,
          produtos,
          etiqueta_texto: etiquetaInfo ? JSON.stringify(etiquetaInfo) : null,
        },
      });

      if (error) throw error;

      if (data.success && data.sugestao && !data.sugestao.erro) {
        setSugestao(data.sugestao);
        toast.success("Sugestão gerada com sucesso!");
      } else {
        throw new Error(data?.sugestao?.erro || "Não foi possível gerar sugestão");
      }
    } catch (error: any) {
      toast.error("Erro ao gerar sugestão: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const lerEtiqueta = async (imagemBase64: string) => {
    setLendoEtiqueta(true);
    try {
      const { data, error } = await supabase.functions.invoke("ia-ler-etiqueta", {
        body: { imagem_base64: imagemBase64 },
      });

      if (error) throw error;

      if (data.success && data.etiqueta) {
        setEtiquetaInfo(data.etiqueta);
        toast.success("Etiqueta lida com sucesso!");
      }
    } catch (error: any) {
      toast.error("Erro ao ler etiqueta: " + error.message);
    } finally {
      setLendoEtiqueta(false);
    }
  };

  const handleCapturarEtiqueta = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      lerEtiqueta(base64);
    };
    reader.readAsDataURL(file);
  };

  const aplicarSugestao = () => {
    if (sugestao) {
      onAplicarSugestao(sugestao);
      toast.success("Sugestão aplicada! Revise e ajuste se necessário.");
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Assistente IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão para ler etiqueta */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={lendoEtiqueta}
            onClick={() => document.getElementById("etiqueta-input")?.click()}
          >
            {lendoEtiqueta ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Lendo...</>
            ) : (
              <><Scan className="h-4 w-4 mr-2" /> Ler Etiqueta</>
            )}
          </Button>
          <input
            id="etiqueta-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCapturarEtiqueta}
          />
        </div>

        {/* Info da etiqueta lida */}
        {etiquetaInfo && (
          <div className="p-3 bg-background rounded-lg text-sm space-y-1">
            <p className="font-medium">✅ Etiqueta detectada:</p>
            {etiquetaInfo.composicao && (
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground text-xs">Composição:</span>
                {typeof etiquetaInfo.composicao === "string" ? (
                  <p>{etiquetaInfo.composicao}</p>
                ) : (
                  Object.entries(etiquetaInfo.composicao).map(([parte, materiais]: [string, any]) => (
                    <p key={parte} className="capitalize">
                      {parte}: {Array.isArray(materiais)
                        ? materiais.map((m: any) => {
                            const nome = m.material || m.componente || m.nome || "?";
                            const pct = m.percentagem ?? m.porcentagem ?? m.percent ?? "";
                            return `${nome} ${pct}%`;
                          }).join(", ")
                        : String(materiais)}
                    </p>
                  ))
                )}
              </div>
            )}
            {etiquetaInfo.instrucoes_lavagem && (
              <p className="text-muted-foreground">
                Temp. máx: {etiquetaInfo.instrucoes_lavagem.temperatura_maxima || "N/A"}
              </p>
            )}
            {etiquetaInfo.simbolos_identificados?.length > 0 && (
              <p className="text-muted-foreground text-xs">
                Símbolos: {etiquetaInfo.simbolos_identificados.join(", ")}
              </p>
            )}
            {etiquetaInfo.pais_origem && (
              <p className="text-muted-foreground text-xs">Origem: {etiquetaInfo.pais_origem}</p>
            )}
          </div>
        )}

        {/* Botão para gerar sugestão */}
        <Button
          onClick={buscarSugestao}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Gerar Sugestão de Processo</>
          )}
        </Button>

        {diagnosticos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Sem diagnóstico cadastrado, a sugestão pode ficar menos precisa.
          </p>
        )}

        {/* Exibir sugestão */}
        {sugestao && !sugestao.erro && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sugestão da IA:</span>
              <Badge className={
                sugestao.risco === "alto" ? "bg-red-100 text-red-700" :
                sugestao.risco === "medio" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
              }>
                Risco {sugestao.risco?.toUpperCase()}
              </Badge>
            </div>

            {sugestao.justificativa_risco && (
              <p className="text-xs text-muted-foreground">{sugestao.justificativa_risco}</p>
            )}

            <div className="space-y-2">
              {sugestao.etapas?.map((etapa: any, i: number) => (
                <div key={i} className="p-2 bg-background rounded text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {i + 1}. {etapa.tipo?.replace("_", " ").toUpperCase()}
                    </Badge>
                    {etapa.duracao_minutos && (
                      <span className="text-muted-foreground">{etapa.duracao_minutos} min</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{etapa.descricao}</p>
                  {etapa.maquina_sugerida && (
                    <p className="text-muted-foreground">Máquina: {etapa.maquina_sugerida}</p>
                  )}
                  {etapa.produtos?.length > 0 && (
                    <p className="text-muted-foreground">
                      Produtos: {etapa.produtos.map((p: any) => p.nome).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {sugestao.valor_sugerido && (
              <p className="text-sm">
                <strong>Valor sugerido:</strong> R$ {sugestao.valor_sugerido.toFixed(2)}
              </p>
            )}

            {sugestao.tempo_total_estimado && (
              <p className="text-sm">
                <strong>Tempo estimado:</strong> {sugestao.tempo_total_estimado} minutos
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={aplicarSugestao} size="sm" className="flex-1">
                <Check className="h-4 w-4 mr-1" /> Aplicar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSugestao(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
