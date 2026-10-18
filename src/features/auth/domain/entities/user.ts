/** Staff only — clients do not authenticate */
export type UserRole = 'admin' | 'support' | 'sales';

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
