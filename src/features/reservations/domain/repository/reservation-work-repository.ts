export interface ReservationWorkRepository {
  getMaterialsProducts(): Promise<unknown[]>;
  getReservationMaterials(reservationId: string): Promise<unknown[]>;
  getReservationTrackingCode(reservationId: string): Promise<string>;
  addMaterial(input: { reservationId: string; productId: string; quantity: number; unitCost: number; adjustmentType: string; adjustmentPercent: number; notes: string }): Promise<void>;
  removeMaterial(id: string): Promise<void>;
  getCloseoutData(reservationId: string): Promise<{ materials: unknown[]; labor: unknown[]; closeout: unknown | null }>;
  closeJob(input: { reservationId: string; laborCharge: number; otherCharge: number; notes: string; operationKey: string }): Promise<void>;
  cancelJob(input: { reservationId: string; customerCharge: number; reason: string; notes: string; operationKey: string }): Promise<string>;
}
