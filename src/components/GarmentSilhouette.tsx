import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface GarmentSilhouetteProps {
  tipo?: string;
  lado?: "frente" | "verso";
  onLadoChange?: (lado: "frente" | "verso") => void;
  diagnosticos?: { localizacao: string; cor: string }[];
  onAreaClick?: (localizacao: string) => void;
  interactive?: boolean;
}

type AreaDef = { x: number; y: number; w: number; h: number; label: string };

interface GarmentConfig {
  viewBox: string;
  path: string;
  frenteAreas: Record<string, AreaDef>;
  versoAreas: Record<string, AreaDef>;
  versoLabel?: { x: number; y: number; w: number; h: number; textY: number };
}

// ─── Camisa / Blusa ───
const camisaConfig: GarmentConfig = {
  viewBox: "0 0 200 190",
  path: "M100 5 C85 5 75 15 70 30 L45 35 Q0 45 5 80 L15 115 Q20 120 30 115 L45 100 L45 165 Q45 185 65 185 L135 185 Q155 185 155 165 L155 100 L170 115 Q180 120 185 115 L195 80 Q200 45 155 35 L130 30 C125 15 115 5 100 5Z",
  frenteAreas: {
    gola: { x: 70, y: 5, w: 60, h: 25, label: "Gola" },
    frente_superior: { x: 50, y: 35, w: 100, h: 60, label: "Frente Sup." },
    frente_inferior: { x: 50, y: 100, w: 100, h: 60, label: "Frente Inf." },
    manga_esquerda: { x: 0, y: 35, w: 45, h: 80, label: "Manga E" },
    manga_direita: { x: 155, y: 35, w: 45, h: 80, label: "Manga D" },
    punho: { x: 55, y: 165, w: 90, h: 20, label: "Punho" },
  },
  versoAreas: {
    gola: { x: 70, y: 5, w: 60, h: 25, label: "Gola" },
    costas_superior: { x: 50, y: 35, w: 100, h: 60, label: "Costas Sup." },
    costas_inferior: { x: 50, y: 100, w: 100, h: 60, label: "Costas Inf." },
    manga_esquerda: { x: 0, y: 35, w: 45, h: 80, label: "Manga E" },
    manga_direita: { x: 155, y: 35, w: 45, h: 80, label: "Manga D" },
    etiqueta: { x: 75, y: 165, w: 50, h: 20, label: "Etiqueta" },
  },
  versoLabel: { x: 75, y: 155, w: 50, h: 18, textY: 167 },
};

// ─── Calça ───
const calcaConfig: GarmentConfig = {
  viewBox: "0 0 160 260",
  path: "M45 5 Q40 5 38 10 L35 30 L30 80 L28 130 L20 200 Q18 240 35 245 L65 250 Q72 250 73 240 L80 130 L87 240 Q88 250 95 250 L125 245 Q142 240 140 200 L132 130 L130 80 L125 30 L122 10 Q120 5 115 5 Z",
  frenteAreas: {
    cintura: { x: 35, y: 5, w: 90, h: 30, label: "Cintura" },
    frente_superior: { x: 30, y: 40, w: 100, h: 50, label: "Frente Sup." },
    virilha: { x: 50, y: 95, w: 60, h: 35, label: "Virilha" },
    perna_esquerda: { x: 18, y: 135, w: 55, h: 80, label: "Perna E" },
    perna_direita: { x: 87, y: 135, w: 55, h: 80, label: "Perna D" },
    barra_esquerda: { x: 18, y: 220, w: 55, h: 30, label: "Barra E" },
    barra_direita: { x: 87, y: 220, w: 55, h: 30, label: "Barra D" },
  },
  versoAreas: {
    cintura: { x: 35, y: 5, w: 90, h: 30, label: "Cintura" },
    costas_superior: { x: 30, y: 40, w: 100, h: 50, label: "Costas Sup." },
    virilha: { x: 50, y: 95, w: 60, h: 35, label: "Virilha" },
    perna_esquerda: { x: 18, y: 135, w: 55, h: 80, label: "Perna E" },
    perna_direita: { x: 87, y: 135, w: 55, h: 80, label: "Perna D" },
    etiqueta: { x: 55, y: 8, w: 50, h: 18, label: "Etiqueta" },
  },
  versoLabel: { x: 55, y: 8, w: 50, h: 18, textY: 20 },
};

