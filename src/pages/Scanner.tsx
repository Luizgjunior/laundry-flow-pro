import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Loader2, Keyboard, QrCode, Eye, Play, ClipboardCheck, Package } from "lucide-react";
import { toast } from "sonner";
import type { Peca } from "@/types/database";

export default function Scanner() {
  const navigate = useNavigate();
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [foundPeca, setFoundPeca] = useState<Peca | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    try {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      if (!containerRef.current) return;

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        false
      );

      scanner.render(
        (decodedText: string) => {
          handleScan(decodedText);
          scanner.pause();
        },
        () => {}
      );

      scannerRef.current = scanner;
      setScanning(true);
    } catch {
      toast.error("Erro ao iniciar câmera");
    }
  };

  const stopScanner = () => {
    try { scannerRef.current?.clear(); } catch {}
  };

  const handleScan = async (code: string) => {
    setSearching(true);
    const { data } = await supabase
      .from("pecas")
      .select("*, clientes(nome)")
      .eq("codigo_interno", code)
      .single();

    if (data) {
      setFoundPeca(data as unknown as Peca);
      setActionOpen(true);
    } else {
      toast.error("Peça não encontrada: " + code);
      try { scannerRef.current?.resume(); } catch {}
    }
    setSearching(false);
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) return;
    setManualOpen(false);
    handleScan(manualCode.trim());
  };

  const resumeScanner = () => {
    setActionOpen(false);
    setFoundPeca(null);
    try { scannerRef.current?.resume(); } catch {}
  };

  const getActions = (peca: Peca) => {
    const actions: { label: string; icon: any; path: string; variant?: string }[] = [
      { label: "Ver Detalhes", icon: Eye, path: `/pecas/${peca.id}` },
    ];
    if (peca.status === "aprovado" || peca.status === "em_processo") {
      actions.unshift({ label: "Registrar Execução", icon: Play, path: `/pecas/${peca.id}/producao`, variant: "default" });
    }
    if (peca.status === "inspecao") {
      actions.unshift({ label: "Fazer Inspeção", icon: ClipboardCheck, path: `/pecas/${peca.id}/inspecao`, variant: "default" });
    }
    if (peca.status === "pronto") {
      actions.unshift({ label: "Registrar Entrega", icon: Package, path: `/pecas/${peca.id}/entrega`, variant: "default" });
    }
    return actions;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Scanner QR Code" subtitle="Aponte para a etiqueta da peça" />

      <div className="px-4 space-y-4">
        <div ref={containerRef} className="rounded-xl overflow-hidden border border-border">
          <div id="qr-reader" className="w-full" />
        </div>

        {searching && (
          <div className="flex items-center justify-center gap-2 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Buscando peça...</span>
          </div>
        )}

        <Button variant="outline" className="w-full h-12" onClick={() => setManualOpen(true)}>
          <Keyboard className="h-5 w-5 mr-2" /> Digitar código manualmente
        </Button>
      </div>

      {/* Manual input dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Buscar por Código</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Ex: TT-20260307-0001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            />
            <Button onClick={handleManualSearch} className="w-full" disabled={!manualCode.trim()}>
              Buscar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick actions after scan */}
      <Dialog open={actionOpen} onOpenChange={(o) => { if (!o) resumeScanner(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Peça Encontrada</DialogTitle></DialogHeader>
          {foundPeca && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                <p className="font-semibold text-foreground">{foundPeca.codigo_interno}</p>
                <p className="text-sm text-muted-foreground">{foundPeca.tipo} • {foundPeca.cor}</p>
                <p className="text-sm text-muted-foreground">{foundPeca.clientes?.nome}</p>
                <StatusBadge status={foundPeca.status} />
              </div>
              <div className="space-y-2">
                {getActions(foundPeca).map((a) => (
                  <Button
                    key={a.path}
                    variant={a.variant === "default" ? "default" : "outline"}
                    className="w-full h-11"
                    onClick={() => navigate(a.path)}
                  >
                    <a.icon className="h-4 w-4 mr-2" /> {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
