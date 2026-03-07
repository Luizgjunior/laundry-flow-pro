
-- planos table
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  nome_exibicao TEXT NOT NULL,
  preco_mensal NUMERIC(10,2) NOT NULL,
  preco_anual NUMERIC(10,2),
  limite_usuarios INT NOT NULL,
  limite_pecas_mes INT,
  limite_storage_mb INT NOT NULL,
  limite_clientes INT,
  funcionalidades JSONB,
  ativo BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planos_public_read" ON public.planos FOR SELECT USING (true);
CREATE POLICY "planos_admin_all" ON public.planos FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);

INSERT INTO public.planos (nome, nome_exibicao, preco_mensal, preco_anual, limite_usuarios, limite_pecas_mes, limite_storage_mb, limite_clientes, funcionalidades, ordem) VALUES
('free', 'Gratuito', 0, 0, 1, 30, 100, 50, '{"basico": true, "relatorios": false, "whatsapp_auto": false, "api": false, "suporte": "email"}', 1),
('starter', 'Starter', 97, 970, 3, 200, 500, 200, '{"basico": true, "relatorios": true, "whatsapp_auto": false, "api": false, "suporte": "email"}', 2),
('pro', 'Profissional', 197, 1970, 10, NULL, 2000, NULL, '{"basico": true, "relatorios": true, "whatsapp_auto": true, "api": false, "suporte": "prioritario"}', 3),
('enterprise', 'Enterprise', 497, 4970, 50, NULL, 10000, NULL, '{"basico": true, "relatorios": true, "whatsapp_auto": true, "api": true, "suporte": "dedicado", "white_label": true}', 4);

-- assinaturas table
CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL UNIQUE,
  plano_id UUID REFERENCES public.planos(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  ciclo TEXT NOT NULL DEFAULT 'mensal',
  data_inicio DATE NOT NULL,
  data_fim DATE,
  data_proximo_pagamento DATE,
  trial_ate DATE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  cancelamento_agendado BOOLEAN DEFAULT false,
  cancelamento_motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_assinaturas_tenant ON public.assinaturas(tenant_id);
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assinaturas_admin_all" ON public.assinaturas FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);
CREATE POLICY "assinaturas_tenant_read" ON public.assinaturas FOR SELECT USING (tenant_id = public.get_user_tenant(auth.uid()));

-- faturas table
CREATE TABLE public.faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  assinatura_id UUID REFERENCES public.assinaturas(id),
  numero TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  metodo_pagamento TEXT,
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_faturas_tenant ON public.faturas(tenant_id);
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faturas_admin_all" ON public.faturas FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);
CREATE POLICY "faturas_tenant_read" ON public.faturas FOR SELECT USING (tenant_id = public.get_user_tenant(auth.uid()));

-- uso_mensal table
CREATE TABLE public.uso_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  ano_mes TEXT NOT NULL,
  pecas_criadas INT DEFAULT 0,
  fotos_upload INT DEFAULT 0,
  storage_usado_mb NUMERIC(10,2) DEFAULT 0,
  clientes_ativos INT DEFAULT 0,
  aprovacoes_enviadas INT DEFAULT 0,
  whatsapp_enviados INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, ano_mes)
);
ALTER TABLE public.uso_mensal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uso_admin_all" ON public.uso_mensal FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);
CREATE POLICY "uso_tenant_read" ON public.uso_mensal FOR SELECT USING (tenant_id = public.get_user_tenant(auth.uid()));

-- logs_admin table
CREATE TABLE public.logs_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id) NOT NULL,
  acao TEXT NOT NULL,
  entidade_tipo TEXT,
  entidade_id UUID,
  dados_antes JSONB,
  dados_depois JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_logs_admin_data ON public.logs_admin(created_at DESC);
ALTER TABLE public.logs_admin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_admin_only" ON public.logs_admin FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);

-- tenants new columns
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco JSONB;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS termos_customizados TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS horario_funcionamento JSONB;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bloqueado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bloqueio_motivo TEXT;

-- Enable realtime for notificacoes
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
