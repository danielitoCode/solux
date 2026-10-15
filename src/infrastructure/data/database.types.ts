/**
 * Tipos generados manualmente alineados al schema SQL.
 * Más adelante: `npx supabase gen types typescript --project-id <id> > src/infrastructure/data/database.types.ts`
 */
export type UserRole = 'admin' | 'support' | 'sales';
export type CatalogItemType = 'product' | 'service';
export type CatalogCategory =
  | 'solar_panels'
  | 'inverters'
  | 'batteries'
  | 'solar_kits'
  | 'power_stations'
  | 'grounding'
  | 'electrical_installation'
  | 'electrical_repair'
  | 'maintenance'
  | 'advisory';
export type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageAuthor = 'customer' | 'agent' | 'system';
export type ContactSubject = 'quote' | 'general' | 'partnership' | 'other';
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      company_profile: {
        Row: {
          id: string;
          name: string;
          tagline: string;
          about: string;
          mission: string;
          vision: string;
          years_of_experience: number;
          completed_projects: number;
          logo_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tagline?: string;
          about?: string;
          mission?: string;
          vision?: string;
          years_of_experience?: number;
          completed_projects?: number;
          logo_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['company_profile']['Insert']>;
      };
      catalog_items: {
        Row: {
          id: string;
          type: CatalogItemType;
          category: CatalogCategory;
          name: string;
          short_description: string;
          description: string;
          price: number | null;
          currency: string;
          image_url: string | null;
          features: string[];
          is_active: boolean;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: CatalogItemType;
          category: CatalogCategory;
          name: string;
          short_description?: string;
          description?: string;
          price?: number | null;
          currency?: string;
          image_url?: string | null;
          features?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['catalog_items']['Insert']>;
      };
      reservations: {
        Row: {
          id: string;
          tracking_code: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          service_category: string;
          preferred_date: string;
          preferred_time_slot: string;
          address: string;
          notes: string | null;
          status: ReservationStatus;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tracking_code?: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          service_category: string;
          preferred_date: string;
          preferred_time_slot: string;
          address?: string;
          notes?: string | null;
          status?: ReservationStatus;
          assigned_to?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>;
      };
      support_tickets: {
        Row: {
          id: string;
          tracking_code: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          subject: string;
          description: string;
          status: TicketStatus;
          priority: TicketPriority;
          related_reservation_id: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          tracking_code?: string;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          subject: string;
          description: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          related_reservation_id?: string | null;
          assigned_to?: string | null;
        };
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>;
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: ContactSubject;
          message: string;
          is_read: boolean;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject?: ContactSubject;
          message: string;
          is_read?: boolean;
          assigned_to?: string | null;
        };
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>;
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author: MessageAuthor;
          author_name: string;
          body: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author: MessageAuthor;
          author_name: string;
          body: string;
          is_internal?: boolean;
        };
        Update: Partial<Database['public']['Tables']['ticket_messages']['Insert']>;
      };
      contact_info: {
        Row: {
          id: string;
          email: string;
          phone: string;
          whatsapp: string | null;
          address: string;
          city: string;
          country: string;
          map_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone: string;
          whatsapp?: string | null;
          address?: string;
          city?: string;
          country?: string;
          map_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['contact_info']['Insert']>;
      };
      consumable_products: {
        Row: { id: string; name: string; sku: string | null; category: string; unit: string; description: string; default_cost: number; default_markup_percent: number; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; sku?: string | null; category?: string; unit?: string; description?: string; default_cost?: number; default_markup_percent?: number; is_active?: boolean };
        Update: Partial<Database['public']['Tables']['consumable_products']['Insert']>;
      };
      reservation_materials: {
        Row: { id: string; reservation_id: string; product_id: string | null; product_name: string; unit: string; quantity: number; unit_cost: number; adjustment_type: 'markup' | 'discount' | 'none'; adjustment_percent: number; notes: string; created_at: string; updated_at: string };
        Insert: { id?: string; reservation_id: string; product_id?: string | null; product_name: string; unit?: string; quantity?: number; unit_cost?: number; adjustment_type?: 'markup' | 'discount' | 'none'; adjustment_percent?: number; notes?: string };
        Update: Partial<Database['public']['Tables']['reservation_materials']['Insert']>;
      };
      site_projects: {
        Row: { id: string; title: string; slug: string; location: string; category: string; system_name: string; capacity_kw: number | null; inverter: string; panels: string; battery: string; description: string; specifications: { label: string; value: string }[]; gallery: string[]; layout: 'hero-left' | 'editorial' | 'gallery-grid' | 'technical-report'; is_published: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; slug: string; location?: string; category?: string; system_name?: string; capacity_kw?: number | null; inverter?: string; panels?: string; battery?: string; description?: string; specifications?: { label: string; value: string }[]; gallery?: string[]; layout?: 'hero-left' | 'editorial' | 'gallery-grid' | 'technical-report'; is_published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['site_projects']['Insert']>;
      };
      business_hours: {
        Row: {
          id: string;
          day: DayOfWeek;
          open_time: string | null;
          close_time: string | null;
          is_closed: boolean;
        };
        Insert: {
          id?: string;
          day: DayOfWeek;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['business_hours']['Insert']>;
      };
    };
    Views: {
      public_catalog: {
        Row: {
          id: string;
          type: CatalogItemType;
          category: CatalogCategory;
          name: string;
          short_description: string;
          description: string;
          price: number | null;
          currency: string;
          image_url: string | null;
          features: string[];
          is_featured: boolean;
          sort_order: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      receive_catalog_purchase: {
        Args: {
          p_operation_key: string;
          p_catalog_item_id: string;
          p_quantity: number;
          p_unit_cost: number;
          p_description?: string;
          p_document_reference?: string | null;
        };
        Returns: string;
      };
      record_catalog_sale: {
        Args: {
          p_operation_key: string;
          p_catalog_item_id: string;
          p_quantity: number;
          p_sale_unit_price: number;
          p_description?: string;
        };
        Returns: string;
      };
      record_operating_expense: { Args: { p_operation_key: string; p_amount: number; p_category: string; p_description: string; p_occurred_at?: string; p_document_reference?: string | null }; Returns: string };
      accrue_job_labor: { Args: { p_operation_key: string; p_reservation_id: string; p_employee_id: string; p_role_description: string; p_hours: number; p_amount: number; p_notes?: string }; Returns: string };
      pay_employee: { Args: { p_operation_key: string; p_employee_id: string; p_amount: number; p_description?: string; p_document_reference?: string | null }; Returns: string };
      record_customer_payment: { Args: { p_operation_key: string; p_charge_operation_id: string; p_amount: number; p_description?: string; p_document_reference?: string | null; p_occurred_at?: string }; Returns: string };
      get_financial_summary: { Args: { p_from?: string; p_to?: string }; Returns: { sales_gross: number; managed_sales_commission: number; customer_cash_in: number; customer_refunds: number; operating_expenses: number; inventory_purchases: number; labor_accrued: number; employee_cash_out: number; estimated_cash_flow: number; unpaid_customer_charges: number }[] };

      get_reservation_materials_by_tracking: {
        Args: { p_code: string };
        Returns: { product_name: string; unit: string; quantity: number; unit_cost: number; adjustment_type: string; adjustment_percent: number; line_total: number; notes: string; created_at: string }[];
      };
      get_reservation_materials_total_by_tracking: { Args: { p_code: string }; Returns: number };
      get_reservation_by_tracking: {
        Args: { p_code: string };
        Returns: Database['public']['Tables']['reservations']['Row'][];
      };
      get_ticket_by_tracking: {
        Args: { p_code: string };
        Returns: Database['public']['Tables']['support_tickets']['Row'][];
      };
      get_ticket_messages_by_tracking: {
        Args: { p_code: string };
        Returns: Database['public']['Tables']['ticket_messages']['Row'][];
      };
    };
  };
}
