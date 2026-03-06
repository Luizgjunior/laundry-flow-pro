export type PlanoTipo = 'free' | 'starter' | 'pro' | 'enterprise';
export type UserRole = 'admin_global' | 'admin_empresa' | 'usuario';
export type PecaStatus = 'entrada' | 'diagnostico' | 'aguardando_aprovacao' | 'aprovado' | 'em_processo' | 'inspecao' | 'pronto' | 'entregue' | 'recusado' | 'incidente';
export type RiscoTipo = 'baixo' | 'medio' | 'alto';
export type FotoTipo = 'entrada_frente' | 'entrada_costas' | 'avaria' | 'processo' | 'saida';
export type AprovacaoStatus = 'pendente' | 'aprovado' | 'recusado' | 'expirado';

export interface Tenant {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  plano: PlanoTipo;
  limite_usuarios: number;
  limite_storage_mb: number;
  ativo: boolean;
  logo_url: string | null;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  nome: string;
  role: UserRole;
  funcao: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Cliente {
  id: string;
  tenant_id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
  endereco: string | null;
  created_at: string;
}

export interface Peca {
  id: string;
  tenant_id: string;
  cliente_id: string;
  codigo_interno: string;
  tipo: string;
  marca: string | null;
  cor: string;
  composicao: Record<string, number> | null;
  status: PecaStatus;
  etapa_atual: number;
  risco_calculado: RiscoTipo | null;
  valor_servico: number | null;
  previsao_entrega: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  clientes?: Cliente;
}
