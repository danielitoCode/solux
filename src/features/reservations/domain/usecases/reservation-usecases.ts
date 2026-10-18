import type { Reservation } from '../entities';
import type {
  CreateReservationInput,
  ReservationRepository
} from '../repository/reservation-repository';

export class CreateReservation {
  constructor(private readonly repository: ReservationRepository) {}

  execute(input: CreateReservationInput): Promise<Reservation> {
    return this.repository.create(input);
  }
}

export class GetReservationByTrackingCode {
  constructor(private readonly repository: ReservationRepository) {}

  execute(code: string): Promise<Reservation | null> {
    return this.repository.getByTrackingCode(code);
  }
}

export class ListReservations {
  constructor(private readonly repository: ReservationRepository) {}

  execute(): Promise<Reservation[]> {
    return this.repository.listAll();
  }
}

export class UpdateReservationStatus {
  constructor(private readonly repository: ReservationRepository) {}

  execute(id: string, status: Reservation['status']): Promise<Reservation> {
    return this.repository.updateStatus(id, status);
  }
}
