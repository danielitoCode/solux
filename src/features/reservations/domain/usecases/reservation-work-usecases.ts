import type { ReservationWorkRepository } from '../repository/reservation-work-repository';

export class GetReservationMaterialsData {
  constructor(private readonly repository: ReservationWorkRepository) {}
  execute(reservationId: string) {
    return Promise.all([
      this.repository.getMaterialsProducts(),
      this.repository.getReservationMaterials(reservationId),
      this.repository.getReservationTrackingCode(reservationId)
    ]);
  }
}
export class AddReservationMaterial {
  constructor(private readonly repository: ReservationWorkRepository) {}
  execute(input: Parameters<ReservationWorkRepository['addMaterial']>[0]) { return this.repository.addMaterial(input); }
}
export class RemoveReservationMaterial {
  constructor(private readonly repository: ReservationWorkRepository) {}
  execute(id: string) { return this.repository.removeMaterial(id); }
}
export class GetReservationCloseoutData {
  constructor(private readonly repository: ReservationWorkRepository) {}
  execute(reservationId: string) { return this.repository.getCloseoutData(reservationId); }
}
export class CloseReservationJob {
  constructor(private readonly repository: ReservationWorkRepository) {}
  execute(input: Parameters<ReservationWorkRepository['closeJob']>[0]) { return this.repository.closeJob(input); }
}
