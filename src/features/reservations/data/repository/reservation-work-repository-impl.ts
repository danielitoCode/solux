import { ReservationWorkRemoteDataSource } from '../datasources/remote/reservation-work-remote-datasource';
import type { ReservationWorkRepository } from '../../domain/repository/reservation-work-repository';

export class ReservationWorkRepositoryImpl implements ReservationWorkRepository {
  constructor(private readonly remote = new ReservationWorkRemoteDataSource()) {}
  getMaterialsProducts() { return this.remote.getMaterialsProducts(); }
  getReservationMaterials(id: string) { return this.remote.getReservationMaterials(id); }
  getReservationTrackingCode(id: string) { return this.remote.getReservationTrackingCode(id); }
  addMaterial(input: Parameters<ReservationWorkRepository['addMaterial']>[0]) { return this.remote.addMaterial(input); }
  removeMaterial(id: string) { return this.remote.removeMaterial(id); }
  getCloseoutData(id: string) { return this.remote.getCloseoutData(id); }
  closeJob(input: Parameters<ReservationWorkRepository['closeJob']>[0]) { return this.remote.closeJob(input); }
}
