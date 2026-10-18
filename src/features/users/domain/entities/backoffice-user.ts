import type { UserRole } from '$features/auth/domain/entities';

export type BackofficeUser = { id: string; email: string; fullName: string; phone: string | null; role: UserRole; isActive: boolean; createdAt: string; updatedAt: string };
