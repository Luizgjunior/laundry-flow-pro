import { X, Plus, Camera } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  tipo: string;
}

interface PhotoGridProps {
  photos: Photo[];
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  maxPhotos?: number;
}

export function PhotoGrid({ photos, onDelete, onAdd, maxPhotos = 8 }: PhotoGridProps) {
  const tipoLabels: Record<string, string> = {
    entrada_frente: "Frente",
    entrada_costas: "Costas",
    avaria: "Avaria",
    processo: "Processo",
    saida: "Saída",
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((photo) => (
        <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
          <img src={photo.url} alt={photo.tipo} className="h-full w-full object-cover" />
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {tipoLabels[photo.tipo] || photo.tipo}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(photo.id)}
              className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white active:scale-90 transition-transform"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {onAdd && photos.length < maxPhotos && (
        <button
          onClick={onAdd}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground active:scale-95 transition-transform"
        >
          <Camera className="h-5 w-5" />
          <span className="text-xs font-medium">Adicionar</span>
        </button>
      )}
    </div>
  );
}
