import { useRef, useState, useEffect, useCallback } from "react";
import { X, RotateCcw, Check, Camera } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
  instruction?: string;
}

export function CameraCapture({ onCapture, onCancel, instruction = "Centralize a peça" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [blobRef, setBlobRef] = useState<Blob | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      // Fallback to file input
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
  };

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCaptured(URL.createObjectURL(blob));
          setBlobRef(blob);
          stopCamera();
        }
      },
      "image/jpeg",
      0.8
    );
  }, [stream]);

  const retake = () => {
    setCaptured(null);
    setBlobRef(null);
    startCamera();
  };

  const confirm = () => {
    if (blobRef) onCapture(blobRef);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onCancel} className="rounded-full bg-black/40 p-2 text-white">
          <X className="h-5 w-5" />
        </button>
        <p className="text-white text-sm font-medium">{instruction}</p>
        <div className="w-9" />
      </div>

      {/* Camera / Preview */}
      {captured ? (
        <img src={captured} alt="captured" className="flex-1 object-contain" />
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover" />
      )}

      {/* Ghost overlay */}
      {!captured && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-80 border-2 border-white/30 rounded-2xl" />
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 p-8 bg-gradient-to-t from-black/60 to-transparent">
        {captured ? (
          <>
            <button onClick={retake} className="flex flex-col items-center gap-1 text-white">
              <div className="rounded-full bg-white/20 p-3"><RotateCcw className="h-5 w-5" /></div>
              <span className="text-xs">Refazer</span>
            </button>
            <button onClick={confirm} className="flex flex-col items-center gap-1 text-white">
              <div className="rounded-full bg-primary p-4"><Check className="h-6 w-6" /></div>
              <span className="text-xs">Usar foto</span>
            </button>
          </>
        ) : (
          <button onClick={capture} className="rounded-full border-4 border-white p-1">
            <div className="rounded-full bg-white h-16 w-16 flex items-center justify-center active:scale-90 transition-transform">
              <Camera className="h-6 w-6 text-black" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