// ─── Vestido ───
const vestidoConfig: GarmentConfig = {
  viewBox: "0 0 200 280",
  path: "M100 5 C85 5 75 15 70 28 L50 35 Q15 45 20 75 L30 100 L35 95 L40 100 L30 180 Q25 260 55 265 L145 265 Q175 260 170 180 L160 100 L165 95 L170 100 L180 75 Q185 45 150 35 L130 28 C125 15 115 5 100 5Z",
  frenteAreas: {
    gola: { x: 70, y: 5, w: 60, h: 25, label: "Gola" },
    busto: { x: 45, y: 35, w: 110, h: 55, label: "Busto" },
    cintura: { x: 40, y: 95, w: 120, h: 30, label: "Cintura" },
    saia_superior: { x: 30, y: 130, w: 140, h: 60, label: "Saia Sup." },
    saia_inferior: { x: 25, y: 195, w: 150, h: 50, label: "Saia Inf." },
    barra: { x: 30, y: 248, w: 140, h: 18, label: "Barra" },
    manga_esquerda: { x: 10, y: 35, w: 35, h: 60, label: "Manga E" },
    manga_direita: { x: 155, y: 35, w: 35, h: 60, label: "Manga D" },
  },
  versoAreas: {
    gola: { x: 70, y: 5, w: 60, h: 25, label: "Gola" },
    costas: { x: 45, y: 35, w: 110, h: 55, label: "Costas" },
    cintura: { x: 40, y: 95, w: 120, h: 30, label: "Cintura" },
    saia_superior: { x: 30, y: 130, w: 140, h: 60, label: "Saia Sup." },
    saia_inferior: { x: 25, y: 195, w: 150, h: 50, label: "Saia Inf." },
    etiqueta: { x: 75, y: 8, w: 50, h: 18, label: "Etiqueta" },
    manga_esquerda: { x: 10, y: 35, w: 35, h: 60, label: "Manga E" },
    manga_direita: { x: 155, y: 35, w: 35, h: 60, label: "Manga D" },
  },
  versoLabel: { x: 75, y: 8, w: 50, h: 18, textY: 20 },
};

// ─── Saia ───
const saiaConfig: GarmentConfig = {
  viewBox: "0 0 180 180",
  path: "M40 10 Q38 5 45 5 L135 5 Q142 5 140 10 L135 30 L145 130 Q150 165 130 170 L50 170 Q30 165 35 130 L45 30 Z",
  frenteAreas: {
    cintura: { x: 40, y: 5, w: 100, h: 25, label: "Cintura" },
    frente_superior: { x: 35, y: 35, w: 110, h: 55, label: "Frente Sup." },
    frente_inferior: { x: 30, y: 95, w: 120, h: 50, label: "Frente Inf." },
    barra: { x: 30, y: 148, w: 120, h: 22, label: "Barra" },
  },
  versoAreas: {
    cintura: { x: 40, y: 5, w: 100, h: 25, label: "Cintura" },
    costas_superior: { x: 35, y: 35, w: 110, h: 55, label: "Costas Sup." },
    costas_inferior: { x: 30, y: 95, w: 120, h: 50, label: "Costas Inf." },
    etiqueta: { x: 65, y: 8, w: 50, h: 18, label: "Etiqueta" },
  },
  versoLabel: { x: 65, y: 8, w: 50, h: 18, textY: 20 },
};

