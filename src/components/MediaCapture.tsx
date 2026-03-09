import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Video, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Props {
  pecaId: string;
  etapa: string;
  tipo: string;
  onCapture: (url: string, tipo: "foto" | "video") => void;
  required?: boolean;
}

export function MediaCapture({ pecaId, etapa, tipo, onCapture, required }: Props) {
  const [uploading, setUploading] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      stream.getTracks().forEach((track) => track.stop());

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        setUploading(true);
        const filename = `${pecaId}/${etapa}_${tipo}_${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("pecas-fotos")
          .upload(filename, blob, { contentType: "image/jpeg" });

        if (error) {
          toast.error("Erro ao salvar foto");
        } else {
          const { data: urlData } = supabase.storage.from("pecas-fotos").getPublicUrl(filename);
          onCapture(urlData.publicUrl, "foto");
          toast.success("Foto capturada!");
        }
        setUploading(false);
      }, "image/jpeg", 0.8);
    } catch {
      toast.error("Erro ao acessar câmera");
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        stream.getTracks().forEach((track) => track.stop());

        setUploading(true);
        const filename = `${pecaId}/${etapa}_${tipo}_${Date.now()}.webm`;
        const { error } = await supabase.storage
          .from("pecas-fotos")
          .upload(filename, blob, { contentType: "video/webm" });

        if (error) {
          toast.error("Erro ao salvar vídeo");
        } else {
          const { data: urlData } = supabase.storage.from("pecas-fotos").getPublicUrl(filename);
          onCapture(urlData.publicUrl, "video");
          toast.success("Vídeo salvo!");
        }
        setUploading(false);
        setRecordingVideo(false);
      };

      mediaRecorderRef.current.start();
      setRecordingVideo(true);
    } catch {
      toast.error("Erro ao acessar câmera/microfone");
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && recordingVideo) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <Card className={required ? "border-amber-300" : ""}>
      <CardContent className="p-3">
        <video
          ref={videoRef}
          className={`w-full rounded-lg bg-black ${recordingVideo ? "" : "hidden"}`}
          style={{ maxHeight: 200 }}
          playsInline
          muted
        />

        {!recordingVideo && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={capturePhoto} disabled={uploading} className="flex-1">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="h-4 w-4 mr-1" /> Foto</>}
            </Button>
            <Button variant="outline" size="sm" onClick={startVideoRecording} disabled={uploading} className="flex-1">
              <Video className="h-4 w-4 mr-1" /> Vídeo
            </Button>
          </div>
        )}

        {recordingVideo && (
          <div className="flex gap-2 mt-2">
            <Button variant="destructive" size="sm" onClick={stopVideoRecording} className="flex-1">
              <Check className="h-4 w-4 mr-1" /> Parar Gravação
            </Button>
          </div>
        )}

        {required && (
          <p className="text-xs text-amber-600 mt-2">* Obrigatório para continuar</p>
        )}
      </CardContent>
    </Card>
  );
}
