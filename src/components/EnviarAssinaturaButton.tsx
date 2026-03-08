import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, FileSignature, Mail, MessageSquare, CheckCircle2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  pecaId: string;
  aprovacaoId?: string;
  clienteEmail: string;
  clienteNome: string;
  clienteTelefone: string;
  onSuccess?: (linkAssinatura: string) => void;
}

export function EnviarAssinaturaButton({
  pecaId,
  aprovacaoId,
  clienteEmail,
  clienteNome,
  clienteTelefone,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metodoEnvio, setMetodoEnvio] = useState<"email" | "whatsapp">("email");
  const [resultado, setResultado] = useState<{ success: boolean; link?: string } | null>(null);

  const handleEnviar = async () => {
    setLoading(true);
    setResultado(null);

    try {
      // 1. Generate PDF/HTML of the term
      const { data: pdfData, error: pdfError } = await supabase.functions.invoke("gerar-pdf-termo", {
        body: { peca_id: pecaId },
      });

      if (pdfError || !pdfData?.success) {
        throw new Error(pdfError?.message || "Erro ao gerar PDF");
      }

      // 2. Send to Autentique
      const { data: autentiqueData, error: autentiqueError } = await supabase.functions.invoke("enviar-autentique", {
        body: {
          peca_id: pecaId,
          aprovacao_id: aprovacaoId,
          pdf_base64: pdfData.data,
          cliente_email: clienteEmail,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          usar_whatsapp: metodoEnvio === "whatsapp",
        },
      });

      if (autentiqueError || !autentiqueData?.success) {
        throw new Error(autentiqueError?.message || autentiqueData?.error || "Erro ao enviar para assinatura");
      }

      setResultado({ success: true, link: autentiqueData.link_assinatura });
      toast.success("Documento enviado para assinatura!");

      if (onSuccess && autentiqueData.link_assinatura) {
        onSuccess(autentiqueData.link_assinatura);
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao enviar documento");
      setResultado({ success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResultado(null);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
        <FileSignature className="h-4 w-4" />
        Enviar para Assinatura Digital
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assinatura Digital</DialogTitle>
            <DialogDescription>
              O cliente receberá um link para assinar o termo digitalmente via Autentique.
            </DialogDescription>
          </DialogHeader>

          {resultado?.success ? (
            <div className="space-y-4 text-center py-4">
              <div className="rounded-full bg-green-100 p-3 w-fit mx-auto">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Documento enviado!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O cliente receberá o link por {metodoEnvio === "whatsapp" ? "WhatsApp" : "email"}.
                </p>
              </div>
              {resultado.link && (
                <a
                  href={resultado.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir link de assinatura
                </a>
              )}
              <Button onClick={handleClose} variant="outline" className="w-full">
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Enviar link por:</p>
                <RadioGroup value={metodoEnvio} onValueChange={(v) => setMetodoEnvio(v as any)}>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-xs text-muted-foreground">{clienteEmail}</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer flex-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="text-xs text-muted-foreground">{clienteTelefone}</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-foreground mb-1">O que será enviado:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Termo de aprovação em PDF</li>
                  <li>• Link para assinatura digital</li>
                  <li>• Validade jurídica (MP 2.200-2/2001)</li>
                </ul>
              </div>

              <Button onClick={handleEnviar} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4 mr-2" />
                    Enviar para Assinatura
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
