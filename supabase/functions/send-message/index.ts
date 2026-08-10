// Takes a contact or feedback message, stores it, and emails it on.
//
// Stored first, sent second, and the send is allowed to fail. Email providers
// have bad days; a message that only ever existed as an email is a message you
// can lose. The row is the record, emailed_at just says whether it also made
// it to an inbox.
//
// JWT verification is off because the contact form is on a public page and has
// to work for someone who has not signed in. That makes this the one endpoint
// strangers can reach, so it does its own checking: fields are bounded, the
// address has to look like an address, and there is a cap per sender and per
// address so it cannot be used as a mailer.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    // supabase-js sends x-client-info on every functions.invoke, and
    // newer versions add x-supabase-api-version. A header the browser
    // asks for and does not get back fails the preflight, and the POST
    // is then never sent — the request does not fail loudly, it simply
    // never happens.
    "authorization, content-type, apikey, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

const PER_HOUR_PER_ADDRESS = 5
const PER_HOUR_TOTAL = 60

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST") return json({ error: "Use POST." }, 405)

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: "Expected JSON." }, 400)
  }

  const source = String(payload.source ?? "")
  const topic = String(payload.topic ?? "").slice(0, 40)
  const replyTo = String(payload.replyTo ?? "")
    .trim()
    .slice(0, 200)
  const subject = String(payload.subject ?? "").slice(0, 200)
  const body = String(payload.body ?? "")
    .trim()
    .slice(0, 5000)

  if (source !== "contact" && source !== "feedback") {
    return json({ error: "Unknown form." }, 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
    return json({ error: "That doesn't look like an email address." }, 400)
  }
  if (body.length < 5) {
    return json({ error: "Add a little more detail." }, 400)
  }

  const url = Deno.env.get("SUPABASE_URL")!
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

  // If they happen to be signed in, record who — it saves asking who they are.
  let userId: string | null = null
  const authHeader = req.headers.get("Authorization") ?? ""
  if (authHeader.startsWith("Bearer ")) {
    const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data } = await asCaller.auth.getUser()
    userId = data?.user?.id ?? null
  }

  const anHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count: fromThisAddress } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("reply_to", replyTo)
    .gte("created_at", anHourAgo)

  if ((fromThisAddress ?? 0) >= PER_HOUR_PER_ADDRESS) {
    return json(
      { error: "That's a lot of messages. Try again in an hour." },
      429
    )
  }

  const { count: overall } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .gte("created_at", anHourAgo)

  if ((overall ?? 0) >= PER_HOUR_TOTAL) {
    return json(
      { error: "Too many messages right now. Try again shortly." },
      429
    )
  }

  const { data: saved, error: saveError } = await admin
    .from("messages")
    .insert({
      user_id: userId,
      source,
      topic: topic || "other",
      reply_to: replyTo,
      subject: subject || null,
      body,
    })
    .select("id")
    .single()

  if (saveError) return json({ error: saveError.message }, 500)

  // Everything past here is a bonus. The message is already safe.
  const resendKey = Deno.env.get("RESEND_API_KEY")
  if (!resendKey) return json({ saved: true, emailed: false })

  const from = Deno.env.get("MESSAGES_FROM") ?? "Artha <noreply@0xr8n.me>"
  const to = Deno.env.get("MESSAGES_TO") ?? "rabinacharya092@gmail.com"
  const heading = source === "feedback" ? "Feedback" : "Contact"

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject: `[Artha ${heading}] ${subject || topic || "New message"}`,
        html: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111">
<p style="margin:0 0 12px"><strong>${heading}</strong> &middot; ${escapeHtml(topic || "other")}</p>
<p style="margin:0 0 12px">From <a href="mailto:${escapeHtml(replyTo)}">${escapeHtml(replyTo)}</a>${userId ? " (signed in)" : " (not signed in)"}</p>
${subject ? `<p style="margin:0 0 12px"><strong>${escapeHtml(subject)}</strong></p>` : ""}
<div style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:12px;margin:0 0 16px">${escapeHtml(body)}</div>
<p style="margin:0;color:#888;font-size:12px">Reply to this email and it goes straight back to them.</p>
</div>`,
      }),
    })

    if (!res.ok) {
      return json({ saved: true, emailed: false, detail: await res.text() })
    }
  } catch (cause) {
    return json({ saved: true, emailed: false, detail: String(cause) })
  }

  await admin
    .from("messages")
    .update({ emailed_at: new Date().toISOString() })
    .eq("id", saved.id)

  return json({ saved: true, emailed: true })
})
