import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Building2, Settings, Beaker, Users, Package, UserPlus, ChevronRight } from "lucide-react";

const steps = [
  { id: "primeiro_cliente", title: "Cadastre um cliente", description: "Adicione seu primeiro cliente", href: "/clientes/novo", icon: Users },
  { id: "primeira_peca", title: "Registre uma peça", description: "Faça sua primeira entrada", href: "/pecas/nova", icon: Package },
  { id: "primeira_maquina", title: "Cadastre uma máquina", description: "Configure suas lavadoras", href: "/config/maquinas", icon: Settings },
  { id: "primeiro_produto", title: "Adicione produtos", description: "Cadastre produtos químicos", href: "/config/produtos", icon: Beaker },
];

export function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenant_id) return;
    checkProgress();
  }, [user?.tenant_id]);

  const checkProgress = async () => {
    const tid = user!.tenant_id!;
    const [c, p, m, pr] = await Promise.all([
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("pecas").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("maquinas").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("produtos").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
    ]);
    setDone({
      primeiro_cliente: (c.count || 0) > 0,
      primeira_peca: (p.count || 0) > 0,
      primeira_maquina: (m.count || 0) > 0,
      primeiro_produto: (pr.count || 0) > 0,
    });
    setLoading(false);
  };

  if (loading || dismissed) return null;

  const completedCount = Object.values(done).filter(Boolean).length;
  if (completedCount === steps.length) return null;

  const progress = (completedCount / steps.length) * 100;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Bem-vindo ao TexTrace! 🎉</CardTitle>
            <CardDescription>Complete as etapas para configurar seu sistema</CardDescription>
          </div>
          <span className="text-sm font-semibold text-primary">{completedCount}/{steps.length}</span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => !done[step.id] && navigate(step.href)}
            disabled={done[step.id]}
            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-background/60 disabled:opacity-60"
          >
            {done[step.id] ? (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {!done[step.id] && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground" onClick={() => setDismissed(true)}>
          Fechar guia
        </Button>
      </CardContent>
    </Card>
  );
}
