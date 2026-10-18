/**
 * Domain entity: Business operating hours.
 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface BusinessHours {
  day: DayOfWeek;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  isClosed: boolean;
}
