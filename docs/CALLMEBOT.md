# Notificaciones WhatsApp (CallMeBot) — Edge Function

Función: `supabase/functions/notify-whatsapp`

Envía un WhatsApp **al número del negocio / admin** cuando hay eventos en SOLUX (reservas, tickets, contacto, etc.).

## 1. Activar CallMeBot

1. En [callmebot.com](https://www.callmebot.com/blog/free-api-whatsapp-messages/) mira el número actual del bot.
2. Agrégalo a contactos y envía por WhatsApp: `I allow callmebot to send me messages`
3. Recibirás un mensaje con tu **APIKEY**.

> Solo llega al número que activó el apikey (notificación interna, no al cliente).

## 2. Secrets en Supabase

Dashboard → **Edge Functions** → Secrets (o CLI):

```bash
supabase secrets set CALLMEBOT_PHONE="+53XXXXXXXXX"
supabase secrets set CALLMEBOT_APIKEY="tu_apikey"
# Recomendado: evita spam público
supabase secrets set NOTIFY_WEBHOOK_SECRET="un-secreto-largo"
```

## 3. Deploy

```bash
# Desde la raíz del repo
supabase login
supabase link --project-ref TU_PROJECT_REF

supabase functions deploy notify-whatsapp --no-verify-jwt
```

`--no-verify-jwt` permite invocarla desde webhooks/DB o el front con el header secreto.  
Si solo la llama código autenticado con JWT de Supabase, puedes omitir ese flag.

## 4. Invocación

**URL:**

```text
https://<PROJECT_REF>.supabase.co/functions/v1/notify-whatsapp
```

**Headers:**

```http
Content-Type: application/json
x-notify-secret: <NOTIFY_WEBHOOK_SECRET>
```

**Body — reserva:**

```json
{
  "type": "reservation",
  "payload": {
    "trackingCode": "SLX-A1B2C3D4",
    "customerName": "Juan Pérez",
    "phone": "+53…",
    "serviceCategory": "Kit solar",
    "preferredDate": "2026-11-02",
    "notes": "Instalación en techo"
  }
}
```

**Body — ticket:**

```json
{
  "type": "ticket",
  "payload": {
    "trackingCode": "TKT-…",
    "customerName": "María",
    "subject": "Inversor no enciende",
    "status": "open",
    "description": "…"
  }
}
```

**Body — contacto:**

```json
{
  "type": "contact",
  "payload": {
    "name": "Pedro",
    "email": "a@b.com",
    "phone": "+53…",
    "subject": "Consulta",
    "message": "…"
  }
}
```

**Body — texto libre:**

```json
{
  "type": "custom",
  "text": "*SOLUX* — Prueba de notificación"
}
```

## 5. Probar con curl

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/notify-whatsapp" \
  -H "Content-Type: application/json" \
  -H "x-notify-secret: TU_SECRETO" \
  -d '{"type":"custom","text":"Prueba SOLUX WhatsApp"}'
```

## 6. Integración en la app

Tras crear reserva / ticket / mensaje:

1. Llamar a esta function (Edge, webhook o backend).
2. **No** expongas `CALLMEBOT_APIKEY` en variables `VITE_*` del front.

## Límites CallMeBot

- Uso personal / bajo volumen.
- Solo al número asociado al apikey.
- Puede haber cola o pausas (`resume` al bot si pausan la cuenta).
