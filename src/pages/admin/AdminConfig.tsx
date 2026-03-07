import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Palette, Mail, FileText } from "lucide-react";

export default function AdminConfig() {
  return (
    <div className="space-y-4">
      <PageHeader title="Configurações" subtitle="Configurações globais do sistema" />
      <div className="px-4 grid gap-4 pb-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-5 w-5 text-primary" />
              Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configurações gerais do sistema como logo, nome e email de suporte serão implementadas em breve.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-5 w-5 text-primary" />
              Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gerencie os planos disponíveis, limites e preços pela tela de Financeiro.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-primary" />
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configurações de Stripe, WhatsApp API e email (SMTP) serão disponibilizadas em breve.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              Termos e Políticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Termos de uso padrão e política de privacidade para novos tenants.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
