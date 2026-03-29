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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assessment_items: {
        Row: {
          id: string
          is_active: boolean | null
          item_text: string
          round_type: string
          sort_order: number
          target_level: number
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          item_text: string
          round_type: string
          sort_order: number
          target_level: number
        }
        Update: {
          id?: string
          is_active?: boolean | null
          item_text?: string
          round_type?: string
          sort_order?: number
          target_level?: number
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          child_id: string | null
          completed_at: string | null
          detailed_answers: Json | null
          highest_level_passed: number
          id: string
          recommended_level: number
          total_sounds_asked: number
          total_sounds_correct: number
          total_tricky_asked: number
          total_tricky_correct: number
          total_words_asked: number
          total_words_correct: number
          user_id: string
        }
        Insert: {
          child_id?: string | null
          completed_at?: string | null
          detailed_answers?: Json | null
          highest_level_passed?: number
          id?: string
          recommended_level?: number
          total_sounds_asked?: number
          total_sounds_correct?: number
          total_tricky_asked?: number
          total_tricky_correct?: number
          total_words_asked?: number
          total_words_correct?: number
          user_id: string
        }
        Update: {
          child_id?: string | null
          completed_at?: string | null
          detailed_answers?: Json | null
          highest_level_passed?: number
          id?: string
          recommended_level?: number
          total_sounds_asked?: number
          total_sounds_correct?: number
          total_tricky_asked?: number
          total_tricky_correct?: number
          total_words_asked?: number
          total_words_correct?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      book_pages: {
        Row: {
          book_id: string
          id: string
          image_url: string | null
          page_number: number
          page_type: string
          sort_order: number
          text_content: string | null
        }
        Insert: {
          book_id: string
          id?: string
          image_url?: string | null
          page_number: number
          page_type: string
          sort_order: number
          text_content?: string | null
        }
        Update: {
          book_id?: string
          id?: string
          image_url?: string | null
          page_number?: number
          page_type?: string
          sort_order?: number
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_pages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          focus_sounds: string[]
          id: string
          is_free_sample: boolean | null
          is_published: boolean | null
          level: number
          page_count: number | null
          pdf_url: string | null
          slug: string
          sort_order: number
          story_words: string[] | null
          sub_level: string
          title: string
          tricky_words: string[] | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          focus_sounds: string[]
          id?: string
          is_free_sample?: boolean | null
          is_published?: boolean | null
          level: number
          page_count?: number | null
          pdf_url?: string | null
          slug: string
          sort_order: number
          story_words?: string[] | null
          sub_level: string
          title: string
          tricky_words?: string[] | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          focus_sounds?: string[]
          id?: string
          is_free_sample?: boolean | null
          is_published?: boolean | null
          level?: number
          page_count?: number | null
          pdf_url?: string | null
          slug?: string
          sort_order?: number
          story_words?: string[] | null
          sub_level?: string
          title?: string
          tricky_words?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      children: {
        Row: {
          created_at: string | null
          current_level: number | null
          date_of_birth: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          date_of_birth?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          date_of_birth?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      download_log: {
        Row: {
          book_id: string
          downloaded_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          downloaded_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          downloaded_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_log_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "download_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drawings: {
        Row: {
          book_id: string
          child_id: string | null
          created_at: string | null
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          book_id: string
          child_id?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          book_id?: string
          child_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drawings_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drawings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          levels_included: number[]
          name: string
          price_pence: number
          product_type: string
          sort_order: number
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          levels_included: number[]
          name: string
          price_pence?: number
          product_type: string
          sort_order: number
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          levels_included?: number[]
          name?: string
          price_pence?: number
          product_type?: string
          sort_order?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_paid: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          product_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          product_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          product_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          book_id: string
          child_id: string | null
          completed_at: string | null
          id: string
          quiz_type: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          book_id: string
          child_id?: string | null
          completed_at?: string | null
          id?: string
          quiz_type: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          book_id?: string
          child_id?: string | null
          completed_at?: string | null
          id?: string
          quiz_type?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          book_id: string
          correct_answer: string
          created_at: string | null
          id: string
          image_url: string | null
          options: Json | null
          question_text: string
          quiz_type: string
          sort_order: number
        }
        Insert: {
          book_id: string
          correct_answer: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          options?: Json | null
          question_text: string
          quiz_type: string
          sort_order: number
        }
        Update: {
          book_id?: string
          correct_answer?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          options?: Json | null
          question_text?: string
          quiz_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_streaks: {
        Row: {
          activity_date: string
          books_read: number | null
          child_id: string | null
          id: string
          quizzes_completed: number | null
          user_id: string
        }
        Insert: {
          activity_date: string
          books_read?: number | null
          child_id?: string | null
          id?: string
          quizzes_completed?: number | null
          user_id: string
        }
        Update: {
          activity_date?: string
          books_read?: number | null
          child_id?: string | null
          id?: string
          quizzes_completed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_streaks_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_books: {
        Row: {
          book_id: string
          child_id: string | null
          completed_at: string | null
          id: string
          last_page_read: number | null
          purchase_id: string | null
          source: string | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          child_id?: string | null
          completed_at?: string | null
          id?: string
          last_page_read?: number | null
          purchase_id?: string | null
          source?: string | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          child_id?: string | null
          completed_at?: string | null
          id?: string
          last_page_read?: number | null
          purchase_id?: string | null
          source?: string | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
