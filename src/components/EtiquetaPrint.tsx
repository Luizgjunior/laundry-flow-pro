import { QRCodeSVG } from "qrcode.react";
import { useRef, useCallback } from "react";

interface EtiquetaPrintProps {
  codigo: string;
  clienteNome: string;
  tipo: string;
  cor: string;
}

export function EtiquetaPrint({ codigo, clienteNome, tipo, cor }: EtiquetaPrintProps) {
  return (
    <div id="etiqueta-print" className="hidden print:flex flex-col items-center justify-center p-2">
      <div className="border border-black rounded p-3 text-center" style={{ width: "50mm", minHeight: "30mm" }}>
        <QRCodeSVG value={codigo} size={80} level="H" />
        <p className="mt-1 text-xs font-mono font-bold">{codigo}</p>
        <p className="text-[9px] mt-0.5 truncate max-w-full">{clienteNome}</p>
        <p className="text-[8px] text-gray-600 capitalize">{tipo} • {cor}</p>
      </div>
    </div>
  );
}

export function useEtiquetaDownload() {
  const download = useCallback(async (codigo: string, clienteNome: string, tipo: string) => {
    const canvas = document.createElement("canvas");
    const scale = 3;
    const w = 300;
    const h = 200;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.roundRect(4, 4, w - 8, h - 8, 6);
    ctx.stroke();

    // QR Code from DOM
    const svgEl = document.querySelector("#etiqueta-screen-qr svg") as SVGElement | null;
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      });
      const qrSize = 100;
      ctx.drawImage(img, (w - qrSize) / 2, 15, qrSize, qrSize);
    }

    // Text
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.font = "bold 14px monospace";
    ctx.fillText(codigo, w / 2, 135);
    ctx.font = "11px sans-serif";
    ctx.fillText(clienteNome.slice(0, 30), w / 2, 155);
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#666";
    ctx.fillText(tipo, w / 2, 172);

    // Download
    const link = document.createElement("a");
    link.download = `etiqueta-${codigo}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  return { download };
}
