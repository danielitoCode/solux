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

  const table = raw.table as string | undefined;
  const event = (raw.type as string | undefined)?.toUpperCase();
  const record = (raw.record ?? null) as Record<string, unknown> | null;

  if (!table || !record) return null;
  if (event && event !== "INSERT") return null;

  const notifyType = TABLE_TO_TYPE[table];
  if (!notifyType) return null;

  return {
    type: notifyType,
    payload: {
      ...record,
      action: event === "INSERT" ? "nuevo" : event,
    },
  };
}

function brandHeader(kind: string, title: string): string {
  // WhatsApp: *bold* _italic_ — CallMeBot free no envía imágenes del logo
  return [
    "🌿 *SOLUX*",
    `┌────────────────`,
    `│ ${kind}`,
    `│ *${title}*`,
    `└────────────────`,
  ].join("\n");
}

function line(label: string, value: unknown, skipEmpty = true): string | null {
  const v = str(value, "");
  if (skipEmpty && (!v || v === "—")) return null;
  return `• *${label}:* ${v || "—"}`;
}

function formatMessage(body: NotifyBody): string {
  const p = body.payload ?? {};
  const footer = "\n_Notificación automática SOLUX_";

  switch (body.type) {
    case "reservation":
      return [
        brandHeader("📅 RESERVA", "Nueva solicitud de visita"),
        "",
        line("Código", p.trackingCode ?? p.tracking_code, false),
        line("Cliente", p.customerName ?? p.customer_name),
        line("Email", p.customer_email ?? p.email),
        line("Teléfono", p.phone ?? p.customer_phone),
        line("Servicio", p.serviceCategory ?? p.service_category),
        line("Fecha", p.preferredDate ?? p.preferred_date),
        line("Horario", p.preferred_time_slot),
        line("Dirección", p.address),
        line("Notas", p.notes ?? p.message),
        footer,
      ]
        .filter((x) => x !== null)
        .join("\n");

    case "ticket":
      return [
        brandHeader("🛠️ SOPORTE", "Nuevo ticket técnico"),
        "",
        line("Código", p.trackingCode ?? p.tracking_code, false),
        line("Cliente", p.customerName ?? p.customer_name),
        line("Email", p.customer_email ?? p.email),
        line("Teléfono", p.phone ?? p.customer_phone),
        line("Asunto", p.subject ?? p.title),
        line("Prioridad", p.priority),
        line("Estado", p.status),
        line("Detalle", p.description ?? p.message),
        footer,
      ]
        .filter((x) => x !== null)
        .join("\n");

    case "contact":
      return [
        brandHeader("💬 CONTACTO", "Nuevo mensaje del sitio"),
        "",
        line("Nombre", p.name ?? p.full_name),
        line("Email", p.email),
        line("Teléfono", p.phone),
        line("Asunto", p.subject),
        line("Mensaje", p.message ?? p.body),
        footer,
      ]
        .filter((x) => x !== null)
        .join("\n");

    case "catalog":
      return [
        brandHeader("🛒 CATÁLOGO", "Cambio en productos / servicios"),
        "",
        line("Acción", p.action ?? "actualización"),
        line("Item", p.name ?? p.title),
        line("Tipo", p.type),
        line("Id", p.id),
        footer,
      ]
        .filter((x) => x !== null)
        .join("\n");

    case "custom": {
      const bodyText = (body.text ?? str(p.text)).trim() || "Notificación";
      return [
        brandHeader("🔔 AVISO", "Mensaje personalizado"),
        "",
        bodyText,
        footer,
      ].join("\n");
    }

    default:
      return [
        brandHeader("🔔 AVISO", String(body.type)),
        "",
        body.text?.trim() || "Evento SOLUX",
        footer,
      ].join("\n");
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
      preview: message.slice(0, 280),
      provider: "callmebot",
      detail: result.detail,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notify-whatsapp]", msg);
    return json(500, { error: msg });
  }
});
