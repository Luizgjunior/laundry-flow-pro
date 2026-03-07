
-- historico_pecas
CREATE TABLE public.historico_pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  tipo_evento TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  etapa_anterior INT,
  etapa_nova INT,
  descricao TEXT,
  dados_extras JSONB,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_historico_peca ON public.historico_pecas(peca_id);
CREATE INDEX idx_historico_data ON public.historico_pecas(created_at DESC);
ALTER TABLE public.historico_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_global_all_historico" ON public.historico_pecas FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);
CREATE POLICY "tenant_historico" ON public.historico_pecas FOR ALL USING (EXISTS (SELECT 1 FROM public.pecas WHERE pecas.id = historico_pecas.peca_id AND pecas.tenant_id = public.get_user_tenant(auth.uid())));

-- notificacoes
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  user_id UUID REFERENCES public.users(id),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  peca_id UUID REFERENCES public.pecas(id),
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_notificacoes_user ON public.notificacoes(user_id, lida);
CREATE INDEX idx_notificacoes_tenant ON public.notificacoes(tenant_id, created_at DESC);
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_global_all_notificacoes" ON public.notificacoes FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);
CREATE POLICY "tenant_notificacoes_select" ON public.notificacoes FOR SELECT USING (tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "tenant_notificacoes_insert" ON public.notificacoes FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "tenant_notificacoes_update" ON public.notificacoes FOR UPDATE USING (tenant_id = public.get_user_tenant(auth.uid()));

-- pecas new columns
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS atribuido_a UUID REFERENCES public.users(id);
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS data_inicio_processo TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS data_fim_processo TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS data_entrega TIMESTAMP WITH TIME ZONE;

-- execucoes
CREATE TABLE public.execucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  plano_tecnico_id UUID REFERENCES public.planos_tecnicos(id),
  etapa_numero INT NOT NULL,
  maquina_id UUID REFERENCES public.maquinas(id),
  produto_id UUID REFERENCES public.produtos(id),
  temperatura_real INT,
  duracao_real_minutos INT,
  observacoes TEXT,
  resultado TEXT,
  foto_id UUID REFERENCES public.fotos(id),
  executado_por UUID REFERENCES public.users(id) NOT NULL,
  iniciado_em TIMESTAMP WITH TIME ZONE NOT NULL,
  finalizado_em TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_execucoes_peca ON public.execucoes(peca_id);
ALTER TABLE public.execucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_global_all_execucoes" ON public.execucoes FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);
CREATE POLICY "tenant_execucoes" ON public.execucoes FOR ALL USING (EXISTS (SELECT 1 FROM public.pecas WHERE pecas.id = execucoes.peca_id AND pecas.tenant_id = public.get_user_tenant(auth.uid())));

-- inspecoes
CREATE TABLE public.inspecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  checklist JSONB NOT NULL,
  manchas_removidas BOOLEAN,
  manchas_parciais BOOLEAN,
  danos_identificados BOOLEAN,
  danos_descricao TEXT,
  aprovado BOOLEAN NOT NULL,
  requer_retrabalho BOOLEAN DEFAULT false,
  observacoes TEXT,
  fotos_saida UUID[],
  inspecionado_por UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.inspecoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_global_all_inspecoes" ON public.inspecoes FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);
CREATE POLICY "tenant_inspecoes" ON public.inspecoes FOR ALL USING (EXISTS (SELECT 1 FROM public.pecas WHERE pecas.id = inspecoes.peca_id AND pecas.tenant_id = public.get_user_tenant(auth.uid())));

-- entregas
CREATE TABLE public.entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  metodo TEXT NOT NULL,
  assinatura_base64 TEXT,
  documento_conferido BOOLEAN DEFAULT false,
  valor_cobrado NUMERIC(10,2),
  forma_pagamento TEXT,
  observacoes TEXT,
  entregue_por UUID REFERENCES public.users(id) NOT NULL,
  recebido_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_global_all_entregas" ON public.entregas FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);
CREATE POLICY "tenant_entregas" ON public.entregas FOR ALL USING (EXISTS (SELECT 1 FROM public.pecas WHERE pecas.id = entregas.peca_id AND pecas.tenant_id = public.get_user_tenant(auth.uid())));

-- Trigger for historico
CREATE OR REPLACE FUNCTION public.registrar_historico_peca()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.etapa_atual IS DISTINCT FROM NEW.etapa_atual THEN
    INSERT INTO public.historico_pecas (peca_id, tipo_evento, status_anterior, status_novo, etapa_anterior, etapa_nova, descricao, created_by)
    VALUES (
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      OLD.etapa_atual,
      NEW.etapa_atual,
      CONCAT('Status alterado de ', OLD.status, ' para ', NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_historico_peca ON public.pecas;
CREATE TRIGGER trigger_historico_peca
AFTER UPDATE ON public.pecas
FOR EACH ROW
EXECUTE FUNCTION public.registrar_historico_peca();
