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
      admin_audit_log: {
        Row: {
          action: string
          details: Json
          id: string
          performed_at: string
          target_user_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          details?: Json
          id?: string
          performed_at?: string
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json
          id?: string
          performed_at?: string
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      app_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          _test_sid: string | null
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
          _test_sid?: string | null
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
          _test_sid?: string | null
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
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
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
      asaas_customers: {
        Row: {
          asaas_customer_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount_cents: number | null
          asaas_event_id: string | null
          asaas_payment_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          status_after: string | null
          status_before: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          asaas_event_id?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          status_after?: string | null
          status_before?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          asaas_event_id?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          status_after?: string | null
          status_before?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
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
          {
            foreignKeyName: "blocked_dates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          _test_sid: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          internal_notes: string | null
          is_vip: boolean
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
          _test_sid?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          is_vip?: boolean
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
          _test_sid?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          is_vip?: boolean
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
          {
            foreignKeyName: "clients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      cron_runs: {
        Row: {
          created_at: string
          details: Json | null
          duration_ms: number | null
          errors: number
          id: string
          job: string
          notified: number
          suspended: number
        }
        Insert: {
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          errors?: number
          id?: string
          job: string
          notified?: number
          suspended?: number
        }
        Update: {
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          errors?: number
          id?: string
          job?: string
          notified?: number
          suspended?: number
        }
        Relationships: []
      }
      faq_categories: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          enabled?: boolean
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          ai_view_count: number
          answer: string
          category_id: string
          created_at: string
          enabled: boolean
          id: string
          keywords: string[]
          last_viewed_at: string | null
          question: string
          sort_order: number
          subcategory_id: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          ai_view_count?: number
          answer: string
          category_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          keywords?: string[]
          last_viewed_at?: string | null
          question: string
          sort_order?: number
          subcategory_id?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          ai_view_count?: number
          answer?: string
          category_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          keywords?: string[]
          last_viewed_at?: string | null
          question?: string
          sort_order?: number
          subcategory_id?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "faq_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_items_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "faq_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_subcategories: {
        Row: {
          category_id: string
          created_at: string
          enabled: boolean
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "faq_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_view_logs: {
        Row: {
          created_at: string
          faq_id: string
          id: string
          query_text: string | null
          source: string
        }
        Insert: {
          created_at?: string
          faq_id: string
          id?: string
          query_text?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          faq_id?: string
          id?: string
          query_text?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_view_logs_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "faq_items"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          google_email: string | null
          id: string
          refresh_token: string | null
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      message_templates: {
        Row: {
          body: string
          created_at: string
          event: string
          id: string
          is_active: boolean
          name: string
          subject: string | null
          type: string
          updated_at: string
          variables: Json
        }
        Insert: {
          body: string
          created_at?: string
          event: string
          id?: string
          is_active?: boolean
          name: string
          subject?: string | null
          type: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          body?: string
          created_at?: string
          event?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      metrics_snapshots: {
        Row: {
          active: number
          cancelled: number
          created_at: string
          date: string
          especial: number
          mrr_cents: number
          suspended: number
          total: number
          trial: number
        }
        Insert: {
          active?: number
          cancelled?: number
          created_at?: string
          date: string
          especial?: number
          mrr_cents?: number
          suspended?: number
          total?: number
          trial?: number
        }
        Update: {
          active?: number
          cancelled?: number
          created_at?: string
          date?: string
          especial?: number
          mrr_cents?: number
          suspended?: number
          total?: number
          trial?: number
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          channels: Json
          id: boolean
          send_delay_ms: number
          throttle_per_run: number
          timezone: string
          updated_at: string
          window_end_hour: number
          window_start_hour: number
        }
        Insert: {
          channels?: Json
          id?: boolean
          send_delay_ms?: number
          throttle_per_run?: number
          timezone?: string
          updated_at?: string
          window_end_hour?: number
          window_start_hour?: number
        }
        Update: {
          channels?: Json
          id?: boolean
          send_delay_ms?: number
          throttle_per_run?: number
          timezone?: string
          updated_at?: string
          window_end_hour?: number
          window_start_hour?: number
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
      password_reset_requests: {
        Row: {
          id: string
          reason: string | null
          requested_at: string
          reset_token: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          token_expires_at: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          id?: string
          reason?: string | null
          requested_at?: string
          reset_token?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          token_expires_at?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          id?: string
          reason?: string | null
          requested_at?: string
          reset_token?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          token_expires_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
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
      plan_promotions: {
        Row: {
          created_at: string
          deadline_at: string | null
          discount_pct: number
          duration_months: number | null
          id: string
          is_active: boolean
          name: string
          plan_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline_at?: string | null
          discount_pct: number
          duration_months?: number | null
          id?: string
          is_active?: boolean
          name: string
          plan_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline_at?: string | null
          discount_pct?: number
          duration_months?: number | null
          id?: string
          is_active?: boolean
          name?: string
          plan_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_promotions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_cycle: string
          created_at: string
          display_name: string
          features: Json
          id: string
          is_active: boolean
          is_visible: boolean
          price_cents: number
          sort_order: number
          trial_days: number
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          display_name: string
          features?: Json
          id: string
          is_active?: boolean
          is_visible?: boolean
          price_cents?: number
          sort_order?: number
          trial_days?: number
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_visible?: boolean
          price_cents?: number
          sort_order?: number
          trial_days?: number
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
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
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
          active_payment_method: string | null
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
          active_payment_method?: string | null
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
          active_payment_method?: string | null
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
          active_session_nonce: string | null
          address_complement: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          business_name: string | null
          cancellation_policy: string | null
          cep: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          custom_colors: Json | null
          display_name: string
          force_password_change: boolean
          gradient_color_2: string | null
          id: string
          is_active: boolean
          neighborhood: string | null
          onboarding_completed: boolean
          password_reset_token: string | null
          password_reset_token_expires_at: string | null
          phone: string | null
          show_portfolio: boolean
          show_prices: boolean
          slug: string
          social_links: Json
          specialty: string | null
          state: string | null
          street: string | null
          street_number: string | null
          template_id: string
          theme_color: string
          ui_settings: Json | null
          updated_at: string
          welcome_message: string | null
          whatsapp_enabled: boolean
          whatsapp_greeting: string | null
          whatsapp_msg_cancellation: string | null
          whatsapp_msg_confirmation: string | null
          whatsapp_msg_reminder: string | null
          whatsapp_templates: Json | null
        }
        Insert: {
          accept_online?: boolean
          active_session_nonce?: string | null
          address_complement?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          business_name?: string | null
          cancellation_policy?: string | null
          cep?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          custom_colors?: Json | null
          display_name?: string
          force_password_change?: boolean
          gradient_color_2?: string | null
          id: string
          is_active?: boolean
          neighborhood?: string | null
          onboarding_completed?: boolean
          password_reset_token?: string | null
          password_reset_token_expires_at?: string | null
          phone?: string | null
          show_portfolio?: boolean
          show_prices?: boolean
          slug: string
          social_links?: Json
          specialty?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          template_id?: string
          theme_color?: string
          ui_settings?: Json | null
          updated_at?: string
          welcome_message?: string | null
          whatsapp_enabled?: boolean
          whatsapp_greeting?: string | null
          whatsapp_msg_cancellation?: string | null
          whatsapp_msg_confirmation?: string | null
          whatsapp_msg_reminder?: string | null
          whatsapp_templates?: Json | null
        }
        Update: {
          accept_online?: boolean
          active_session_nonce?: string | null
          address_complement?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          business_name?: string | null
          cancellation_policy?: string | null
          cep?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          custom_colors?: Json | null
          display_name?: string
          force_password_change?: boolean
          gradient_color_2?: string | null
          id?: string
          is_active?: boolean
          neighborhood?: string | null
          onboarding_completed?: boolean
          password_reset_token?: string | null
          password_reset_token_expires_at?: string | null
          phone?: string | null
          show_portfolio?: boolean
          show_prices?: boolean
          slug?: string
          social_links?: Json
          specialty?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          template_id?: string
          theme_color?: string
          ui_settings?: Json | null
          updated_at?: string
          welcome_message?: string | null
          whatsapp_enabled?: boolean
          whatsapp_greeting?: string | null
          whatsapp_msg_cancellation?: string | null
          whatsapp_msg_confirmation?: string | null
          whatsapp_msg_reminder?: string | null
          whatsapp_templates?: Json | null
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
      referral_conversions: {
        Row: {
          clicked_at: string
          created_at: string
          first_paid_at: string | null
          id: string
          link_id: string
          referee_email: string | null
          referee_id: string | null
          referrer_id: string
          registered_at: string | null
          reward_granted_at: string | null
          status: string
        }
        Insert: {
          clicked_at?: string
          created_at?: string
          first_paid_at?: string | null
          id?: string
          link_id: string
          referee_email?: string | null
          referee_id?: string | null
          referrer_id: string
          registered_at?: string | null
          reward_granted_at?: string | null
          status?: string
        }
        Update: {
          clicked_at?: string
          created_at?: string
          first_paid_at?: string | null
          id?: string
          link_id?: string
          referee_email?: string | null
          referee_id?: string | null
          referrer_id?: string
          registered_at?: string | null
          reward_granted_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          referrer_id: string
          total_clicks: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          referrer_id: string
          total_clicks?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          referrer_id?: string
          total_clicks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      review_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          professional_id: string
          used: boolean
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          professional_id: string
          used?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          professional_id?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "review_tokens_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_tokens_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_avatar_url: string | null
          client_email: string | null
          client_name: string
          created_at: string
          id: string
          is_anonymous: boolean
          is_public: boolean
          message: string
          professional_id: string
          rating: number
        }
        Insert: {
          client_avatar_url?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_public?: boolean
          message: string
          professional_id: string
          rating: number
        }
        Update: {
          client_avatar_url?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_public?: boolean
          message?: string
          professional_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          professional_id: string
          reason: string
          start_date: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          professional_id: string
          reason?: string
          start_date: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          professional_id?: string
          reason?: string
          start_date?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          _test_sid: string | null
          category: string | null
          category_label: string | null
          created_at: string
          deposit_type: string
          deposit_value: number
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_cents: number
          professional_id: string
          updated_at: string
        }
        Insert: {
          _test_sid?: string | null
          category?: string | null
          category_label?: string | null
          created_at?: string
          deposit_type?: string
          deposit_value?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_cents: number
          professional_id: string
          updated_at?: string
        }
        Update: {
          _test_sid?: string | null
          category?: string | null
          category_label?: string | null
          created_at?: string
          deposit_type?: string
          deposit_value?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
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
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_locks: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          duration_minutes: number
          held_until: string
          id: string
          locked_date: string
          locked_time: string
          professional_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          duration_minutes: number
          held_until: string
          id?: string
          locked_date: string
          locked_time: string
          professional_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          held_until?: string
          id?: string
          locked_date?: string
          locked_time?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_locks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_locks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_locks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      special_access_grants: {
        Row: {
          granted_at: string
          granted_by: string
          id: string
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by: string
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_notifications: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          error: string | null
          id: string
          kind: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          target: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          scheduled_for?: string | null
          sent_at?: string | null
          status: string
          target?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          target?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_period_ends_at: string | null
          id: string
          notes: string | null
          plan_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_ends_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_ends_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_credentials: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          must_change_password: boolean
          name: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          must_change_password?: boolean
          name: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          must_change_password?: boolean
          name?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      super_admin_mfa: {
        Row: {
          created_at: string
          email: string
          enabled: boolean
          totp_secret: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          enabled?: boolean
          totp_secret: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          enabled?: boolean
          totp_secret?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          attachments: Json
          category: string
          closed_at: string | null
          created_at: string
          description: string
          first_response_at: string | null
          id: string
          notes: Json
          occurred_at: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          attachments?: Json
          category?: string
          closed_at?: string | null
          created_at?: string
          description: string
          first_response_at?: string | null
          id?: string
          notes?: Json
          occurred_at: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          attachments?: Json
          category?: string
          closed_at?: string | null
          created_at?: string
          description?: string
          first_response_at?: string | null
          id?: string
          notes?: Json
          occurred_at?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          id: number
          maintenance_ends_at: string | null
          maintenance_message: string
          maintenance_mode_active: boolean
          test_mode_active: boolean
          test_mode_expires_at: string | null
          test_session_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          maintenance_ends_at?: string | null
          maintenance_message?: string
          maintenance_mode_active?: boolean
          test_mode_active?: boolean
          test_mode_expires_at?: string | null
          test_session_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          maintenance_ends_at?: string | null
          maintenance_message?: string
          maintenance_mode_active?: boolean
          test_mode_active?: boolean
          test_mode_expires_at?: string | null
          test_session_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "whatsapp_messages_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          break_after_minutes: number
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
          break_after_minutes?: number
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
          break_after_minutes?: number
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
          {
            foreignKeyName: "working_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_with_email: {
        Row: {
          accept_online: boolean | null
          address_complement: string | null
          auth_email: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          business_name: string | null
          cancellation_policy: string | null
          cep: string | null
          city: string | null
          cover_url: string | null
          created_at: string | null
          display_name: string | null
          gradient_color_2: string | null
          id: string | null
          is_active: boolean | null
          neighborhood: string | null
          onboarding_completed: boolean | null
          phone: string | null
          show_portfolio: boolean | null
          show_prices: boolean | null
          slug: string | null
          social_links: Json | null
          specialty: string | null
          state: string | null
          street: string | null
          street_number: string | null
          theme_color: string | null
          ui_settings: Json | null
          updated_at: string | null
          welcome_message: string | null
          whatsapp_enabled: boolean | null
          whatsapp_greeting: string | null
          whatsapp_msg_cancellation: string | null
          whatsapp_msg_confirmation: string | null
          whatsapp_msg_reminder: string | null
          whatsapp_templates: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      capture_metrics_snapshot: { Args: never; Returns: undefined }
      cleanup_expired_slot_locks: { Args: never; Returns: undefined }
      current_test_sid: { Args: never; Returns: string }
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
      get_infra_stats: { Args: never; Returns: Json }
      get_review_stats: {
        Args: { p_professional_id: string }
        Returns: {
          avg_rating: number
          total_count: number
        }[]
      }
      increment_faq_view: {
        Args: { p_id: string; p_is_ai: boolean }
        Returns: undefined
      }
      phone_in_use: { Args: { p: string }; Returns: boolean }
      submit_review_with_token: {
        Args: {
          p_client_name: string
          p_is_anonymous: boolean
          p_message: string
          p_rating: number
          p_token: string
        }
        Returns: Json
      }
      validate_review_token: { Args: { p_token: string }; Returns: Json }
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
