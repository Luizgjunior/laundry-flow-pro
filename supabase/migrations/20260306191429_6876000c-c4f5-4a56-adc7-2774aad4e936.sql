
-- Create enums
CREATE TYPE public.plano_tipo AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE public.user_role AS ENUM ('admin_global', 'admin_empresa', 'usuario');
CREATE TYPE public.peca_status AS ENUM ('entrada', 'diagnostico', 'aguardando_aprovacao', 'aprovado', 'em_processo', 'inspecao', 'pronto', 'entregue', 'recusado', 'incidente');
CREATE TYPE public.risco_tipo AS ENUM ('baixo', 'medio', 'alto');
CREATE TYPE public.foto_tipo AS ENUM ('entrada_frente', 'entrada_costas', 'avaria', 'processo', 'saida');
CREATE TYPE public.aprovacao_status AS ENUM ('pendente', 'aprovado', 'recusado', 'expirado');

-- tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  plano plano_tipo NOT NULL DEFAULT 'free',
  limite_usuarios INT NOT NULL DEFAULT 3,
  limite_storage_mb INT NOT NULL DEFAULT 500,
  ativo BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- users (profiles linked to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'usuario',
  funcao TEXT,
  pin_hash TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- pecas
CREATE TABLE public.pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  codigo_interno TEXT NOT NULL,
  tipo TEXT NOT NULL,
  marca TEXT,
  cor TEXT NOT NULL,
  composicao JSONB,
  status peca_status NOT NULL DEFAULT 'entrada',
  etapa_atual INT NOT NULL DEFAULT 1,
  risco_calculado risco_tipo,
  valor_servico DECIMAL,
  previsao_entrega DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;

-- fotos
CREATE TABLE public.fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  tipo foto_tipo NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  tamanho_bytes INT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;

-- aprovacoes
CREATE TABLE public.aprovacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status aprovacao_status NOT NULL DEFAULT 'pendente',
  ip_cliente TEXT,
  user_agent TEXT,
  geolocation JSONB,
  assinatura_base64 TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.aprovacoes ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user role/tenant
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE id = p_user_id;
$$;

-- RLS Policies

-- tenants
CREATE POLICY "admin_global_all_tenants" ON public.tenants FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global');
CREATE POLICY "tenant_members_select" ON public.tenants FOR SELECT USING (id = public.get_user_tenant(auth.uid()));

-- users
CREATE POLICY "admin_global_all_users" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global');
CREATE POLICY "tenant_users_select" ON public.users FOR SELECT USING (tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "tenant_admin_manage_users" ON public.users FOR ALL USING (
  public.get_user_role(auth.uid()) = 'admin_empresa' AND tenant_id = public.get_user_tenant(auth.uid())
);

-- clientes
CREATE POLICY "admin_global_all_clientes" ON public.clientes FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global');
CREATE POLICY "tenant_clientes" ON public.clientes FOR ALL USING (tenant_id = public.get_user_tenant(auth.uid()));

-- pecas
CREATE POLICY "admin_global_all_pecas" ON public.pecas FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global');
CREATE POLICY "tenant_pecas" ON public.pecas FOR ALL USING (tenant_id = public.get_user_tenant(auth.uid()));

-- fotos
CREATE POLICY "admin_global_all_fotos" ON public.fotos FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global');
CREATE POLICY "tenant_fotos" ON public.fotos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.pecas WHERE pecas.id = fotos.peca_id AND pecas.tenant_id = public.get_user_tenant(auth.uid()))
);

-- aprovacoes
CREATE POLICY "admin_global_all_aprovacoes" ON public.aprovacoes FOR ALL USING (public.get_user_role(auth.uid()) = 'admin_global');
CREATE POLICY "tenant_aprovacoes" ON public.aprovacoes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.pecas WHERE pecas.id = aprovacoes.peca_id AND pecas.tenant_id = public.get_user_tenant(auth.uid()))
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pecas_updated_at
  BEFORE UPDATE ON public.pecas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('pecas-fotos', 'pecas-fotos', true);

CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pecas-fotos');
CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'pecas-fotos');
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pecas-fotos');
