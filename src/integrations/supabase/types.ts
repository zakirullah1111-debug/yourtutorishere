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
      chat_history: {
        Row: {
          ai_model: string | null
          created_at: string
          id: string
          message: string
          response: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          id?: string
          message: string
          response: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          id?: string
          message?: string
          response?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          student_unread_count: number | null
          student_user_id: string
          tutor_unread_count: number | null
          tutor_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          student_unread_count?: number | null
          student_user_id: string
          tutor_unread_count?: number | null
          tutor_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          student_unread_count?: number | null
          student_user_id?: string
          tutor_unread_count?: number | null
          tutor_user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_pkr: number
          created_at: string
          id: string
          package_type: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          session_ids: string[] | null
          student_id: string
          transaction_id: string | null
          tutor_id: string
        }
        Insert: {
          amount_pkr: number
          created_at?: string
          id?: string
          package_type?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          session_ids?: string[] | null
          student_id: string
          transaction_id?: string | null
          tutor_id: string
        }
        Update: {
          amount_pkr?: number
          created_at?: string
          id?: string
          package_type?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          session_ids?: string[] | null
          student_id?: string
          transaction_id?: string | null
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          gender: string | null
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_verified: boolean | null
          rating: number
          session_id: string | null
          student_id: string
          tutor_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          rating: number
          session_id?: string | null
          student_id: string
          tutor_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          rating?: number
          session_id?: string | null
          student_id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_minutes: number
          id: string
          recording_url: string | null
          scheduled_date: string
          scheduled_time: string
          session_notes: string | null
          status: string | null
          student_feedback: string | null
          student_id: string
          student_rating: number | null
          subject: string
          tutor_feedback: string | null
          tutor_id: string
          tutor_rating: number | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          recording_url?: string | null
          scheduled_date: string
          scheduled_time: string
          session_notes?: string | null
          status?: string | null
          student_feedback?: string | null
          student_id: string
          student_rating?: number | null
          subject: string
          tutor_feedback?: string | null
          tutor_id: string
          tutor_rating?: number | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          recording_url?: string | null
          scheduled_date?: string
          scheduled_time?: string
          session_notes?: string | null
          status?: string | null
          student_feedback?: string | null
          student_id?: string
          student_rating?: number | null
          subject?: string
          tutor_feedback?: string | null
          tutor_id?: string
          tutor_rating?: number | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          additional_subjects: string[] | null
          assigned_tutor_id: string | null
          created_at: string
          current_class: string | null
          current_grade_average: number | null
          education_board: string | null
          id: string
          last_session_date: string | null
          next_session_date: string | null
          notes: string | null
          package_type: string | null
          parent_email: string | null
          parent_phone: string | null
          parent_satisfaction: number | null
          payment_status: string | null
          primary_subject: string
          progress_status: string | null
          school_name: string | null
          secondary_subject: string | null
          sessions_per_week: number | null
          status: string | null
          total_hours_completed: number | null
          total_sessions_completed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_subjects?: string[] | null
          assigned_tutor_id?: string | null
          created_at?: string
          current_class?: string | null
          current_grade_average?: number | null
          education_board?: string | null
          id?: string
          last_session_date?: string | null
          next_session_date?: string | null
          notes?: string | null
          package_type?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          parent_satisfaction?: number | null
          payment_status?: string | null
          primary_subject: string
          progress_status?: string | null
          school_name?: string | null
          secondary_subject?: string | null
          sessions_per_week?: number | null
          status?: string | null
          total_hours_completed?: number | null
          total_sessions_completed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_subjects?: string[] | null
          assigned_tutor_id?: string | null
          created_at?: string
          current_class?: string | null
          current_grade_average?: number | null
          education_board?: string | null
          id?: string
          last_session_date?: string | null
          next_session_date?: string | null
          notes?: string | null
          package_type?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          parent_satisfaction?: number | null
          payment_status?: string | null
          primary_subject?: string
          progress_status?: string | null
          school_name?: string | null
          secondary_subject?: string | null
          sessions_per_week?: number | null
          status?: string | null
          total_hours_completed?: number | null
          total_sessions_completed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_assigned_tutor_id_fkey"
            columns: ["assigned_tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: string
          created_at: string
          icon: string | null
          id: string
          name: string
          tutor_count: number | null
        }
        Insert: {
          category: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          tutor_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          tutor_count?: number | null
        }
        Relationships: []
      }
      tutors: {
        Row: {
          active_students: number | null
          additional_subjects: string[] | null
          availability_days: string[] | null
          average_rating: number | null
          bio_summary: string | null
          cnic: string | null
          country: string | null
          created_at: string
          degree: string
          education_level: string
          graduation_year: number
          hourly_rate_pkr: number
          id: string
          languages: string[] | null
          notification_preferences: Json | null
          preferred_time_slot: string | null
          primary_subject: string
          profile_complete: boolean | null
          school_of_teaching: string | null
          secondary_subject: string | null
          status: string | null
          teaching_levels: string[]
          teaching_mode: string | null
          total_hours_taught: number | null
          total_reviews: number | null
          total_students_taught: number | null
          university: string
          updated_at: string
          user_id: string
          verified: boolean | null
          years_of_experience: number | null
        }
        Insert: {
          active_students?: number | null
          additional_subjects?: string[] | null
          availability_days?: string[] | null
          average_rating?: number | null
          bio_summary?: string | null
          cnic?: string | null
          country?: string | null
          created_at?: string
          degree: string
          education_level: string
          graduation_year: number
          hourly_rate_pkr: number
          id?: string
          languages?: string[] | null
          notification_preferences?: Json | null
          preferred_time_slot?: string | null
          primary_subject: string
          profile_complete?: boolean | null
          school_of_teaching?: string | null
          secondary_subject?: string | null
          status?: string | null
          teaching_levels: string[]
          teaching_mode?: string | null
          total_hours_taught?: number | null
          total_reviews?: number | null
          total_students_taught?: number | null
          university: string
          updated_at?: string
          user_id: string
          verified?: boolean | null
          years_of_experience?: number | null
        }
        Update: {
          active_students?: number | null
          additional_subjects?: string[] | null
          availability_days?: string[] | null
          average_rating?: number | null
          bio_summary?: string | null
          cnic?: string | null
          country?: string | null
          created_at?: string
          degree?: string
          education_level?: string
          graduation_year?: number
          hourly_rate_pkr?: number
          id?: string
          languages?: string[] | null
          notification_preferences?: Json | null
          preferred_time_slot?: string | null
          primary_subject?: string
          profile_complete?: boolean | null
          school_of_teaching?: string | null
          secondary_subject?: string | null
          status?: string | null
          teaching_levels?: string[]
          teaching_mode?: string | null
          total_hours_taught?: number | null
          total_reviews?: number | null
          total_students_taught?: number | null
          university?: string
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          years_of_experience?: number | null
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "tutor" | "student"
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
      app_role: ["admin", "moderator", "tutor", "student"],
    },
  },
} as const