// ─── Jaqueta / Casaco / Blazer ───
const jaquetaConfig: GarmentConfig = {
  viewBox: "0 0 220 200",
  path: "M110 5 C95 5 82 15 78 30 L48 38 Q0 50 5 90 L18 130 Q22 136 32 130 L48 115 L48 175 Q48 195 70 195 L150 195 Q172 195 172 175 L172 115 L188 130 Q198 136 202 130 L215 90 Q220 50 172 38 L142 30 C138 15 125 5 110 5Z",
  frenteAreas: {
    gola: { x: 78, y: 2, w: 64, h: 28, label: "Gola" },
    lapela_esquerda: { x: 52, y: 32, w: 40, h: 50, label: "Lapela E" },
    lapela_direita: { x: 128, y: 32, w: 40, h: 50, label: "Lapela D" },
    frente_superior: { x: 52, y: 40, w: 116, h: 55, label: "Frente Sup." },
    frente_inferior: { x: 52, y: 100, w: 116, h: 60, label: "Frente Inf." },
    manga_esquerda: { x: 0, y: 40, w: 48, h: 85, label: "Manga E" },
    manga_direita: { x: 172, y: 40, w: 48, h: 85, label: "Manga D" },
    bolso_esquerdo: { x: 55, y: 110, w: 45, h: 30, label: "Bolso E" },
    bolso_direito: { x: 120, y: 110, w: 45, h: 30, label: "Bolso D" },
  },
  versoAreas: {
    gola: { x: 78, y: 2, w: 64, h: 28, label: "Gola" },
    costas_superior: { x: 52, y: 40, w: 116, h: 55, label: "Costas Sup." },
    costas_inferior: { x: 52, y: 100, w: 116, h: 60, label: "Costas Inf." },
    manga_esquerda: { x: 0, y: 40, w: 48, h: 85, label: "Manga E" },
    manga_direita: { x: 172, y: 40, w: 48, h: 85, label: "Manga D" },
    etiqueta: { x: 85, y: 170, w: 50, h: 18, label: "Etiqueta" },
  },
  versoLabel: { x: 85, y: 170, w: 50, h: 18, textY: 182 },
};

// ─── Bermuda / Shorts ───
const bermudaConfig: GarmentConfig = {
  viewBox: "0 0 160 160",
  path: "M45 5 Q40 5 38 10 L35 30 L30 60 L28 90 Q25 130 40 135 L65 140 Q72 140 75 130 L80 90 L85 130 Q88 140 95 140 L120 135 Q135 130 132 90 L130 60 L125 30 L122 10 Q120 5 115 5 Z",
  frenteAreas: {
    cintura: { x: 35, y: 5, w: 90, h: 25, label: "Cintura" },
    frente: { x: 30, y: 35, w: 100, h: 50, label: "Frente" },
    perna_esquerda: { x: 25, y: 90, w: 50, h: 45, label: "Perna E" },
    perna_direita: { x: 85, y: 90, w: 50, h: 45, label: "Perna D" },
  },
  versoAreas: {
    cintura: { x: 35, y: 5, w: 90, h: 25, label: "Cintura" },
    costas: { x: 30, y: 35, w: 100, h: 50, label: "Costas" },
    perna_esquerda: { x: 25, y: 90, w: 50, h: 45, label: "Perna E" },
    perna_direita: { x: 85, y: 90, w: 50, h: 45, label: "Perna D" },
    etiqueta: { x: 55, y: 8, w: 50, h: 18, label: "Etiqueta" },
  },
  versoLabel: { x: 55, y: 8, w: 50, h: 18, textY: 20 },
};

// ─── Camiseta (T-Shirt, sem gola alta, mangas curtas) ───
const camisetaConfig: GarmentConfig = {
  viewBox: "0 0 200 190",
  path: "M100 8 C88 8 80 14 76 25 L52 32 Q20 42 25 68 L32 85 Q35 88 42 85 L52 78 L52 168 Q52 185 70 185 L130 185 Q148 185 148 168 L148 78 L158 85 Q165 88 168 85 L175 68 Q180 42 148 32 L124 25 C120 14 112 8 100 8Z",
  frenteAreas: {
    gola: { x: 75, y: 5, w: 50, h: 22, label: "Gola" },
    frente_superior: { x: 55, y: 32, w: 90, h: 55, label: "Frente Sup." },
    frente_inferior: { x: 55, y: 92, w: 90, h: 60, label: "Frente Inf." },
    manga_esquerda: { x: 18, y: 32, w: 35, h: 50, label: "Manga E" },
    manga_direita: { x: 147, y: 32, w: 35, h: 50, label: "Manga D" },
    barra: { x: 55, y: 158, w: 90, h: 22, label: "Barra" },
  },
  versoAreas: {
    gola: { x: 75, y: 5, w: 50, h: 22, label: "Gola" },
    costas_superior: { x: 55, y: 32, w: 90, h: 55, label: "Costas Sup." },
    costas_inferior: { x: 55, y: 92, w: 90, h: 60, label: "Costas Inf." },
    manga_esquerda: { x: 18, y: 32, w: 35, h: 50, label: "Manga E" },
    manga_direita: { x: 147, y: 32, w: 35, h: 50, label: "Manga D" },
    etiqueta: { x: 75, y: 158, w: 50, h: 18, label: "Etiqueta" },
  },
  versoLabel: { x: 75, y: 158, w: 50, h: 18, textY: 170 },
};

