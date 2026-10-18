import type {
  CreateReservationInput,
  ReservationRepository
} from '../../domain/repository/reservation-repository';
import type { Reservation } from '../../domain/entities';
import { ReservationRemoteDataSource } from '../datasources/remote/reservation-remote-datasource';
import { mapReservationDto } from '../mappers/reservation.mapper';

export class ReservationRepositoryImpl implements ReservationRepository {
  constructor(private readonly remote = new ReservationRemoteDataSource()) {}

  async create(input: CreateReservationInput): Promise<Reservation> {
    const dto = await this.remote.create(input);
    return mapReservationDto(dto);
  }

  async getByTrackingCode(code: string): Promise<Reservation | null> {
    const dto = await this.remote.getByTrackingCode(code);
    return dto ? mapReservationDto(dto) : null;
  }

  async listAll(): Promise<Reservation[]> {
    const list = await this.remote.listAll();
    return list.map(mapReservationDto);
  }

  async updateStatus(id: string, status: Reservation['status']): Promise<Reservation> {
    const dto = await this.remote.updateStatus(id, status);
    return mapReservationDto(dto);
  }
}
