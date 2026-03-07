import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Plano {
  id: string;
  nome: string;
  nome_exibicao: string;
  preco_mensal: number;
  preco_anual: number;
  limite_usuarios: number;
  limite_pecas_mes: number | null;
  limite_storage_mb: number;
  limite_clientes: number | null;
  funcionalidades: Record<string, any>;
}

export default function Upgrade() {
  const { user } = useAuth();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [currentPlano, setCurrentPlano] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [planosRes, tenantRes] = await Promise.all([
      supabase.from("planos").select("*").eq("ativo", true).order("ordem"),
      user?.tenant_id ? supabase.from("tenants").select("plano").eq("id", user.tenant_id).single() : Promise.resolve({ data: null }),
    ]);
    setPlanos((planosRes.data as unknown as Plano[]) || []);
    setCurrentPlano((tenantRes.data as any)?.plano || "free");
    setLoading(false);
  };

  const handleUpgrade = (plano: Plano) => {
    toast.info("Entre em contato com o suporte para alterar seu plano: suporte@textrace.com.br");
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Escolha seu Plano" subtitle="Encontre o plano ideal para sua lavanderia" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        {planos.map((p) => {
          const isCurrent = p.nome === currentPlano;
          const isPopular = p.nome === "pro";
          return (
            <Card key={p.id} className={cn("relative", isPopular && "border-primary border-2")}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground flex items-center gap-1">
                  <Star className="h-3 w-3" /> Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{p.nome_exibicao}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">R$ {Number(p.preco_mensal).toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                {p.preco_anual > 0 && (
                  <p className="text-xs text-muted-foreground">ou R$ {Number(p.preco_anual).toFixed(0)}/ano (economize 17%)</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <Feature label={`${p.limite_usuarios} usuário${p.limite_usuarios > 1 ? "s" : ""}`} />
                <Feature label={p.limite_pecas_mes ? `${p.limite_pecas_mes} peças/mês` : "Peças ilimitadas"} />
                <Feature label={`${(p.limite_storage_mb / 1000).toFixed(0)}GB storage`} />
                <Feature label={p.limite_clientes ? `${p.limite_clientes} clientes` : "Clientes ilimitados"} />
                {p.funcionalidades?.relatorios && <Feature label="Relatórios avançados" />}
                {p.funcionalidades?.whatsapp_auto && <Feature label="WhatsApp automático" />}
                {p.funcionalidades?.api && <Feature label="Acesso à API" />}
                {p.funcionalidades?.white_label && <Feature label="White Label" />}
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={isCurrent ? "outline" : "default"} disabled={isCurrent} onClick={() => handleUpgrade(p)}>
                  {isCurrent ? "Plano Atual" : "Selecionar"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      {label}
    </div>
  );
}
