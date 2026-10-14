# SOLUX — Setup Supabase (paso a paso)

Clientes **no** se autentican. Solo staff (`admin` | `support` | `sales`).
Seguimiento público por `tracking_code` (reservas y tickets).

---

## 1. Crear proyecto

1. Entra a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project**
3. Nombre: `solux` (o el que quieras)
4. Región cercana
5. Guarda la **database password**
6. Espera a que el proyecto esté listo

---

## 2. Obtener keys

1. Settings → **API**
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. En el repo local crea `.env`:

```env
VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## 3. Ejecutar migraciones SQL

En el dashboard: **SQL Editor** → New query.

### 3.1 Schema

Copia y ejecuta el contenido completo de:

`supabase/migrations/001_initial_schema.sql`

→ Run

### 3.2 RLS + RPCs de tracking

Copia y ejecuta:

`supabase/migrations/002_rls_policies.sql`

→ Run

### 3.3 Seed (opcional, datos de demo)

Copia y ejecuta:

`supabase/migrations/003_seed.sql`

→ Run

---

## 4. Auth — solo staff

1. Authentication → **Providers** → Email → habilitado
2. **Desactiva** “Enable email confirmations” en dev (o confirma mails a mano)
3. Authentication → **Users** → **Add user**

Crea al menos un admin:

| Campo | Valor |
|-------|--------|
| Email | `admin@solux.cu` |
| Password | (seguro) |
| Auto Confirm User | ✅ |

4. Tras crear el user, el trigger `on_auth_user_created` inserta en `profiles` con rol default `support`.

5. **Subir a admin** — SQL Editor:

```sql
update public.profiles
set role = 'admin', full_name = 'Admin SOLUX'
where email = 'admin@solux.cu';
```

Repite Add user + update role para `support` y `sales` si hace falta:

```sql
update public.profiles set role = 'support' where email = 'support@solux.cu';
update public.profiles set role = 'sales' where email = 'sales@solux.cu';
```

**Importante:** no crees usuarios “cliente”. El público no usa Auth.

---

## 5. Verificar RLS

SQL Editor:

```sql
-- Debe devolver filas (lectura pública catálogo)
select name, type, price from public.catalog_items where is_active = true;

-- RPC tracking (simula cliente)
select * from public.get_reservation_by_tracking('SLX-NOEXISTE');
```

---

## 6. App local

```bash
npm install
npm run dev
```

Login staff: `/backoffice/login` (cuando se implemente la vista) con el email/password del paso 4.

---

## 7. Flujo cliente (sin cuenta)

1. Cliente envía reserva desde `/reservas` → insert en `reservations`
2. Trigger genera `tracking_code` tipo `SLX-A1B2C3D4`
3. Se muestra el código al cliente (email/UI)
4. Cliente consulta estado con el código → RPC `get_reservation_by_tracking`
5. Igual para tickets de soporte

---

## 8. Roles y permisos (resumen)

| Recurso | Público (anon) | sales | support | admin |
|---------|----------------|-------|---------|-------|
| Catálogo lectura | ✅ activos | ✅ | ✅ | ✅ |
| Catálogo escritura | ❌ | ✅ | ❌ | ✅ |
| Reservas crear | ✅ | ✅ | ✅ | ✅ |
| Reservas gestionar | ❌ | ✅ | ❌ | ✅ |
| Tickets crear | ✅ | ✅ | ✅ | ✅ |
| Tickets gestionar | ❌ | ❌ | ✅ | ✅ |
| Mensajes contacto | insert | read/update | read/update | full |
| Presentación (textos/fotos) | read | ❌ | ❌ | ✅ |
| Profiles | ❌ | ❌ | ❌ | ✅ |

---

## 9. Regenerar tipos TS (opcional)

```bash
npx supabase login
npx supabase gen types typescript --project-id <PROJECT_REF> > src/infrastructure/data/database.types.ts
```

---

## Archivos SQL en el repo

```
supabase/migrations/
  001_initial_schema.sql   # tablas, enums, triggers, tracking codes
  002_rls_policies.sql     # RLS + RPCs públicas
  003_seed.sql             # datos demo
```
