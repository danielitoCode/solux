// Supabase Edge Function: notificaciones WhatsApp vía CallMeBot
// Deploy: supabase functions deploy notify-whatsapp --no-verify-jwt
// Secrets: CALLMEBOT_PHONE, CALLMEBOT_APIKEY, NOTIFY_WEBHOOK_SECRET (opcional)

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
  /** Texto libre si type === 'custom' */
  text?: string;
  payload?: Record<string, unknown>;
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function formatMessage(body: NotifyBody): string {
  const p = body.payload ?? {};

  switch (body.type) {
    case "reservation":
      return [
        "*SOLUX — Nueva reserva*",
        `Código: ${str(p.trackingCode ?? p.tracking_code)}`,
        `Cliente: ${str(p.customerName ?? p.customer_name)}`,
        `Teléfono: ${str(p.phone ?? p.customer_phone)}`,
        `Servicio: ${str(p.serviceCategory ?? p.service_category)}`,
        `Fecha preferida: ${str(p.preferredDate ?? p.preferred_date)}`,
        p.notes || p.message
          ? `Notas: ${str(p.notes ?? p.message)}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

    case "ticket":
      return [
        "*SOLUX — Ticket de soporte*",
        `Código: ${str(p.trackingCode ?? p.tracking_code)}`,
        `Cliente: ${str(p.customerName ?? p.customer_name)}`,
        `Asunto: ${str(p.subject ?? p.title)}`,
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed. Use POST." });
  }

  const webhookSecret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  if (webhookSecret) {
    const provided = req.headers.get("x-notify-secret");
    if (provided !== webhookSecret) {
      return json(401, { error: "Unauthorized" });
    }
  }

  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return json(400, { error: "JSON inválido" });
  }

  if (!body?.type) {
    return json(400, {
      error: "Campo 'type' requerido",
      allowed: ["reservation", "ticket", "contact", "catalog", "custom"],
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
