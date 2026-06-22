export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          client_id: string
          created_at: string
          deposit_cents: number
          deposit_paid: boolean
          duration_minutes: number
          google_event_id: string | null
          id: string
          notes: string | null
          price_cents: number
          professional_id: string
          scheduled_at: string
          service_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          created_at?: string
          deposit_cents?: number
          deposit_paid?: boolean
          duration_minutes: number
          google_event_id?: string | null
          id?: string
          notes?: string | null
          price_cents: number
          professional_id: string
          scheduled_at: string
          service_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          created_at?: string
          deposit_cents?: number
          deposit_paid?: boolean
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          notes?: string | null
          price_cents?: number
          professional_id?: string
          scheduled_at?: string
          service_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          id: string
          professional_id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string
          id?: string
          professional_id: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string
          id?: string
          professional_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_appointment_at: string | null
          name: string
          notes: string | null
          phone: string
          professional_id: string
          total_appointments: number
          total_spent_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_appointment_at?: string | null
          name: string
          notes?: string | null
          phone: string
          professional_id: string
          total_appointments?: number
          total_spent_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_appointment_at?: string | null
          name?: string
          notes?: string | null
          phone?: string
          professional_id?: string
          total_appointments?: number
          total_spent_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mercado_pago_account_secrets: {
        Row: {
          access_token: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mercado_pago_oauth_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          reason: string | null
          redirect_uri: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          redirect_uri?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          redirect_uri?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          appointment_id: string | null
          body: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          appointment_id: string | null
          client_name: string
          created_at: string
          external_reference: string | null
          id: string
          mercado_pago_payment_id: string | null
          method: string
          paid_at: string | null
          pix_payload: string | null
          service_name: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          appointment_id?: string | null
          client_name: string
          created_at?: string
          external_reference?: string | null
          id?: string
          mercado_pago_payment_id?: string | null
          method: string
          paid_at?: string | null
          pix_payload?: string | null
          service_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          appointment_id?: string | null
          client_name?: string
          created_at?: string
          external_reference?: string | null
          id?: string
          mercado_pago_payment_id?: string | null
          method?: string
          paid_at?: string | null
          pix_payload?: string | null
          service_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          order_index: number
          professional_id: string
          service_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          order_index?: number
          professional_id: string
          service_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          order_index?: number
          professional_id?: string
          service_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_payment_settings: {
        Row: {
          created_at: string
          id: string
          mercado_pago_account_email: string | null
          mercado_pago_connected: boolean
          mercado_pago_public_key: string | null
          pix_beneficiary_name: string | null
          pix_city: string | null
          pix_enabled: boolean
          pix_key: string | null
          pix_key_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mercado_pago_account_email?: string | null
          mercado_pago_connected?: boolean
          mercado_pago_public_key?: string | null
          pix_beneficiary_name?: string | null
          pix_city?: string | null
          pix_enabled?: boolean
          pix_key?: string | null
          pix_key_type?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          mercado_pago_account_email?: string | null
          mercado_pago_connected?: boolean
          mercado_pago_public_key?: string | null
          pix_beneficiary_name?: string | null
          pix_city?: string | null
          pix_enabled?: boolean
          pix_key?: string | null
          pix_key_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accept_online: boolean
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          cancellation_policy: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          onboarding_completed: boolean
          phone: string | null
          show_portfolio: boolean
          show_prices: boolean
          slug: string
          specialty: string | null
          state: string | null
          theme_color: string
          updated_at: string
          welcome_message: string | null
          whatsapp_enabled: boolean
          whatsapp_greeting: string | null
          whatsapp_msg_cancellation: string | null
          whatsapp_msg_confirmation: string | null
          whatsapp_msg_reminder: string | null
        }
        Insert: {
          accept_online?: boolean
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          cancellation_policy?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          is_active?: boolean
          onboarding_completed?: boolean
          phone?: string | null
          show_portfolio?: boolean
          show_prices?: boolean
          slug: string
          specialty?: string | null
          state?: string | null
          theme_color?: string
          updated_at?: string
          welcome_message?: string | null
          whatsapp_enabled?: boolean
          whatsapp_greeting?: string | null
          whatsapp_msg_cancellation?: string | null
          whatsapp_msg_confirmation?: string | null
          whatsapp_msg_reminder?: string | null
        }
        Update: {
          accept_online?: boolean
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          cancellation_policy?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          onboarding_completed?: boolean
          phone?: string | null
          show_portfolio?: boolean
          show_prices?: boolean
          slug?: string
          specialty?: string | null
          state?: string | null
          theme_color?: string
          updated_at?: string
          welcome_message?: string | null
          whatsapp_enabled?: boolean
          whatsapp_greeting?: string | null
          whatsapp_msg_cancellation?: string | null
          whatsapp_msg_confirmation?: string | null
          whatsapp_msg_reminder?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          deposit_type: string
          deposit_value: number
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price_cents: number
          professional_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_type?: string
          deposit_value?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          professional_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_type?: string
          deposit_value?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          appointment_id: string | null
          client_name: string | null
          client_phone: string
          id: string
          message_text: string
          message_type: string
          professional_id: string
          sent_at: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          client_name?: string | null
          client_phone: string
          id?: string
          message_text: string
          message_type?: string
          professional_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          client_name?: string | null
          client_phone?: string
          id?: string
          message_text?: string
          message_type?: string
          professional_id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          day_of_week: number
          end_time: string | null
          id: string
          is_open: boolean
          professional_id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          day_of_week: number
          end_time?: string | null
          id?: string
          is_open?: boolean
          professional_id: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string | null
          id?: string
          is_open?: boolean
          professional_id?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_slots: {
        Args: {
          p_date: string
          p_duration_min?: number
          p_interval_min?: number
          p_professional_id: string
        }
        Returns: {
          slot_time: string
        }[]
      }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      notification_type:
        | "new_appointment"
        | "appointment_confirmed"
        | "appointment_cancelled"
        | "appointment_reminder"
        | "payment_received"
        | "payment_pending"
        | "system"
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
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      notification_type: [
        "new_appointment",
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_reminder",
        "payment_received",
        "payment_pending",
        "system",
      ],
    },
  },
} as const

// ── Named convenience aliases ─────────────────────────────────
export type Appointment         = Tables<"appointments">
export type AppointmentStatus   = Enums<"appointment_status">
export type Client              = Tables<"clients">
export type Service             = Tables<"services">
export type ServiceInsert       = TablesInsert<"services">
export type ServiceUpdate       = TablesUpdate<"services">
export type WorkingHours        = Tables<"working_hours">
export type WorkingHoursInsert  = TablesInsert<"working_hours">
export type BlockedDate         = Tables<"blocked_dates">
export type Profile             = Tables<"profiles">
export type PortfolioItem       = Tables<"portfolio_items">
export type WhatsAppMessage     = Tables<"whatsapp_messages">
export type PushSubscription    = Tables<"push_subscriptions">
export type Notification        = Tables<"notifications">
