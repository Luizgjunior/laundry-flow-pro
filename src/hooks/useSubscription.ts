import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

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

interface Assinatura {
  id: string;
  tenant_id: string;
  plano_id: string;
  status: string;
  ciclo: string;
  data_inicio: string;
  data_proximo_pagamento: string | null;
  trial_ate: string | null;
  cancelamento_agendado: boolean;
  planos?: Plano;
}

interface UsoMensal {
  pecas_criadas: number;
  fotos_upload: number;
  storage_usado_mb: number;
  clientes_ativos: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Assinatura | null>(null);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [usage, setUsage] = useState<UsoMensal>({ pecas_criadas: 0, fotos_upload: 0, storage_usado_mb: 0, clientes_ativos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenant_id) { setLoading(false); return; }
    loadData();
  }, [user?.tenant_id]);

  const loadData = async () => {
    const anoMes = new Date().toISOString().slice(0, 7);
    const [subRes, usoRes] = await Promise.all([
      supabase.from("assinaturas").select("*, planos(*)").eq("tenant_id", user!.tenant_id!).single(),
      supabase.from("uso_mensal").select("*").eq("tenant_id", user!.tenant_id!).eq("ano_mes", anoMes).single(),
    ]);

    if (subRes.data) {
      const sub = subRes.data as any;
      setSubscription(sub);
      setPlano(sub.planos as Plano);
    }
    if (usoRes.data) {
      setUsage(usoRes.data as unknown as UsoMensal);
    }
    setLoading(false);
  };

  const isAtLimit = (resource: keyof UsoMensal) => {
    if (!plano) return false;
    const limitMap: Record<string, number | null> = {
      pecas_criadas: plano.limite_pecas_mes,
      storage_usado_mb: plano.limite_storage_mb,
      clientes_ativos: plano.limite_clientes,
      fotos_upload: null,
    };
    const limit = limitMap[resource];
    if (limit === null || limit === undefined) return false;
    return usage[resource] >= limit;
  };

  const percentUsed = (resource: keyof UsoMensal) => {
    if (!plano) return 0;
    const limitMap: Record<string, number | null> = {
      pecas_criadas: plano.limite_pecas_mes,
      storage_usado_mb: plano.limite_storage_mb,
      clientes_ativos: plano.limite_clientes,
      fotos_upload: null,
    };
    const limit = limitMap[resource];
    if (!limit) return 0;
    return Math.min(100, (usage[resource] / limit) * 100);
  };

  return {
    subscription,
    plano,
    usage,
    loading,
    isAtLimit,
    percentUsed,
    isTrialing: subscription?.trial_ate ? new Date(subscription.trial_ate) > new Date() : false,
    isPastDue: subscription?.status === "past_due",
    refresh: loadData,
  };
}
