export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      circle_members: {
        Row: {
          circle_id: string
          is_active: boolean | null
          joined_at: string
          role: Database["public"]["Enums"]["member_role_type"]
          user_id: string
        }
        Insert: {
          circle_id: string
          is_active?: boolean | null
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role_type"]
          user_id: string
        }
        Update: {
          circle_id?: string
          is_active?: boolean | null
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circle_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_private: boolean
          max_members: number | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean
          max_members?: number | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean
          max_members?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount_cents: number
          created_at: string
          goal_id: string
          id: string
          notes: string | null
          source: Database["public"]["Enums"]["contribution_source_type"]
          transaction_reference: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          goal_id: string
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["contribution_source_type"]
          transaction_reference?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          goal_id?: string
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["contribution_source_type"]
          transaction_reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string | null
          created_at: string | null
          id: string
          requester_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          circle_id: string
          contribution_frequency: string | null
          contribution_per_period: number | null
          created_at: string
          created_by: string
          current_amount_cents: number | null
          description: string | null
          id: string
          portfolio: string | null
          status: Database["public"]["Enums"]["goal_status_type"]
          target_amount_cents: number
          target_date: string | null
          title: string
          updated_at: string
          withdrawal_account: string | null
        }
        Insert: {
          circle_id: string
          contribution_frequency?: string | null
          contribution_per_period?: number | null
          created_at?: string
          created_by: string
          current_amount_cents?: number | null
          description?: string | null
          id?: string
          portfolio?: string | null
          status?: Database["public"]["Enums"]["goal_status_type"]
          target_amount_cents: number
          target_date?: string | null
          title: string
          updated_at?: string
          withdrawal_account?: string | null
        }
        Update: {
          circle_id?: string
          contribution_frequency?: string | null
          contribution_per_period?: number | null
          created_at?: string
          created_by?: string
          current_amount_cents?: number | null
          description?: string | null
          id?: string
          portfolio?: string | null
          status?: Database["public"]["Enums"]["goal_status_type"]
          target_amount_cents?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          withdrawal_account?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circle_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_types: {
        Row: {
          description: string | null
          expected_return: number | null
          icon: string | null
          id: string
          name: string
          risk_level: string | null
        }
        Insert: {
          description?: string | null
          expected_return?: number | null
          icon?: string | null
          id?: string
          name: string
          risk_level?: string | null
        }
        Update: {
          description?: string | null
          expected_return?: number | null
          icon?: string | null
          id?: string
          name?: string
          risk_level?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          circle_id: string
          created_at: string
          expires_at: string | null
          id: string
          invite_code: string | null
          invited_email: string
          inviter_id: string
          message: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["invite_status_type"]
        }
        Insert: {
          circle_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_code?: string | null
          invited_email: string
          inviter_id: string
          message?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invite_status_type"]
        }
        Update: {
          circle_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_code?: string | null
          invited_email?: string
          inviter_id?: string
          message?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invite_status_type"]
        }
        Relationships: [
          {
            foreignKeyName: "invites_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circle_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance_chequing: number | null
          balance_savings: number | null
          created_at: string
          email: string
          friend_code: string | null
          full_name: string
          grad_year: number | null
          id: string
          is_active: boolean | null
          risk_profile: Database["public"]["Enums"]["risk_profile_type"] | null
          school: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance_chequing?: number | null
          balance_savings?: number | null
          created_at?: string
          email: string
          friend_code?: string | null
          full_name: string
          grad_year?: number | null
          id: string
          is_active?: boolean | null
          risk_profile?: Database["public"]["Enums"]["risk_profile_type"] | null
          school?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance_chequing?: number | null
          balance_savings?: number | null
          created_at?: string
          email?: string
          friend_code?: string | null
          full_name?: string
          grad_year?: number | null
          id?: string
          is_active?: boolean | null
          risk_profile?: Database["public"]["Enums"]["risk_profile_type"] | null
          school?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          circle_id: string | null
          description: string | null
          expires_at: string | null
          goal_id: string | null
          id: string
          is_claimed: boolean | null
          issued_at: string
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["reward_type"]
          user_id: string | null
          value_cents: number | null
        }
        Insert: {
          circle_id?: string | null
          description?: string | null
          expires_at?: string | null
          goal_id?: string | null
          id?: string
          is_claimed?: boolean | null
          issued_at?: string
          metadata?: Json | null
          title: string
          type: Database["public"]["Enums"]["reward_type"]
          user_id?: string | null
          value_cents?: number | null
        }
        Update: {
          circle_id?: string | null
          description?: string | null
          expires_at?: string | null
          goal_id?: string | null
          id?: string
          is_claimed?: boolean | null
          issued_at?: string
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["reward_type"]
          user_id?: string | null
          value_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circle_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          from_account: string | null
          goal_id: string | null
          id: string
          to_account: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          from_account?: string | null
          goal_id?: string | null
          id?: string
          to_account?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          from_account?: string | null
          goal_id?: string | null
          id?: string
          to_account?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_investments: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          investment_type_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          investment_type_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          investment_type_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_investments_investment_type_id_fkey"
            columns: ["investment_type_id"]
            isOneToOne: false
            referencedRelation: "investment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number | null
          goal_id: string
          id: string
          last_contribution_date: string | null
          longest_streak: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          goal_id: string
          id?: string
          last_contribution_date?: string | null
          longest_streak?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number | null
          goal_id?: string
          id?: string
          last_contribution_date?: string | null
          longest_streak?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      circle_stats: {
        Row: {
          active_goals: number | null
          id: string | null
          member_count: number | null
          name: string | null
          owner_id: string | null
          total_contributed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "circles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_goal_progress: {
        Args: { goal_uuid: string }
        Returns: {
          contributor_count: number
          progress_percentage: number
          target_amount: number
          total_contributed: number
        }[]
      }
      update_user_streak: {
        Args: { goal_uuid: string; user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      contribution_source_type: "manual" | "auto" | "bonus"
      goal_status_type: "active" | "paused" | "completed" | "archived"
      invite_status_type: "pending" | "accepted" | "expired"
      member_role_type: "owner" | "admin" | "member"
      reward_type: "badge" | "fee_credit_sim" | "prize_entry"
      risk_profile_type: "conservative" | "balanced" | "growth"
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
        DefaultSchema["Views"]) [DefaultSchemaTableNameOrOptions] extends { 
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
      contribution_source_type: ["manual", "auto", "bonus"],
      goal_status_type: ["active", "paused", "completed", "archived"],
      invite_status_type: ["pending", "accepted", "expired"],
      member_role_type: ["owner", "admin", "member"],
      reward_type: ["badge", "fee_credit_sim", "prize_entry"],
      risk_profile_type: ["conservative", "balanced", "growth"],
    },
  },
} as const
