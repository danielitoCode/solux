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
    Functions: {
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