// Map tipo string → config
function getGarmentConfig(tipo?: string): GarmentConfig {
  const t = (tipo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (/cal[cç]a|pants|trouser/i.test(t)) return calcaConfig;
  if (/vestido|dress/i.test(t)) return vestidoConfig;
  if (/saia|skirt/i.test(t)) return saiaConfig;
  if (/jaqueta|casaco|blazer|terno|palet[oó]|coat|jacket/i.test(t)) return jaquetaConfig;
  if (/bermuda|short/i.test(t)) return bermudaConfig;
  if (/camiseta|t-?shirt|regata|polo/i.test(t)) return camisetaConfig;
  // Default: camisa/blusa
  return camisaConfig;
}

/** Returns localizações list for a given tipo + lado (used by Triagem) */
export function getLocalizacoes(tipo?: string, lado?: "frente" | "verso") {
  const config = getGarmentConfig(tipo);
  const areas = lado === "verso" ? config.versoAreas : config.frenteAreas;
  return Object.keys(areas);
}

/** Returns label map for all areas of a given tipo */
export function getLocLabels(tipo?: string): Record<string, string> {
  const config = getGarmentConfig(tipo);
  const labels: Record<string, string> = {};
  for (const [k, v] of Object.entries(config.frenteAreas)) labels[k] = v.label;
  for (const [k, v] of Object.entries(config.versoAreas)) labels[k] = v.label;
  return labels;
}

export function GarmentSilhouette({ tipo, lado = "frente", onLadoChange, diagnosticos = [], onAreaClick }: GarmentSilhouetteProps) {
  const config = getGarmentConfig(tipo);
  const currentAreas = lado === "frente" ? config.frenteAreas : config.versoAreas;

  const diagByLoc = diagnosticos.reduce<Record<string, string[]>>((acc, d) => {
    if (!acc[d.localizacao]) acc[d.localizacao] = [];
    acc[d.localizacao].push(d.cor);
    return acc;
  }, {});

  return (
    <div className="relative flex flex-col items-center">
      {onLadoChange && (
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
            {lado === "frente" ? "FRENTE" : "VERSO"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLadoChange(lado === "frente" ? "verso" : "frente")}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            {lado === "frente" ? "Ver Verso" : "Ver Frente"}
          </Button>
        </div>
      )}

      <svg viewBox={config.viewBox} className="w-56 h-auto">
        {/* Base silhouette */}
        <path
          d={config.path}
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
          className="opacity-60"
        />

        {/* Verso etiqueta label */}
        {lado === "verso" && config.versoLabel && (
          <>
            <rect
              x={config.versoLabel.x} y={config.versoLabel.y}
              width={config.versoLabel.w} height={config.versoLabel.h}
              rx="3" fill="hsl(var(--muted-foreground))" opacity="0.15"
              stroke="hsl(var(--border))" strokeWidth="0.5"
            />
            <text
              x={config.versoLabel.x + config.versoLabel.w / 2}
              y={config.versoLabel.textY}
              textAnchor="middle" className="fill-muted-foreground text-[6px]"
            >ETIQUETA</text>
          </>
        )}

        {/* Clickable areas */}
        {Object.entries(currentAreas).map(([key, area]) => {
          const hasDiag = diagByLoc[key];
          return (
            <g key={key} onClick={() => onAreaClick?.(key)} className="cursor-pointer">
              <rect
                x={area.x} y={area.y} width={area.w} height={area.h}
                rx="4"
                fill={hasDiag ? hasDiag[0] + "40" : "transparent"}
                stroke={hasDiag ? hasDiag[0] : "hsl(var(--border))"}
                strokeWidth={hasDiag ? "2" : "1"}
                strokeDasharray={hasDiag ? "none" : "4 2"}
                className="hover:fill-primary/10 transition-colors"
              />
              {hasDiag && hasDiag.map((cor, i) => (
                <circle
                  key={i}
                  cx={area.x + area.w / 2 + (i - (hasDiag.length - 1) / 2) * 12}
                  cy={area.y + area.h / 2}
                  r="5"
                  fill={cor}
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}
              <text
                x={area.x + area.w / 2}
                y={area.y + area.h + 10}
                textAnchor="middle"
                className="fill-muted-foreground text-[7px]"
              >{area.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
