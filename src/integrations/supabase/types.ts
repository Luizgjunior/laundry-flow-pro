export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aprovacoes: {
        Row: {
          assinatura_base64: string | null
          created_at: string
          expires_at: string
          geolocation: Json | null
          id: string
          ip_cliente: string | null
          peca_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["aprovacao_status"]
          token: string
          user_agent: string | null
        }
        Insert: {
          assinatura_base64?: string | null
          created_at?: string
          expires_at: string
          geolocation?: Json | null
          id?: string
          ip_cliente?: string | null
          peca_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["aprovacao_status"]
          token: string
          user_agent?: string | null
        }
        Update: {
          assinatura_base64?: string | null
          created_at?: string
          expires_at?: string
          geolocation?: Json | null
          id?: string
          ip_cliente?: string | null
          peca_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["aprovacao_status"]
          token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aprovacoes_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          cancelamento_agendado: boolean | null
          cancelamento_motivo: string | null
          ciclo: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          data_proximo_pagamento: string | null
          id: string
          plano_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          trial_ate: string | null
          updated_at: string | null
        }
        Insert: {
          cancelamento_agendado?: boolean | null
          cancelamento_motivo?: string | null
          ciclo?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          data_proximo_pagamento?: string | null
          id?: string
          plano_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          trial_ate?: string | null
          updated_at?: string | null
        }
        Update: {
          cancelamento_agendado?: boolean | null
          cancelamento_motivo?: string | null
          ciclo?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_proximo_pagamento?: string | null
          id?: string
          plano_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          trial_ate?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cpf: string
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string
          tenant_id: string
        }
        Insert: {
          cpf: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone: string
          tenant_id: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          created_at: string
          created_by: string | null
          foto_id: string | null
          id: string
          localizacao: string | null
          observacao: string | null
          peca_id: string
          tamanho: string | null
          tipo_mancha_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          foto_id?: string | null
          id?: string
          localizacao?: string | null
          observacao?: string | null
          peca_id: string
          tamanho?: string | null
          tipo_mancha_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          foto_id?: string | null
          id?: string
          localizacao?: string | null
          observacao?: string | null
          peca_id?: string
          tamanho?: string | null
          tipo_mancha_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_foto_id_fkey"
            columns: ["foto_id"]
            isOneToOne: false
            referencedRelation: "fotos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_tipo_mancha_id_fkey"
            columns: ["tipo_mancha_id"]
            isOneToOne: false
            referencedRelation: "tipos_manchas"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          assinatura_base64: string | null
          created_at: string | null
          documento_conferido: boolean | null
          entregue_por: string
          forma_pagamento: string | null
          id: string
          metodo: string
          observacoes: string | null
          peca_id: string
          recebido_por: string | null
          valor_cobrado: number | null
        }
        Insert: {
          assinatura_base64?: string | null
          created_at?: string | null
          documento_conferido?: boolean | null
          entregue_por: string
          forma_pagamento?: string | null
          id?: string
          metodo: string
          observacoes?: string | null
          peca_id: string
          recebido_por?: string | null
          valor_cobrado?: number | null
        }
        Update: {
          assinatura_base64?: string | null
          created_at?: string | null
          documento_conferido?: boolean | null
          entregue_por?: string
          forma_pagamento?: string | null
          id?: string
          metodo?: string
          observacoes?: string | null
          peca_id?: string
          recebido_por?: string | null
          valor_cobrado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_entregue_por_fkey"
            columns: ["entregue_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      execucoes: {
        Row: {
          duracao_real_minutos: number | null
          etapa_numero: number
          executado_por: string
          finalizado_em: string | null
          foto_id: string | null
          id: string
          iniciado_em: string
          maquina_id: string | null
          observacoes: string | null
          peca_id: string
          plano_tecnico_id: string | null
          produto_id: string | null
          resultado: string | null
          temperatura_real: number | null
        }
        Insert: {
          duracao_real_minutos?: number | null
          etapa_numero: number
          executado_por: string
          finalizado_em?: string | null
          foto_id?: string | null
          id?: string
          iniciado_em: string
          maquina_id?: string | null
          observacoes?: string | null
          peca_id: string
          plano_tecnico_id?: string | null
          produto_id?: string | null
          resultado?: string | null
          temperatura_real?: number | null
        }
        Update: {
          duracao_real_minutos?: number | null
          etapa_numero?: number
          executado_por?: string
          finalizado_em?: string | null
          foto_id?: string | null
          id?: string
          iniciado_em?: string
          maquina_id?: string | null
          observacoes?: string | null
          peca_id?: string
          plano_tecnico_id?: string | null
          produto_id?: string | null
          resultado?: string | null
          temperatura_real?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_executado_por_fkey"
            columns: ["executado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_foto_id_fkey"
            columns: ["foto_id"]
            isOneToOne: false
            referencedRelation: "fotos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_plano_tecnico_id_fkey"
            columns: ["plano_tecnico_id"]
            isOneToOne: false
            referencedRelation: "planos_tecnicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          assinatura_id: string | null
          created_at: string | null
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          metodo_pagamento: string | null
          numero: string
          pdf_url: string | null
          status: string
          stripe_invoice_id: string | null
          tenant_id: string
          valor: number
        }
        Insert: {
          assinatura_id?: string | null
          created_at?: string | null
          data_emissao: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          metodo_pagamento?: string | null
          numero: string
          pdf_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          tenant_id: string
          valor: number
        }
        Update: {
          assinatura_id?: string | null
          created_at?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          metodo_pagamento?: string | null
          numero?: string
          pdf_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          tenant_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos: {
        Row: {
          created_at: string
          created_by: string
          id: string
          peca_id: string
          storage_path: string
          tamanho_bytes: number
          thumbnail_path: string | null
          tipo: Database["public"]["Enums"]["foto_tipo"]
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          peca_id: string
          storage_path: string
          tamanho_bytes: number
          thumbnail_path?: string | null
          tipo: Database["public"]["Enums"]["foto_tipo"]
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          peca_id?: string
          storage_path?: string
          tamanho_bytes?: number
          thumbnail_path?: string | null
          tipo?: Database["public"]["Enums"]["foto_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "fotos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_pecas: {
        Row: {
          created_at: string | null
          created_by: string | null
          dados_extras: Json | null
          descricao: string | null
          etapa_anterior: number | null
          etapa_nova: number | null
          id: string
          peca_id: string
          status_anterior: string | null
          status_novo: string | null
          tipo_evento: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dados_extras?: Json | null
          descricao?: string | null
          etapa_anterior?: number | null
          etapa_nova?: number | null
          id?: string
          peca_id: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo_evento: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dados_extras?: Json | null
          descricao?: string | null
          etapa_anterior?: number | null
          etapa_nova?: number | null
          id?: string
          peca_id?: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_pecas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      inspecoes: {
        Row: {
          aprovado: boolean
          checklist: Json
          created_at: string | null
          danos_descricao: string | null
          danos_identificados: boolean | null
          fotos_saida: string[] | null
          id: string
          inspecionado_por: string
          manchas_parciais: boolean | null
          manchas_removidas: boolean | null
          observacoes: string | null
          peca_id: string
          requer_retrabalho: boolean | null
        }
        Insert: {
          aprovado: boolean
          checklist: Json
          created_at?: string | null
          danos_descricao?: string | null
          danos_identificados?: boolean | null
          fotos_saida?: string[] | null
          id?: string
          inspecionado_por: string
          manchas_parciais?: boolean | null
          manchas_removidas?: boolean | null
          observacoes?: string | null
          peca_id: string
          requer_retrabalho?: boolean | null
        }
        Update: {
          aprovado?: boolean
          checklist?: Json
          created_at?: string | null
          danos_descricao?: string | null
          danos_identificados?: boolean | null
          fotos_saida?: string[] | null
          id?: string
          inspecionado_por?: string
          manchas_parciais?: boolean | null
          manchas_removidas?: boolean | null
          observacoes?: string | null
          peca_id?: string
          requer_retrabalho?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_inspecionado_por_fkey"
            columns: ["inspecionado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspecoes_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_admin: {
        Row: {
          acao: string
          admin_id: string
          created_at: string | null
          dados_antes: Json | null
          dados_depois: Json | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          acao: string
          admin_id: string
          created_at?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          acao?: string
          admin_id?: string
          created_at?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_admin_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maquinas: {
        Row: {
          ativa: boolean | null
          capacidade_kg: number | null
          created_at: string
          id: string
          nome: string
          programas: Json | null
          tenant_id: string
          tipo: string | null
        }
        Insert: {
          ativa?: boolean | null
          capacidade_kg?: number | null
          created_at?: string
          id?: string
          nome: string
          programas?: Json | null
          tenant_id: string
          tipo?: string | null
        }
        Update: {
          ativa?: boolean | null
          capacidade_kg?: number | null
          created_at?: string
          id?: string
          nome?: string
          programas?: Json | null
          tenant_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maquinas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          link: string | null
          mensagem: string
          peca_id: string | null
          tenant_id: string
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem: string
          peca_id?: string | null
          tenant_id: string
          tipo: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string
          peca_id?: string | null
          tenant_id?: string
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          atribuido_a: string | null
          cliente_id: string
          codigo_interno: string
          composicao: Json | null
          cor: string
          created_at: string
          data_entrega: string | null
          data_fim_processo: string | null
          data_inicio_processo: string | null
          etapa_atual: number
          id: string
          marca: string | null
          observacoes: string | null
          previsao_entrega: string | null
          risco_calculado: Database["public"]["Enums"]["risco_tipo"] | null
          status: Database["public"]["Enums"]["peca_status"]
          tenant_id: string
          tipo: string
          updated_at: string
          valor_servico: number | null
        }
        Insert: {
          atribuido_a?: string | null
          cliente_id: string
          codigo_interno: string
          composicao?: Json | null
          cor: string
          created_at?: string
          data_entrega?: string | null
          data_fim_processo?: string | null
          data_inicio_processo?: string | null
          etapa_atual?: number
          id?: string
          marca?: string | null
          observacoes?: string | null
          previsao_entrega?: string | null
          risco_calculado?: Database["public"]["Enums"]["risco_tipo"] | null
          status?: Database["public"]["Enums"]["peca_status"]
          tenant_id: string
          tipo: string
          updated_at?: string
          valor_servico?: number | null
        }
        Update: {
          atribuido_a?: string | null
          cliente_id?: string
          codigo_interno?: string
          composicao?: Json | null
          cor?: string
          created_at?: string
          data_entrega?: string | null
          data_fim_processo?: string | null
          data_inicio_processo?: string | null
          etapa_atual?: number
          id?: string
          marca?: string | null
          observacoes?: string | null
          previsao_entrega?: string | null
          risco_calculado?: Database["public"]["Enums"]["risco_tipo"] | null
          status?: Database["public"]["Enums"]["peca_status"]
          tenant_id?: string
          tipo?: string
          updated_at?: string
          valor_servico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pecas_atribuido_a_fkey"
            columns: ["atribuido_a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pecas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pecas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          funcionalidades: Json | null
          id: string
          limite_clientes: number | null
          limite_pecas_mes: number | null
          limite_storage_mb: number
          limite_usuarios: number
          nome: string
          nome_exibicao: string
          ordem: number | null
          preco_anual: number | null
          preco_mensal: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          funcionalidades?: Json | null
          id?: string
          limite_clientes?: number | null
          limite_pecas_mes?: number | null
          limite_storage_mb: number
          limite_usuarios: number
          nome: string
          nome_exibicao: string
          ordem?: number | null
          preco_anual?: number | null
          preco_mensal: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          funcionalidades?: Json | null
          id?: string
          limite_clientes?: number | null
          limite_pecas_mes?: number | null
          limite_storage_mb?: number
          limite_usuarios?: number
          nome?: string
          nome_exibicao?: string
          ordem?: number | null
          preco_anual?: number | null
          preco_mensal?: number
        }
        Relationships: []
      }
      planos_tecnicos: {
        Row: {
          created_at: string
          created_by: string | null
          duracao_minutos: number | null
          etapa: number
          id: string
          maquina_id: string | null
          observacoes: string | null
          peca_id: string
          produto_id: string | null
          programa: string | null
          temperatura: number | null
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duracao_minutos?: number | null
          etapa: number
          id?: string
          maquina_id?: string | null
          observacoes?: string | null
          peca_id: string
          produto_id?: string | null
          programa?: string | null
          temperatura?: number | null
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duracao_minutos?: number | null
          etapa?: number
          id?: string
          maquina_id?: string | null
          observacoes?: string | null
          peca_id?: string
          produto_id?: string | null
          programa?: string | null
          temperatura?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_tecnicos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_tecnicos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_tecnicos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_tecnicos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          contraindicacoes: string[] | null
          created_at: string
          fabricante: string | null
          id: string
          indicacoes: string[] | null
          nome: string
          tenant_id: string | null
          tipo: string | null
        }
        Insert: {
          contraindicacoes?: string[] | null
          created_at?: string
          fabricante?: string | null
          id?: string
          indicacoes?: string[] | null
          nome: string
          tenant_id?: string | null
          tipo?: string | null
        }
        Update: {
          contraindicacoes?: string[] | null
          created_at?: string
          fabricante?: string | null
          id?: string
          indicacoes?: string[] | null
          nome?: string
          tenant_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ativo: boolean
          bloqueado_em: string | null
          bloqueio_motivo: string | null
          cnpj: string
          config: Json | null
          created_at: string
          email: string | null
          endereco: Json | null
          horario_funcionamento: Json | null
          id: string
          limite_storage_mb: number
          limite_usuarios: number
          logo_url: string | null
          nome_fantasia: string
          plano: Database["public"]["Enums"]["plano_tipo"]
          telefone: string | null
          termos_customizados: string | null
        }
        Insert: {
          ativo?: boolean
          bloqueado_em?: string | null
          bloqueio_motivo?: string | null
          cnpj: string
          config?: Json | null
          created_at?: string
          email?: string | null
          endereco?: Json | null
          horario_funcionamento?: Json | null
          id?: string
          limite_storage_mb?: number
          limite_usuarios?: number
          logo_url?: string | null
          nome_fantasia: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
          telefone?: string | null
          termos_customizados?: string | null
        }
        Update: {
          ativo?: boolean
          bloqueado_em?: string | null
          bloqueio_motivo?: string | null
          cnpj?: string
          config?: Json | null
          created_at?: string
          email?: string | null
          endereco?: Json | null
          horario_funcionamento?: Json | null
          id?: string
          limite_storage_mb?: number
          limite_usuarios?: number
          logo_url?: string | null
          nome_fantasia?: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
          telefone?: string | null
          termos_customizados?: string | null
        }
        Relationships: []
      }
      tipos_manchas: {
        Row: {
          cor_hex: string | null
          created_at: string
          dificuldade: number | null
          icone: string
          id: string
          nome: string
          tenant_id: string | null
        }
        Insert: {
          cor_hex?: string | null
          created_at?: string
          dificuldade?: number | null
          icone: string
          id?: string
          nome: string
          tenant_id?: string | null
        }
        Update: {
          cor_hex?: string | null
          created_at?: string
          dificuldade?: number | null
          icone?: string
          id?: string
          nome?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_manchas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          funcao: string | null
          id: string
          nome: string
          pin_hash: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          funcao?: string | null
          id: string
          nome: string
          pin_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          funcao?: string | null
          id?: string
          nome?: string
          pin_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      uso_mensal: {
        Row: {
          ano_mes: string
          aprovacoes_enviadas: number | null
          clientes_ativos: number | null
          created_at: string | null
          fotos_upload: number | null
          id: string
          pecas_criadas: number | null
          storage_usado_mb: number | null
          tenant_id: string
          updated_at: string | null
          whatsapp_enviados: number | null
        }
        Insert: {
          ano_mes: string
          aprovacoes_enviadas?: number | null
          clientes_ativos?: number | null
          created_at?: string | null
          fotos_upload?: number | null
          id?: string
          pecas_criadas?: number | null
          storage_usado_mb?: number | null
          tenant_id: string
          updated_at?: string | null
          whatsapp_enviados?: number | null
        }
        Update: {
          ano_mes?: string
          aprovacoes_enviadas?: number | null
          clientes_ativos?: number | null
          created_at?: string | null
          fotos_upload?: number | null
          id?: string
          pecas_criadas?: number | null
          storage_usado_mb?: number | null
          tenant_id?: string
          updated_at?: string | null
          whatsapp_enviados?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "uso_mensal_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_tenant: { Args: { p_user_id: string }; Returns: string }
    }
    Enums: {
      aprovacao_status: "pendente" | "aprovado" | "recusado" | "expirado"
      foto_tipo:
        | "entrada_frente"
        | "entrada_costas"
        | "avaria"
        | "processo"
        | "saida"
      peca_status:
        | "entrada"
        | "diagnostico"
        | "aguardando_aprovacao"
        | "aprovado"
        | "em_processo"
        | "inspecao"
        | "pronto"
        | "entregue"
        | "recusado"
        | "incidente"
      plano_tipo: "free" | "starter" | "pro" | "enterprise"
      risco_tipo: "baixo" | "medio" | "alto"
      user_role: "admin_global" | "admin_empresa" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aprovacao_status: ["pendente", "aprovado", "recusado", "expirado"],
      foto_tipo: [
        "entrada_frente",
        "entrada_costas",
        "avaria",
        "processo",
        "saida",
      ],
      peca_status: [
        "entrada",
        "diagnostico",
        "aguardando_aprovacao",
        "aprovado",
        "em_processo",
        "inspecao",
        "pronto",
        "entregue",
        "recusado",
        "incidente",
      ],
      plano_tipo: ["free", "starter", "pro", "enterprise"],
      risco_tipo: ["baixo", "medio", "alto"],
      user_role: ["admin_global", "admin_empresa", "usuario"],
    },
  },
} as const
