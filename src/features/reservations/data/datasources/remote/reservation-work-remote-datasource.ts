import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';

export class ReservationWorkRemoteDataSource {
  async getMaterialsProducts(): Promise<unknown[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('consumable_products')
      .select('id,name,sku,category,unit,default_cost,default_markup_percent,is_active')
      .eq('is_active', true).order('name');
    if (error) throw error;
    return data ?? [];
  }
  async getReservationMaterials(reservationId: string): Promise<unknown[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('reservation_materials')
      .select('*').eq('reservation_id', reservationId).order('created_at');
    if (error) throw error;
    return data ?? [];
  }
  async getReservationTrackingCode(reservationId: string): Promise<string> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('reservations')
      .select('tracking_code').eq('id', reservationId).maybeSingle();
    if (error) throw error;
    return data?.tracking_code ?? '';
  }
  async addMaterial(input: { reservationId: string; productId: string; quantity: number; unitCost: number; adjustmentType: string; adjustmentPercent: number; notes: string }): Promise<void> {
    assertSupabaseConfigured();
    const { error } = await supabase.rpc('add_reservation_material', {
      p_reservation_id: input.reservationId, p_product_id: input.productId,
      p_quantity: input.quantity, p_unit_cost: input.unitCost,
      p_adjustment_type: input.adjustmentType, p_adjustment_percent: input.adjustmentPercent,
      p_notes: input.notes
    });
    if (error) throw error;
  }
  async removeMaterial(id: string): Promise<void> {
    assertSupabaseConfigured();
    const { error } = await supabase.from('reservation_materials').delete().eq('id', id);
    if (error) throw error;
  }
  async getCloseoutData(reservationId: string) {
    assertSupabaseConfigured();
    const [m,l,c] = await Promise.all([
      supabase.from('reservation_materials').select('product_name,unit,quantity,unit_cost,adjustment_type,adjustment_percent,notes').eq('reservation_id', reservationId),
      supabase.from('job_labor').select('role_description,hours,agreed_amount,status').eq('reservation_id', reservationId),
      supabase.from('job_closeouts').select('id,material_cost,materials_charge,labor_cost,labor_charge,other_charge,total_charge,estimated_margin,notes,closed_at').eq('reservation_id', reservationId).maybeSingle()
    ]);
    if (m.error) throw m.error;
    if (l.error) throw l.error;
    if (c.error) throw c.error;
    return { materials: m.data ?? [], labor: l.data ?? [], closeout: c.data ?? null };
  }
  async closeJob(input: { reservationId: string; laborCharge: number; otherCharge: number; notes: string; operationKey: string }): Promise<void> {
    assertSupabaseConfigured();
    const { error } = await supabase.rpc('close_reservation_job', {
      p_operation_key: input.operationKey, p_reservation_id: input.reservationId,
      p_labor_charge: input.laborCharge, p_other_charge: input.otherCharge, p_notes: input.notes
    });
    if (error) throw error;
  }
}
