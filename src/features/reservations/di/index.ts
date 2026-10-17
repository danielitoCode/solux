import { ReservationRepositoryImpl } from '../data/repository/reservation-repository-impl';
import type { ReservationRepository } from '../domain/repository/reservation-repository';

let repo: ReservationRepository | null = null;

export function getReservationRepository(): ReservationRepository {
  if (!repo) repo = new ReservationRepositoryImpl();
  return repo;
}

import { ReservationWorkRepositoryImpl } from '../data/repository/reservation-work-repository-impl';
import {
  AddReservationMaterial,
  CloseReservationJob,
  GetReservationCloseoutData,
  GetReservationMaterialsData,
  RemoveReservationMaterial
} from '../domain/usecases/reservation-work-usecases';

const workRepository = new ReservationWorkRepositoryImpl();

export const reservationWorkUseCases = {
  getMaterialsData: new GetReservationMaterialsData(workRepository),
  addMaterial: new AddReservationMaterial(workRepository),
  removeMaterial: new RemoveReservationMaterial(workRepository),
  getCloseoutData: new GetReservationCloseoutData(workRepository),
  closeJob: new CloseReservationJob(workRepository)
};
