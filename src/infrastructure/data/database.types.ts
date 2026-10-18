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
        Relationships: [];
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
        Relationships: [];
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
          fulfillment_model: 'owned_stock' | 'managed_sale';
          stock_quantity: number;
          minimum_stock: number;
          acquisition_cost: number;
          average_cost: number;
          commission_percent: number;
          supplier_name: string | null;
          external_availability: 'available' | 'unavailable' | 'unknown';
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
          fulfillment_model?: 'owned_stock' | 'managed_sale';
          stock_quantity?: number;
          minimum_stock?: number;
          acquisition_cost?: number;
          average_cost?: number;
          commission_percent?: number;
          supplier_name?: string | null;
          external_availability?: 'available' | 'unavailable' | 'unknown';
        };
        Update: Partial<Database['public']['Tables']['catalog_items']['Insert']>;
        Relationships: [];
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
        Relationships: [];
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
          resolved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>;
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      consumable_products: {
        Row: { id: string; name: string; sku: string | null; category: string; unit: string; description: string; default_cost: number; default_markup_percent: number; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; sku?: string | null; category?: string; unit?: string; description?: string; default_cost?: number; default_markup_percent?: number; is_active?: boolean };
        Update: Partial<Database['public']['Tables']['consumable_products']['Insert']>;
        Relationships: [];
      };
      reservation_materials: {
        Row: { id: string; reservation_id: string; product_id: string | null; product_name: string; unit: string; quantity: number; unit_cost: number; adjustment_type: 'markup' | 'discount' | 'none'; adjustment_percent: number; notes: string; created_at: string; updated_at: string };
        Insert: { id?: string; reservation_id: string; product_id?: string | null; product_name: string; unit?: string; quantity?: number; unit_cost?: number; adjustment_type?: 'markup' | 'discount' | 'none'; adjustment_percent?: number; notes?: string };
        Update: Partial<Database['public']['Tables']['reservation_materials']['Insert']>;
        Relationships: [];
      };
      job_closeouts: {
        Row: { id: string; reservation_id: string; financial_operation_id: string; material_cost: number; materials_charge: number; labor_cost: number; labor_charge: number; other_charge: number; total_charge: number; estimated_margin: number; notes: string; closed_by: string | null; closed_at: string; created_at: string };
        Insert: { id?: string; reservation_id: string; financial_operation_id: string; material_cost?: number; materials_charge?: number; labor_cost?: number; labor_charge?: number; other_charge?: number; total_charge?: number; estimated_margin?: number; notes?: string; closed_by?: string | null; closed_at?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['job_closeouts']['Insert']>;
        Relationships: [];
      };
      financial_settings: {
        Row: { id: boolean; investment_reserve_percent: number; labor_policy: string; inventory_cost_method: string; currency: string; updated_at: string; updated_by: string | null };
        Insert: { id?: boolean; investment_reserve_percent?: number; labor_policy?: string; inventory_cost_method?: string; currency?: string; updated_at?: string; updated_by?: string | null };
        Update: Partial<Database['public']['Tables']['financial_settings']['Insert']>;
        Relationships: [];
      };
      employees: {
        Row: { id: string; profile_id: string | null; full_name: string; email: string | null; phone: string | null; role_title: string; is_active: boolean; hired_at: string | null; notes: string; created_at: string; updated_at: string };
        Insert: { id?: string; profile_id?: string | null; full_name: string; email?: string | null; phone?: string | null; role_title?: string; is_active?: boolean; hired_at?: string | null; notes?: string };
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
        Relationships: [];
      };
      financial_operations: {
        Row: { id: string; operation_key: string; operation_type: string; status: string; amount: number; currency: string; occurred_at: string; reservation_id: string | null; employee_id: string | null; catalog_item_id: string | null; category: string; description: string; document_reference: string | null; related_operation_id: string | null; metadata: Record<string, unknown>; created_by: string | null; created_at: string };
        Insert: { id?: string; operation_key: string; operation_type: string; status?: string; amount: number; currency?: string; occurred_at?: string; reservation_id?: string | null; employee_id?: string | null; catalog_item_id?: string | null; category?: string; description: string; document_reference?: string | null; related_operation_id?: string | null; metadata?: Record<string, unknown>; created_by?: string | null };
        Update: Partial<Database['public']['Tables']['financial_operations']['Insert']>;
        Relationships: [];
      };
      inventory_movements: {
        Row: { id: string; operation_key: string; item_kind: string; catalog_item_id: string | null; consumable_product_id: string | null; movement_type: string; quantity: number; unit_cost: number; reservation_id: string | null; financial_operation_id: string | null; reason: string; metadata: Record<string, unknown>; created_by: string | null; created_at: string };
        Insert: { id?: string; operation_key: string; item_kind: string; catalog_item_id?: string | null; consumable_product_id?: string | null; movement_type: string; quantity: number; unit_cost: number; reservation_id?: string | null; financial_operation_id?: string | null; reason: string; metadata?: Record<string, unknown>; created_by?: string | null };
        Update: Partial<Database['public']['Tables']['inventory_movements']['Insert']>;
        Relationships: [];
      };
      job_labor: {
        Row: { id: string; reservation_id: string; employee_id: string; role_description: string; hours: number; agreed_amount: number; accrued_amount: number; paid_amount: number; status: string; notes: string; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; reservation_id: string; employee_id: string; role_description?: string; hours?: number; agreed_amount?: number; accrued_amount?: number; paid_amount?: number; status?: string; notes?: string; created_by?: string | null };
        Update: Partial<Database['public']['Tables']['job_labor']['Insert']>;
        Relationships: [];
      };
      job_cancellations: {
        Row: { id: string; reservation_id: string; financial_operation_id: string; material_cost: number; labor_cost: number; incurred_cost: number; customer_charge: number; reason: string; notes: string; cancelled_by: string | null; cancelled_at: string; created_at: string };
        Insert: { id?: string; reservation_id: string; financial_operation_id: string; material_cost?: number; labor_cost?: number; incurred_cost?: number; customer_charge?: number; reason: string; notes?: string; cancelled_by?: string | null };
        Update: Partial<Database['public']['Tables']['job_cancellations']['Insert']>;
        Relationships: [];
      };
      site_content: {
        Row: { page_slug: string; content: Record<string, unknown>; updated_at: string };
        Insert: { page_slug: string; content?: Record<string, unknown>; updated_at?: string };
        Update: Partial<Database['public']['Tables']['site_content']['Insert']>;
        Relationships: [];
      };
      site_projects: {
        Row: { id: string; title: string; slug: string; location: string; category: string; system_name: string; capacity_kw: number | null; inverter: string; panels: string; battery: string; description: string; specifications: { label: string; value: string }[]; gallery: string[]; layout: 'hero-left' | 'editorial' | 'gallery-grid' | 'technical-report'; is_published: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; slug: string; location?: string; category?: string; system_name?: string; capacity_kw?: number | null; inverter?: string; panels?: string; battery?: string; description?: string; specifications?: { label: string; value: string }[]; gallery?: string[]; layout?: 'hero-left' | 'editorial' | 'gallery-grid' | 'technical-report'; is_published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['site_projects']['Insert']>;
        Relationships: [];
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
        Relationships: [];
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

      close_reservation_job: { Args: { p_operation_key: string; p_reservation_id: string; p_labor_charge?: number; p_other_charge?: number; p_notes?: string }; Returns: string };
      cancel_reservation_job: { Args: { p_operation_key: string; p_reservation_id: string; p_customer_charge?: number; p_reason?: string; p_notes?: string }; Returns: string };
      add_reservation_material: { Args: { p_reservation_id: string; p_product_id: string; p_quantity: number; p_unit_cost: number; p_adjustment_type?: string; p_adjustment_percent?: number; p_notes?: string }; Returns: string };
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
