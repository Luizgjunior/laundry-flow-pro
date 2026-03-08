
CREATE TABLE public.documentos_assinatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  aprovacao_id UUID REFERENCES public.aprovacoes(id),
  autentique_id TEXT NOT NULL,
  nome_documento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  link_assinatura TEXT,
  link_documento_assinado TEXT,
  signatarios JSONB DEFAULT '[]',
  assinado_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documentos_peca ON public.documentos_assinatura(peca_id);
CREATE INDEX idx_documentos_autentique ON public.documentos_assinatura(autentique_id);

ALTER TABLE public.documentos_assinatura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_global_all_documentos" ON public.documentos_assinatura
FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin_global'::user_role);

CREATE POLICY "tenant_documentos" ON public.documentos_assinatura
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pecas WHERE pecas.id = documentos_assinatura.peca_id 
  AND pecas.tenant_id = public.get_user_tenant(auth.uid())
));

CREATE POLICY "anon_read_documentos_by_peca" ON public.documentos_assinatura
FOR SELECT TO anon
USING (true);

CREATE POLICY "service_role_all_documentos" ON public.documentos_assinatura
FOR ALL TO service_role
USING (true);
