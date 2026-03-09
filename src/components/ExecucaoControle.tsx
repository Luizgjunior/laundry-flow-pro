import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pause, Play, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Props {
  execucaoId: string;
  status: string;
  onStatusChange: (novoStatus: string) => void;
}

export function ExecucaoControle({ execucaoId, status, onStatusChange }: Props) {
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [motivoPausa, setMotivoPausa] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePausar = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("execucoes")
      .update({
        status: "pausado",
        pausado_em: new Date().toISOString(),
        motivo_pausa: motivoPausa,
      })
      .eq("id", execucaoId);

    if (!error) {
      toast.info("Processo pausado");
      onStatusChange("pausado");
    }
    setShowPauseDialog(false);
    setLoading(false);
  };

  const handleContinuar = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("execucoes")
      .update({
        status: "em_andamento",
        pausado_em: null,
        motivo_pausa: null,
      })
      .eq("id", execucaoId);

    if (!error) {
      toast.success("Processo retomado");
      onStatusChange("em_andamento");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="flex gap-2">
        {status === "em_andamento" && (
          <Button variant="outline" onClick={() => setShowPauseDialog(true)} className="flex-1">
            <Pause className="h-4 w-4 mr-2" /> Interromper
          </Button>
        )}

        {status === "pausado" && (
          <Button onClick={handleContinuar} disabled={loading} className="flex-1">
            <Play className="h-4 w-4 mr-2" /> Continuar
          </Button>
        )}
      </div>

      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interromper Processo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Motivo da interrupção (opcional)"
              value={motivoPausa}
              onChange={(e) => setMotivoPausa(e.target.value)}
              rows={3}
            />
            <Button onClick={handlePausar} disabled={loading} className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" /> Confirmar Interrupção
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
