import { ReservationRepositoryImpl } from '../data/repository/reservation-repository-impl';
import type { ReservationRepository } from '../domain/repository/reservation-repository';

let repo: ReservationRepository | null = null;

export function getReservationRepository(): ReservationRepository {
  if (!repo) repo = new ReservationRepositoryImpl();
  return repo;
}
