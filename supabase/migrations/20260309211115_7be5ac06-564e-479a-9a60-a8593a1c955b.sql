
-- 1. Add lado column to diagnosticos
ALTER TABLE public.diagnosticos ADD COLUMN IF NOT EXISTS lado TEXT DEFAULT 'frente';

-- 2. Create ia_historico table
CREATE TABLE IF NOT EXISTS public.ia_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  tipo_peca TEXT NOT NULL,
  composicao JSONB,
  manchas JSONB,
  sugestao_ia JSONB NOT NULL,
  sugestao_aceita JSONB,
  aceito BOOLEAN DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ia_historico_tenant ON public.ia_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ia_historico_tipo ON public.ia_historico(tipo_peca);

ALTER TABLE public.ia_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_ia_historico" ON public.ia_historico
FOR ALL USING (tenant_id = public.get_user_tenant(auth.uid()));

-- 3. Add columns to execucoes
ALTER TABLE public.execucoes ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]';
ALTER TABLE public.execucoes ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]';
ALTER TABLE public.execucoes ADD COLUMN IF NOT EXISTS detalhes_processo TEXT;
ALTER TABLE public.execucoes ADD COLUMN IF NOT EXISTS foto_material TEXT;
ALTER TABLE public.execucoes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'em_andamento';
ALTER TABLE public.execucoes ADD COLUMN IF NOT EXISTS pausado_em TIMESTAMPTZ;
ALTER TABLE public.execucoes ADD COLUMN IF NOT EXISTS motivo_pausa TEXT;

-- 4. Add columns to planos_tecnicos
ALTER TABLE public.planos_tecnicos ADD COLUMN IF NOT EXISTS rotacao INTEGER;
ALTER TABLE public.planos_tecnicos ADD COLUMN IF NOT EXISTS velocidade TEXT;
ALTER TABLE public.planos_tecnicos ADD COLUMN IF NOT EXISTS produtos_adicionais JSONB DEFAULT '[]';
