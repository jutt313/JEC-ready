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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_japanese: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          juso_code: string | null
          name_english: string
          name_kanji: string
          name_katakana: string
          phone: string | null
          phone_type: string | null
          updated_at: string
        }
        Insert: {
          address_japanese: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          juso_code?: string | null
          name_english: string
          name_kanji: string
          name_katakana: string
          phone?: string | null
          phone_type?: string | null
          updated_at?: string
        }
        Update: {
          address_japanese?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          juso_code?: string | null
          name_english?: string
          name_kanji?: string
          name_katakana?: string
          phone?: string | null
          phone_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      export_requests: {
        Row: {
          ai_extracted_data: Json | null
          chassis_number: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          engine_number: string | null
          export_date: string | null
          generated_pdf_url: string | null
          id: string
          jusho_code: string | null
          merged_pdf_url: string | null
          ocr_raw_text: string | null
          original_image_url: string | null
          owner_address_english: string | null
          owner_address_japanese: string | null
          owner_name_english: string | null
          owner_name_japanese: string | null
          owner_phone: string | null
          plate_number: string | null
          processed_at: string | null
          processing_errors: Json | null
          request_number: string
          status: string | null
          updated_at: string
          user_id: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vin: string | null
        }
        Insert: {
          ai_extracted_data?: Json | null
          chassis_number?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          engine_number?: string | null
          export_date?: string | null
          generated_pdf_url?: string | null
          id?: string
          jusho_code?: string | null
          merged_pdf_url?: string | null
          ocr_raw_text?: string | null
          original_image_url?: string | null
          owner_address_english?: string | null
          owner_address_japanese?: string | null
          owner_name_english?: string | null
          owner_name_japanese?: string | null
          owner_phone?: string | null
          plate_number?: string | null
          processed_at?: string | null
          processing_errors?: Json | null
          request_number: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin?: string | null
        }
        Update: {
          ai_extracted_data?: Json | null
          chassis_number?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          engine_number?: string | null
          export_date?: string | null
          generated_pdf_url?: string | null
          id?: string
          jusho_code?: string | null
          merged_pdf_url?: string | null
          ocr_raw_text?: string | null
          original_image_url?: string | null
          owner_address_english?: string | null
          owner_address_japanese?: string | null
          owner_name_english?: string | null
          owner_name_japanese?: string | null
          owner_phone?: string | null
          plate_number?: string | null
          processed_at?: string | null
          processing_errors?: Json | null
          request_number?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "export_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_pdfs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          export_request_id: string | null
          file_path: string
          file_size: number | null
          generation_status: string | null
          id: string
          template_id: string | null
          template_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_request_id?: string | null
          file_path: string
          file_size?: number | null
          generation_status?: string | null
          id?: string
          template_id?: string | null
          template_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_request_id?: string | null
          file_path?: string
          file_size?: number | null
          generation_status?: string | null
          id?: string
          template_id?: string | null
          template_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_pdfs_export_request_id_fkey"
            columns: ["export_request_id"]
            isOneToOne: false
            referencedRelation: "export_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_pdfs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pdf_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      merged_pdfs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          export_request_id: string | null
          file_path: string
          file_size: number | null
          id: string
          merge_status: string | null
          template_ids: string[]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_request_id?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          merge_status?: string | null
          template_ids: string[]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_request_id?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          merge_status?: string | null
          template_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "merged_pdfs_export_request_id_fkey"
            columns: ["export_request_id"]
            isOneToOne: false
            referencedRelation: "export_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_templates: {
        Row: {
          created_at: string
          field_mapping: Json | null
          file_path: string
          id: string
          is_active: boolean | null
          template_name: string
          template_type: string
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          field_mapping?: Json | null
          file_path: string
          id?: string
          is_active?: boolean | null
          template_name: string
          template_type: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          field_mapping?: Json | null
          file_path?: string
          id?: string
          is_active?: boolean | null
          template_name?: string
          template_type?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      user_companies: {
        Row: {
          company_id: string | null
          id: string
          is_active: boolean | null
          joined_at: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
