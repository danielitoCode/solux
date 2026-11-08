import { supabase, supabaseConfigured, assertSupabaseConfigured } from '$infrastructure/data/supabase-client';

export type TeamMember = {
  id: string;
  fullName: string;
  role: string;
  photoUrl: string;
  sortOrder: number;
  isActive: boolean;
};

type TeamMemberRow = {
  id: string;
  full_name: string;
  role: string;
  photo_url: string;
  sort_order: number;
  is_active: boolean;
};

function mapRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role ?? '',
    photoUrl: row.photo_url ?? '',
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true
  };
}

// Tabla nueva; aún no está en database.types — acceso untyped.
const table = () => (supabase as any).from('team_members');

/** Público: solo activos, ordenados. */
export async function loadActiveTeamMembers(): Promise<TeamMember[]> {
  if (!supabaseConfigured) return [];

  const { data, error } = await table()
    .select('id, full_name, role, photo_url, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('No se pudo cargar el equipo:', error);
    return [];
  }
  return ((data ?? []) as TeamMemberRow[]).map(mapRow);
}

/** Admin: todos los miembros. */
export async function listTeamMembersAdmin(): Promise<TeamMember[]> {
  assertSupabaseConfigured();
  const { data, error } = await table()
    .select('id, full_name, role, photo_url, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message ?? 'No se pudo cargar el equipo.');
  return ((data ?? []) as TeamMemberRow[]).map(mapRow);
}

export async function createTeamMember(input: {
  fullName: string;
  role: string;
  photoUrl: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<TeamMember> {
  assertSupabaseConfigured();
  const { data, error } = await table()
    .insert({
      full_name: input.fullName.trim(),
      role: input.role.trim(),
      photo_url: input.photoUrl.trim(),
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true
    })
    .select('id, full_name, role, photo_url, sort_order, is_active')
    .single();

  if (error) throw new Error(error.message ?? 'No se pudo crear el miembro.');
  return mapRow(data as TeamMemberRow);
}

export async function updateTeamMember(
  id: string,
  input: Partial<{
    fullName: string;
    role: string;
    photoUrl: string;
    sortOrder: number;
    isActive: boolean;
  }>
): Promise<TeamMember> {
  assertSupabaseConfigured();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.fullName !== undefined) payload.full_name = input.fullName.trim();
  if (input.role !== undefined) payload.role = input.role.trim();
  if (input.photoUrl !== undefined) payload.photo_url = input.photoUrl.trim();
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;
  if (input.isActive !== undefined) payload.is_active = input.isActive;

  const { data, error } = await table()
    .update(payload)
    .eq('id', id)
    .select('id, full_name, role, photo_url, sort_order, is_active')
    .single();

  if (error) throw new Error(error.message ?? 'No se pudo actualizar el miembro.');
  return mapRow(data as TeamMemberRow);
}

export async function deleteTeamMember(id: string): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await table().delete().eq('id', id);
  if (error) throw new Error(error.message ?? 'No se pudo eliminar el miembro.');
}
