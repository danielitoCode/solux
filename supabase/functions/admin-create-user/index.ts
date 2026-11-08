// SOLUX — crear usuario staff desde backoffice (solo admin)
// Deploy:
//   supabase functions deploy admin-create-user
// Secrets (automáticos en Supabase): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//
// Body JSON:
// {
//   email, password, fullName, phone?, role: 'admin'|'support'|'sales',
//   isActive?: boolean,
//   permissions?: { featureKey, canRead, canWrite, expiresAt? }[]
// }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type UserRole = "admin" | "support" | "sales";

type PermissionInput = {
  featureKey: string;
  canRead?: boolean;
  canWrite?: boolean;
  expiresAt?: string | null;
};

type CreateBody = {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string | null;
  role?: UserRole;
  isActive?: boolean;
  permissions?: PermissionInput[];
};

const VALID_ROLES = new Set<UserRole>(["admin", "support", "sales"]);

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, { error: "Missing Supabase environment variables" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json(401, { error: "Missing authorization" });
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (callerError || !caller) {
    return json(401, { error: "Invalid session" });
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", caller.id)
    .maybeSingle();

  if (profileError || !callerProfile?.is_active || callerProfile.role !== "admin") {
    return json(403, { error: "Solo administradores pueden crear usuarios" });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return json(400, { error: "JSON inválido" });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = (body.fullName ?? "").trim();
  const phone = (body.phone ?? "").trim() || null;
  const role = body.role ?? "support";
  const isActive = body.isActive !== false;

  if (!email || !email.includes("@")) {
    return json(400, { error: "Email inválido" });
  }
  if (password.length < 8) {
    return json(400, { error: "La contraseña debe tener al menos 8 caracteres" });
  }
  if (!fullName) {
    return json(400, { error: "El nombre es obligatorio" });
  }
  if (!VALID_ROLES.has(role)) {
    return json(400, { error: "Rol inválido" });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  if (createError || !created.user) {
    const msg = createError?.message ?? "No se pudo crear el usuario";
    // Mensaje más claro si el email ya existe
    if (/already|exists|registered/i.test(msg)) {
      return json(409, { error: "Ya existe un usuario con ese correo" });
    }
    return json(400, { error: msg });
  }

  const userId = created.user.id;

  // Asegura perfil (trigger puede haber insertado defaults)
  const { error: upsertError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      phone,
      role,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    // Intento de limpieza: el auth user quedó creado
    return json(500, {
      error: `Usuario Auth creado pero falló el perfil: ${upsertError.message}`,
      userId,
    });
  }

  // Grants opcionales (solo si no es admin)
  const permissions = Array.isArray(body.permissions) ? body.permissions : [];
  if (role !== "admin" && permissions.length > 0) {
    const nowIso = new Date().toISOString();
    const rows = permissions
      .filter((p) => p && typeof p.featureKey === "string" && p.featureKey.length > 0)
      .map((p) => ({
        user_id: userId,
        feature_key: p.featureKey,
        can_read: Boolean(p.canRead || p.canWrite),
        can_write: Boolean(p.canWrite),
        granted_by: caller.id,
        granted_at: nowIso,
        expires_at: p.expiresAt ?? null,
        revoked_at: null,
      }));

    if (rows.length) {
      const { error: permError } = await admin
        .from("user_permissions")
        .upsert(rows, { onConflict: "user_id,feature_key" });
      if (permError) {
        return json(207, {
          warning: `Usuario creado; permisos parciales: ${permError.message}`,
          userId,
          email,
        });
      }
    }
  }

  return json(201, {
    userId,
    email,
    fullName,
    role,
    isActive,
  });
});
