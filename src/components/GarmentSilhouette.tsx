import { useState } from "react";
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

const areas: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  gola: { x: 70, y: 5, w: 60, h: 25, label: "Gola" },
  frente_superior: { x: 50, y: 35, w: 100, h: 60, label: "Frente Sup." },
  frente_inferior: { x: 50, y: 100, w: 100, h: 60, label: "Frente Inf." },
  manga_esquerda: { x: 0, y: 35, w: 45, h: 80, label: "Manga E" },
  manga_direita: { x: 155, y: 35, w: 45, h: 80, label: "Manga D" },
  punho: { x: 55, y: 165, w: 90, h: 20, label: "Punho" },
};

const areasVerso: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  costas_superior: { x: 50, y: 35, w: 100, h: 60, label: "Costas Sup." },
  costas_inferior: { x: 50, y: 100, w: 100, h: 60, label: "Costas Inf." },
  manga_esquerda: { x: 0, y: 35, w: 45, h: 80, label: "Manga E" },
  manga_direita: { x: 155, y: 35, w: 45, h: 80, label: "Manga D" },
  gola: { x: 70, y: 5, w: 60, h: 25, label: "Gola" },
  etiqueta: { x: 75, y: 165, w: 50, h: 20, label: "Etiqueta" },
};

export function GarmentSilhouette({ tipo, lado = "frente", onLadoChange, diagnosticos = [], onAreaClick, interactive }: GarmentSilhouetteProps) {
  const currentAreas = lado === "frente" ? areas : areasVerso;

  const diagByLoc = diagnosticos.reduce<Record<string, string[]>>((acc, d) => {
    if (!acc[d.localizacao]) acc[d.localizacao] = [];
    acc[d.localizacao].push(d.cor);
    return acc;
  }, {});

  return (
    <div className="relative flex flex-col items-center">
      {/* Toggle frente/verso */}
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

      <svg viewBox="0 0 200 190" className="w-56 h-auto">
        {/* Base silhouette */}
        <path
          d="M100 5 C85 5 75 15 70 30 L45 35 Q0 45 5 80 L15 115 Q20 120 30 115 L45 100 L45 165 Q45 185 65 185 L135 185 Q155 185 155 165 L155 100 L170 115 Q180 120 185 115 L195 80 Q200 45 155 35 L130 30 C125 15 115 5 100 5Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
          className="opacity-60"
        />

        {/* Verso label on back */}
        {lado === "verso" && (
          <>
            <rect x="75" y="155" width="50" height="18" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.15" stroke="hsl(var(--border))" strokeWidth="0.5" />
            <text x="100" y="167" textAnchor="middle" className="fill-muted-foreground text-[6px]">ETIQUETA</text>
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
