/**
 * Domain entity: Authenticated user (client or staff).
 */
export type UserRole = 'admin' | 'support' | 'sales' | 'client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
