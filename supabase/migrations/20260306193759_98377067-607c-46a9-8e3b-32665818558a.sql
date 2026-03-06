
-- Tipos de manchas (system-wide + tenant-specific)
CREATE TABLE public.tipos_manchas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  icone TEXT NOT NULL,
  cor_hex TEXT DEFAULT '#6B7280',
  dificuldade INT DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_manchas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_global_all_tipos_manchas" ON public.tipos_manchas
FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin_global');

CREATE POLICY "tenant_read_tipos_manchas" ON public.tipos_manchas
FOR SELECT TO authenticated
USING (tenant_id IS NULL OR tenant_id = public.get_user_tenant(auth.uid()));

CREATE POLICY "tenant_manage_tipos_manchas" ON public.tipos_manchas
FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant(auth.uid()));

-- Seed default stain types
INSERT INTO public.tipos_manchas (tenant_id, nome, icone, cor_hex, dificuldade) VALUES
(NULL, 'Gordura/Óleo', 'droplet', '#F59E0B', 2),
(NULL, 'Vinho', 'wine', '#7C3AED', 3),
(NULL, 'Café', 'coffee', '#78350F', 2),
(NULL, 'Sangue', 'heart', '#DC2626', 3),
(NULL, 'Tinta', 'pen-tool', '#2563EB', 3),
(NULL, 'Mofo', 'cloud', '#059669', 3),
(NULL, 'Suor/Amarelado', 'sun', '#FBBF24', 2),
(NULL, 'Ferrugem', 'settings', '#B45309', 3),
(NULL, 'Desodorante', 'shield', '#6366F1', 2),
(NULL, 'Maquiagem', 'palette', '#EC4899', 2),
(NULL, 'Lama/Terra', 'mountain', '#713F12', 1),
(NULL, 'Grama', 'leaf', '#16A34A', 2);

-- Produtos químicos
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  fabricante TEXT,
  tipo TEXT,
  indicacoes TEXT[],
  contraindicacoes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_global_all_produtos" ON public.produtos
FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin_global');

CREATE POLICY "tenant_produtos" ON public.produtos
FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant(auth.uid()));

-- Máquinas
CREATE TABLE public.maquinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT,
  capacidade_kg DECIMAL,
  programas JSONB DEFAULT '[]'::jsonb,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_global_all_maquinas" ON public.maquinas
FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin_global');

CREATE POLICY "tenant_maquinas" ON public.maquinas
FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant(auth.uid()));

-- Diagnósticos
CREATE TABLE public.diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  tipo_mancha_id UUID REFERENCES public.tipos_manchas(id),
  localizacao TEXT,
  tamanho TEXT,
  observacao TEXT,
  foto_id UUID REFERENCES public.fotos(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_global_all_diagnosticos" ON public.diagnosticos
FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin_global');

CREATE POLICY "tenant_diagnosticos" ON public.diagnosticos
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pecas WHERE pecas.id = diagnosticos.peca_id AND pecas.tenant_id = public.get_user_tenant(auth.uid())
));

-- Planos técnicos
CREATE TABLE public.planos_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  etapa INT NOT NULL,
  tipo TEXT NOT NULL,
  produto_id UUID REFERENCES public.produtos(id),
  maquina_id UUID REFERENCES public.maquinas(id),
  programa TEXT,
  temperatura INT,
  duracao_minutos INT,
  observacoes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_tecnicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_global_all_planos_tecnicos" ON public.planos_tecnicos
FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin_global');

CREATE POLICY "tenant_planos_tecnicos" ON public.planos_tecnicos
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pecas WHERE pecas.id = planos_tecnicos.peca_id AND pecas.tenant_id = public.get_user_tenant(auth.uid())
));

-- Update aprovacoes RLS for public access by token
DROP POLICY IF EXISTS "admin_global_all_aprovacoes" ON public.aprovacoes;
DROP POLICY IF EXISTS "tenant_aprovacoes" ON public.aprovacoes;

CREATE POLICY "aprovacoes_public_read_by_token" ON public.aprovacoes
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "aprovacoes_public_update" ON public.aprovacoes
FOR UPDATE TO anon, authenticated
USING (true);

CREATE POLICY "aprovacoes_insert_authenticated" ON public.aprovacoes
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pecas WHERE pecas.id = aprovacoes.peca_id
));

CREATE POLICY "admin_global_delete_aprovacoes" ON public.aprovacoes
FOR DELETE TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin_global');
