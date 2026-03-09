import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Documentos() {
  const { pecaId } = useParams();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocumentos();
  }, [pecaId]);

  const loadDocumentos = async () => {
    const query = supabase
      .from("documentos_assinatura")
      .select("*")
      .order("created_at", { ascending: false });

    if (pecaId) {
      query.eq("peca_id", pecaId);
    }

    const { data } = await query;
    setDocumentos(data || []);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return <Badge className="bg-green-100 text-green-700">Assinado</Badge>;
      case "pending":
        return <Badge variant="secondary">Aguardando</Badge>;
      case "refused":
        return <Badge variant="destructive">Recusado</Badge>;
      case "expired":
        return <Badge variant="outline">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Documentos"
        subtitle={pecaId ? "Documentos desta peça" : "Todos os documentos assinados"}
      />

      <div className="px-4 space-y-3">
        {documentos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum documento encontrado</p>
            </CardContent>
          </Card>
        ) : (
          documentos.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{doc.nome_documento}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {doc.assinado_em && (
                        <p className="text-xs text-green-600">
                          Assinado em {format(new Date(doc.assinado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                <div className="flex gap-2 mt-4">
                  {doc.link_documento_assinado && (
                    <Button variant="default" size="sm" asChild className="flex-1">
                      <a href={doc.link_documento_assinado} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF Assinado
                      </a>
                    </Button>
                  )}

                  {doc.status === "pending" && doc.link_assinatura && (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={doc.link_assinatura} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Link de Assinatura
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
