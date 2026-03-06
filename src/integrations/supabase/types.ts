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
      pecas: {
        Row: {
          cliente_id: string
          codigo_interno: string
          composicao: Json | null
          cor: string
          created_at: string
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
          cliente_id: string
          codigo_interno: string
          composicao?: Json | null
          cor: string
          created_at?: string
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
          cliente_id?: string
          codigo_interno?: string
          composicao?: Json | null
          cor?: string
          created_at?: string
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
      tenants: {
        Row: {
          ativo: boolean
          cnpj: string
          created_at: string
          id: string
          limite_storage_mb: number
          limite_usuarios: number
          logo_url: string | null
          nome_fantasia: string
          plano: Database["public"]["Enums"]["plano_tipo"]
        }
        Insert: {
          ativo?: boolean
          cnpj: string
          created_at?: string
          id?: string
          limite_storage_mb?: number
          limite_usuarios?: number
          logo_url?: string | null
          nome_fantasia: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
        }
        Update: {
          ativo?: boolean
          cnpj?: string
          created_at?: string
          id?: string
          limite_storage_mb?: number
          limite_usuarios?: number
          logo_url?: string | null
          nome_fantasia?: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
        }
        Relationships: []
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
