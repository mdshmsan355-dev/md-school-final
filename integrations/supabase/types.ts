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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_closed: boolean
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_closed?: boolean
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_closed?: boolean
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_levels: {
        Row: {
          academic_year_id: string
          code: string
          created_at: string
          id: string
          name: string
          school_id: string
          sort_order: number
          stage: Database["public"]["Enums"]["school_stage"]
        }
        Insert: {
          academic_year_id: string
          code: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          sort_order: number
          stage: Database["public"]["Enums"]["school_stage"]
        }
        Update: {
          academic_year_id?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          sort_order?: number
          stage?: Database["public"]["Enums"]["school_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "grade_levels_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_levels_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          phone: string
          school_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          phone?: string
          school_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          phone?: string
          school_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      result_issuances: {
        Row: {
          academic_year_id: string
          grade_level_id: string
          id: string
          issued_at: string
          issued_by: string
          results_count: number
          school_id: string
          section_id: string | null
          scope: string
          snapshot: Json
          template: Database["public"]["Enums"]["result_template"]
          term: Database["public"]["Enums"]["result_period"]
        }
        Insert: {
          academic_year_id: string
          grade_level_id: string
          id?: string
          issued_at?: string
          issued_by: string
          results_count: number
          school_id: string
          section_id: string | null
          scope?: string
          snapshot?: Json
          template: Database["public"]["Enums"]["result_template"]
          term: Database["public"]["Enums"]["result_period"]
        }
        Update: {
          academic_year_id?: string
          grade_level_id?: string
          id?: string
          issued_at?: string
          issued_by?: string
          results_count?: number
          school_id?: string
          section_id?: string | null
          scope?: string
          snapshot?: Json
          template?: Database["public"]["Enums"]["result_template"]
          term?: Database["public"]["Enums"]["result_period"]
        }
        Relationships: [
          {
            foreignKeyName: "result_issuances_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_issuances_grade_level_id_school_id_fkey"
            columns: ["grade_level_id", "school_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "result_issuances_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_issuances_section_id_school_id_fkey"
            columns: ["section_id", "school_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      result_template_settings: {
        Row: {
          grade_level_id: string
          id: string
          school_id: string
          template: Database["public"]["Enums"]["result_template"]
          term: Database["public"]["Enums"]["result_period"]
          updated_at: string
        }
        Insert: {
          grade_level_id: string
          id?: string
          school_id: string
          template?: Database["public"]["Enums"]["result_template"]
          term: Database["public"]["Enums"]["result_period"]
          updated_at?: string
        }
        Update: {
          grade_level_id?: string
          id?: string
          school_id?: string
          template?: Database["public"]["Enums"]["result_template"]
          term?: Database["public"]["Enums"]["result_period"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_template_settings_grade_level_id_school_id_fkey"
            columns: ["grade_level_id", "school_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "result_template_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          coursework_max: number
          created_at: string
          exam_max: number
          id: string
          name: string
          owner_user_id: string
          region: string
          school_type: Database["public"]["Enums"]["school_type"]
          term_pass_mark: number
          updated_at: string
        }
        Insert: {
          coursework_max?: number
          created_at?: string
          exam_max?: number
          id?: string
          name: string
          owner_user_id: string
          region?: string
          school_type?: Database["public"]["Enums"]["school_type"]
          term_pass_mark?: number
          updated_at?: string
        }
        Update: {
          coursework_max?: number
          created_at?: string
          exam_max?: number
          id?: string
          name?: string
          owner_user_id?: string
          region?: string
          school_type?: Database["public"]["Enums"]["school_type"]
          term_pass_mark?: number
          updated_at?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          academic_year_id: string
          coursework_score: number | null
          exam_score: number | null
          id: string
          school_id: string
          student_id: string
          subject_id: string
          term: Database["public"]["Enums"]["score_term"]
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          coursework_score?: number
          exam_score?: number
          id?: string
          school_id: string
          student_id: string
          subject_id: string
          term: Database["public"]["Enums"]["score_term"]
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          coursework_score?: number
          exam_score?: number
          id?: string
          school_id?: string
          student_id?: string
          subject_id?: string
          term?: Database["public"]["Enums"]["score_term"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_student_id_school_id_fkey"
            columns: ["student_id", "school_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "scores_subject_id_school_id_fkey"
            columns: ["subject_id", "school_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string
          grade_level_id: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          grade_level_id: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          grade_level_id?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_grade_level_id_school_id_fkey"
            columns: ["grade_level_id", "school_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year_id: string
          created_at: string
          grade_level_id: string
          id: string
          school_id: string
          section_id: string
          student_id: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          grade_level_id: string
          id?: string
          school_id: string
          section_id: string
          student_id: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          grade_level_id?: string
          id?: string
          school_id?: string
          section_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_grade_level_id_school_id_fkey"
            columns: ["grade_level_id", "school_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "student_enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_section_id_school_id_fkey"
            columns: ["section_id", "school_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_school_id_fkey"
            columns: ["student_id", "school_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          full_name: string
          id: string
          school_id: string
          student_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          school_id: string
          student_number?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          school_id?: string
          student_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          grade_level_id: string
          id: string
          name: string
          school_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          grade_level_id: string
          id?: string
          name: string
          school_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          grade_level_id?: string
          id?: string
          name?: string
          school_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_grade_level_id_school_id_fkey"
            columns: ["grade_level_id", "school_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_student_with_enrollment: {
        Args: {
          p_full_name: string
          p_grade_level_id: string
          p_section_id: string
        }
        Returns: {
          student_id: string
          student_number: number
        }[]
      }
      bootstrap_school: {
        Args: {
          p_academic_year: string
          p_manager_name: string
          p_phone: string
          p_region: string
          p_school_name: string
          p_school_type: Database["public"]["Enums"]["school_type"]
        }
        Returns: string
      }
      bootstrap_school_from_signup: { Args: never; Returns: string }
      change_username: { Args: { p_username: string }; Returns: string }
      get_my_username: { Args: never; Returns: string }
      current_school_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      tenant_row_allowed: { Args: { row_school_id: string }; Returns: boolean }
      set_active_academic_year: { Args: { p_year_id: string }; Returns: string }
      create_academic_year: { Args: { p_copy_grades?: boolean; p_name: string }; Returns: string }
      delete_academic_year: { Args: { p_year_id: string }; Returns: undefined }
      move_student: { Args: { p_grade_id: string; p_section_id: string; p_student_id: string; p_year_id: string }; Returns: undefined }
      issue_result_snapshot: { Args: { p_academic_year_id: string; p_grade_level_id: string; p_section_id: string | null; p_term: Database["public"]["Enums"]["result_period"]; p_template: Database["public"]["Enums"]["result_template"]; p_results_count: number; p_scope: string; p_snapshot: Json }; Returns: string }
      close_academic_year: { Args: { p_year_id: string }; Returns: undefined }
      reopen_academic_year: { Args: { p_year_id: string }; Returns: undefined }
      swap_subject_order: { Args: { p_direction: number; p_subject_id: string }; Returns: undefined }
      delete_grade_safely: { Args: { p_grade_id: string }; Returns: undefined }
      delete_student_safely: { Args: { p_student_id: string }; Returns: undefined }
      save_result_template: { Args: { p_grade_id: string; p_term: Database["public"]["Enums"]["result_period"]; p_template: Database["public"]["Enums"]["result_template"] }; Returns: Database["public"]["Tables"]["result_template_settings"]["Row"] }
    }
    Enums: {
      academic_term: "first" | "second" | "final"
      result_period: "first" | "second" | "final"
      score_term: "first" | "second"
      app_role: "admin" | "moderator" | "user"
      result_template: "classic" | "modern" | "formal" | "compact" | "children_blue" | "children_green" | "children_orange" | "formal_blue" | "formal_green" | "formal_gold"
      school_stage: "basic" | "secondary"
      school_type: "basic" | "secondary" | "mixed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      academic_term: ["first", "second", "final"],
      result_period: ["first", "second", "final"],
      score_term: ["first", "second"],
      app_role: ["admin", "moderator", "user"],
      result_template: ["classic", "modern", "formal", "compact", "children_blue", "children_green", "children_orange", "formal_blue", "formal_green", "formal_gold"],
      school_stage: ["basic", "secondary"],
      school_type: ["basic", "secondary", "mixed"],
    },
  },
} as const
