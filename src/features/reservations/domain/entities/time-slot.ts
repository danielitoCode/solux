/**
 * Domain entity: Available time slot for reservations.
 */
export interface TimeSlot {
  id: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  maxCapacity: number;
  currentBookings: number;
}
