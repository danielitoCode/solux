/**
 * Domain entity: Customer who books a reservation.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: string; // ISO date
}
