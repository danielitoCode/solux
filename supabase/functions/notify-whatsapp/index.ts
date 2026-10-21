// Supabase Edge Function: notificaciones WhatsApp vía CallMeBot
// Deploy: supabase functions deploy notify-whatsapp --no-verify-jwt
// Secrets: CALLMEBOT_PHONE, CALLMEBOT_APIKEY, NOTIFY_WEBHOOK_SECRET (opcional)
// Acepta:
//   A) { type, payload } manual
//   B) Database Webhook: { type: "INSERT", table, record }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";

type NotifyType =
  | "reservation"
  | "ticket"
  | "contact"
  | "catalog"
  | "custom";

interface NotifyBody {
  type: NotifyType;
  text?: string;
  payload?: Record<string, unknown>;
}

/** Payload estándar de Database Webhooks (Supabase) */
interface DbWebhookBody {
  type?: string; // INSERT | UPDATE | DELETE
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TABLE_TO_TYPE: Record<string, NotifyType> = {
  reservations: "reservation",
  support_tickets: "ticket",
  contact_messages: "contact",
  catalog_items: "catalog",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function str(v: unknown, fallback = "—"): string {
  if (v == null || v === "") return fallback;
  return String(v);
}

function normalizeBody(raw: Record<string, unknown>): NotifyBody | null {
  // A) Formato manual: { type: "reservation", payload: {...} }
  const manualType = raw.type as string | undefined;
  if (
    manualType &&
    ["reservation", "ticket", "contact", "catalog", "custom"].includes(manualType)
  ) {
    return {
      type: manualType as NotifyType,
      text: typeof raw.text === "string" ? raw.text : undefined,
      payload: (raw.payload as Record<string, unknown>) ?? {},
    };
  }

  // B) Database Webhook Supabase
  const table = raw.table as string | undefined;
  const event = (raw.type as string | undefined)?.toUpperCase();
  const record = (raw.record ?? null) as Record<string, unknown> | null;

  if (!table || !record) return null;
  // Solo INSERT (formulario completado). Evita spam en cada UPDATE de estado.
  if (event && event !== "INSERT") return null;

  const notifyType = TABLE_TO_TYPE[table];
  if (!notifyType) return null;

  return {
    type: notifyType,
    payload: {
      ...record,
      // ayuda a plantillas catalog
      action: event === "INSERT" ? "nuevo" : event,
    },
  };
}

function formatMessage(body: NotifyBody): string {
  const p = body.payload ?? {};

  switch (body.type) {
    case "reservation":
      return [
        "*SOLUX — Nueva reserva / montaje*",
        `Código: ${str(p.trackingCode ?? p.tracking_code)}`,
        `Cliente: ${str(p.customerName ?? p.customer_name)}`,
        `Email: ${str(p.customer_email ?? p.email)}`,
        `Teléfono: ${str(p.phone ?? p.customer_phone)}`,
        `Servicio: ${str(p.serviceCategory ?? p.service_category)}`,
        `Fecha preferida: ${str(p.preferredDate ?? p.preferred_date)}`,
        `Horario: ${str(p.preferred_time_slot)}`,
        p.address ? `Dirección: ${str(p.address)}` : null,
        p.notes || p.message ? `Notas: ${str(p.notes ?? p.message)}` : null,
      ]
        .filter(Boolean)
        .join("\n");

    case "ticket":
      return [
        "*SOLUX — Ticket de soporte*",
        `Código: ${str(p.trackingCode ?? p.tracking_code)}`,
        `Cliente: ${str(p.customerName ?? p.customer_name)}`,
        `Email: ${str(p.customer_email ?? p.email)}`,
        `Teléfono: ${str(p.phone ?? p.customer_phone)}`,
        `Asunto: ${str(p.subject ?? p.title)}`,
        `Prioridad: ${str(p.priority)}`,
        `Estado: ${str(p.status)}`,
        p.description || p.message
          ? `Detalle: ${str(p.description ?? p.message)}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

    case "contact":
      return [
        "*SOLUX — Mensaje de contacto*",
        `Nombre: ${str(p.name ?? p.full_name)}`,
        `Email: ${str(p.email)}`,
        `Teléfono: ${str(p.phone)}`,
        `Asunto: ${str(p.subject)}`,
        p.message || p.body ? `Mensaje: ${str(p.message ?? p.body)}` : null,
      ]
        .filter(Boolean)
        .join("\n");

    case "catalog":
      return [
        "*SOLUX — Catálogo*",
        `Acción: ${str(p.action ?? "actualización")}`,
        `Item: ${str(p.name ?? p.title)}`,
        p.type ? `Tipo: ${str(p.type)}` : null,
        p.id ? `Id: ${str(p.id)}` : null,
      ]
        .filter(Boolean)
        .join("\n");

    case "custom":
      return (body.text ?? str(p.text)).trim() || "SOLUX — Notificación";

    default:
      return body.text?.trim() || `SOLUX — Evento: ${body.type}`;
  }
}

async function sendWhatsApp(text: string): Promise<{ ok: boolean; detail: string }> {
  const phone = Deno.env.get("CALLMEBOT_PHONE");
  const apikey = Deno.env.get("CALLMEBOT_APIKEY");

  if (!phone || !apikey) {
    return {
      ok: false,
      detail: "Faltan CALLMEBOT_PHONE o CALLMEBOT_APIKEY en secrets de la function",
    };
  }

  const url = new URL(CALLMEBOT_URL);
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apikey);

  const res = await fetch(url.toString(), { method: "GET" });
  const detail = await res.text();

  const ok =
    res.ok &&
    (/queued|message to:/i.test(detail) || detail.length < 500);

  return { ok, detail: detail.slice(0, 500) };
}

function isAuthorized(req: Request): boolean {
  const webhookSecret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  if (!webhookSecret) return true;

  const headerSecret = req.headers.get("x-notify-secret");
  if (headerSecret === webhookSecret) return true;

  // Algunos webhooks mandan el secreto como Bearer
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${webhookSecret}`) return true;

  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed. Use POST." });
  }

  if (!isAuthorized(req)) {
    return json(401, { error: "Unauthorized" });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: "JSON inválido" });
  }

  const body = normalizeBody(raw);

  // UPDATE/DELETE u otra tabla: ignorar en silencio (200) para no reintentar el webhook
  if (!body) {
    return json(200, {
      ok: true,
      skipped: true,
      reason: "Evento no notifiable (solo INSERT en tablas conocidas o body manual)",
    });
  }

  const message = formatMessage(body);
  if (!message.trim()) {
    return json(400, { error: "Mensaje vacío" });
  }

  try {
    const result = await sendWhatsApp(message);
    if (!result.ok) {
      console.error("[notify-whatsapp] CallMeBot error", result.detail);
      return json(502, {
        error: "No se pudo enviar el WhatsApp",
        detail: result.detail,
      });
    }

    return json(200, {
      ok: true,
      type: body.type,
      preview: message.slice(0, 200),
      provider: "callmebot",
      detail: result.detail,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notify-whatsapp]", msg);
    return json(500, { error: msg });
  }
});
