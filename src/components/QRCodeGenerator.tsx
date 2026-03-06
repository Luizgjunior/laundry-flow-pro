import { QRCodeSVG } from "qrcode.react";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export function QRCodeGenerator({ value, size = 200 }: QRCodeGeneratorProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
        <QRCodeSVG value={value} size={size} level="H" />
      </div>
      <p className="text-sm font-mono font-bold text-foreground">{value}</p>
    </div>
  );
}
