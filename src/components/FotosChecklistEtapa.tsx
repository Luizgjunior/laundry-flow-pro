import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaCapture } from "./MediaCapture";
import { Camera, CheckCircle, Circle, AlertTriangle } from "lucide-react";

interface FotoRequerida {
  tipo: string;
  label: string;
  descricao: string;
  obrigatoria: boolean;
}

const FOTOS_POR_ETAPA: Record<string, FotoRequerida[]> = {
  pre_tratamento: [
    { tipo: "material", label: "Produto químico", descricao: "Foto do produto a ser usado", obrigatoria: true },
    { tipo: "dosagem", label: "Dosagem", descricao: "Foto da medição/dosagem", obrigatoria: false },
    { tipo: "aplicacao", label: "Aplicação", descricao: "Foto durante aplicação", obrigatoria: true },
  ],
  lavadoria: [
    { tipo: "maquina", label: "Máquina", descricao: "Foto da máquina selecionada", obrigatoria: true },
    { tipo: "programacao", label: "Programação", descricao: "Foto do painel/configuração", obrigatoria: true },
    { tipo: "produtos", label: "Produtos", descricao: "Foto dos produtos utilizados", obrigatoria: true },
    { tipo: "carregamento", label: "Carregamento", descricao: "Foto da peça na máquina", obrigatoria: false },
  ],
  secagem: [
    { tipo: "maquina", label: "Secadora", descricao: "Foto da secadora", obrigatoria: true },
    { tipo: "temperatura", label: "Temperatura", descricao: "Foto do painel de temperatura", obrigatoria: false },
  ],
  controle_qualidade: [
    { tipo: "resultado_frente", label: "Resultado Frente", descricao: "Foto da peça finalizada - frente", obrigatoria: true },
    { tipo: "resultado_verso", label: "Resultado Verso", descricao: "Foto da peça finalizada - verso", obrigatoria: true },
    { tipo: "detalhe", label: "Detalhes", descricao: "Foto de detalhes relevantes", obrigatoria: false },
  ],
};

interface Props {
  pecaId: string;
  etapa: string;
  fotosCapturadas: Record<string, string>;
  onFotoCapturada: (tipo: string, url: string) => void;
  onValidacaoChange: (valido: boolean) => void;
}

export function FotosChecklistEtapa({
  pecaId,
  etapa,
  fotosCapturadas,
  onFotoCapturada,
  onValidacaoChange,
}: Props) {
  const fotos = FOTOS_POR_ETAPA[etapa] || [];

  useEffect(() => {
    const obrigatorias = fotos.filter((f) => f.obrigatoria);
    const todasCapturadas = obrigatorias.every((f) => fotosCapturadas[f.tipo]);
    onValidacaoChange(todasCapturadas);
  }, [fotosCapturadas]);

  const fotosObrigatoriasFaltando = fotos
    .filter((f) => f.obrigatoria && !fotosCapturadas[f.tipo])
    .length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Documentação Visual
          </CardTitle>
          {fotosObrigatoriasFaltando > 0 ? (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {fotosObrigatoriasFaltando} pendente(s)
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fotos.map((foto) => (
          <div
            key={foto.tipo}
            className={`p-3 rounded-lg border ${
              foto.obrigatoria && !fotosCapturadas[foto.tipo]
                ? "border-amber-300 bg-amber-50"
                : fotosCapturadas[foto.tipo]
                ? "border-green-300 bg-green-50"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {fotosCapturadas[foto.tipo] ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">{foto.label}</span>
                {foto.obrigatoria && (
                  <Badge variant="outline" className="text-xs">
                    Obrigatória
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2">{foto.descricao}</p>

            {fotosCapturadas[foto.tipo] ? (
              <div className="relative">
                <img
                  src={fotosCapturadas[foto.tipo]}
                  alt={foto.label}
                  className="w-full h-32 object-cover rounded"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => onFotoCapturada(foto.tipo, "")}
                >
                  Refazer
                </Button>
              </div>
            ) : (
              <MediaCapture
                pecaId={pecaId}
                etapa={etapa}
                tipo={foto.tipo}
                required={foto.obrigatoria}
                onCapture={(url) => onFotoCapturada(foto.tipo, url)}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
