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
      events: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_type: string
          family_space_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          event_type?: string
          family_space_id: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_type?: string
          family_space_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invites: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          expires_at: string
          family_space_id: string
          id: string
          invite_code: string
          invited_by: string
          target_person_id: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          family_space_id: string
          id?: string
          invite_code: string
          invited_by: string
          target_person_id: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          family_space_id?: string
          id?: string
          invite_code?: string
          invited_by?: string
          target_person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invites_target_person_id_fkey"
            columns: ["target_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          birthday: string | null
          display_name: string | null
          family_space_id: string
          id: string
          is_admin: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          display_name?: string | null
          family_space_id: string
          id?: string
          is_admin?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          display_name?: string | null
          family_space_id?: string
          id?: string
          is_admin?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      family_photos: {
        Row: {
          caption: string | null
          created_at: string
          family_space_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          family_space_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          family_space_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_photos_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      family_spaces: {
        Row: {
          created_at: string
          created_by: string
          family_code: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          family_code: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          family_code?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          created_by: string
          family_space_id: string
          first_name: string
          id: string
          last_name: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by: string
          family_space_id: string
          first_name: string
          id?: string
          last_name?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string
          family_space_id?: string
          first_name?: string
          id?: string
          last_name?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_contributors: {
        Row: {
          id: string
          invited_at: string
          invited_by: string
          person_id: string
          project_id: string
          responded_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          id?: string
          invited_at?: string
          invited_by: string
          person_id: string
          project_id: string
          responded_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          invited_at?: string
          invited_by?: string
          person_id?: string
          project_id?: string
          responded_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contributors_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contributors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          event_id: string | null
          family_space_id: string
          id: string
          progress: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_id?: string | null
          family_space_id: string
          id?: string
          progress?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_id?: string | null
          family_space_id?: string
          id?: string
          progress?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string
          family_space_id: string
          id: string
          person_a_id: string
          person_b_id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
        }
        Insert: {
          created_at?: string
          family_space_id: string
          id?: string
          person_a_id: string
          person_b_id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
        }
        Update: {
          created_at?: string
          family_space_id?: string
          id?: string
          person_a_id?: string
          person_b_id?: string
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
        }
        Relationships: [
          {
            foreignKeyName: "relationships_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_person_a_id_fkey"
            columns: ["person_a_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_person_b_id_fkey"
            columns: ["person_b_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_settings: {
        Row: {
          anniversaries: Json
          created_at: string
          custom_events: Json
          id: string
          show_birthdays: boolean
          updated_at: string
          user_id: string
          western_festivals: Json
        }
        Insert: {
          anniversaries?: Json
          created_at?: string
          custom_events?: Json
          id?: string
          show_birthdays?: boolean
          updated_at?: string
          user_id: string
          western_festivals?: Json
        }
        Update: {
          anniversaries?: Json
          created_at?: string
          custom_events?: Json
          id?: string
          show_birthdays?: boolean
          updated_at?: string
          user_id?: string
          western_festivals?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_placeholder: {
        Args: { _person_id: string; _user_id: string }
        Returns: boolean
      }
      generate_family_code: { Args: never; Returns: string }
      generate_invite_code: { Args: never; Returns: string }
      get_user_family_space_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      is_family_admin: {
        Args: { _family_space_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { _family_space_id: string; _user_id: string }
        Returns: boolean
      }
      is_person_owner: {
        Args: { _person_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      person_status: "active" | "invited" | "placeholder" | "deceased"
      relationship_type: "parent_child" | "partnership"
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
      person_status: ["active", "invited", "placeholder", "deceased"],
      relationship_type: ["parent_child", "partnership"],
    },
  },
} as const
