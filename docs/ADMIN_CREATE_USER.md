# Admin create user (Edge Function)

Permite crear cuentas staff desde **BO → Usuarios** sin exponer la service role en el cliente.

## Deploy

```bash
supabase login
supabase link --project-ref <tu-project-ref>
supabase functions deploy admin-create-user
```

Variables automáticas en Supabase Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

JWT verification: **dejar habilitado** (solo admins con sesión válida).

## Seguridad

1. Valida el Bearer JWT del caller.
2. Comprueba `profiles.role = 'admin'` y `is_active`.
3. Crea el usuario con **service role**.
4. Upsert en `profiles` + grants opcionales en `user_permissions`.

## Body

```json
{
  "email": "operador@solux.example",
  "password": "minimo8chars",
  "fullName": "Nombre Apellido",
  "phone": "+53…",
  "role": "sales",
  "isActive": true,
  "permissions": [
    { "featureKey": "messages", "canRead": true, "canWrite": true, "expiresAt": null }
  ]
}
```

## Cliente

El BO llama con `supabase.functions.invoke('admin-create-user', { body })` usando la sesión del admin logueado.
