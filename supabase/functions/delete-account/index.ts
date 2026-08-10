// Deletes the signed-in user's account, and everything attached to it.
//
// This lives on a server because it cannot live anywhere else: removing a user
// needs the service role key, and a key that can delete any account must never
// be sent to a browser. The function only ever deletes the caller — the id
// comes from their own verified token, never from the request body, so there
// is no account to name but your own.
//
// Rows go by themselves: every table references auth.users with ON DELETE
// CASCADE. Storage objects do not, so they are removed first, while there is
// still a user to attribute them to.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const BUCKETS = ["entry-attachments", "avatars"]

/**
 * The account the landing page signs visitors into.
 *
 * Anyone can reach it without signing up, so anyone could otherwise press
 * Delete everything in the Danger zone and take the demo down for good. It is
 * the one account that must survive being poked at by strangers.
 */
const DEMO_USER = "d3300000-0000-4000-8000-000000000001"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST") return json({ error: "Use POST." }, 405)

  const url = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const authHeader = req.headers.get("Authorization") ?? ""

  // Who is asking. Checked against the auth server rather than trusted from
  // the token's contents, so an edited token gets nowhere.
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: caller, error: whoError } = await asCaller.auth.getUser()
  const userId = caller?.user?.id
  if (whoError || !userId) return json({ error: "Not signed in." }, 401)

  if (userId === DEMO_USER) {
    return json(
      {
        error:
          "The demo account cannot be deleted. Sign up for one of your own.",
      },
      403
    )
  }

  const admin = createClient(url, serviceKey)

  // Files first. Once the user is gone the folder name is all that is left to
  // find them by, and nothing would be looking.
  for (const bucket of BUCKETS) {
    const { data: files } = await admin.storage.from(bucket).list(userId)
    const paths = (files ?? []).map((file) => `${userId}/${file.name}`)
    if (paths.length > 0) await admin.storage.from(bucket).remove(paths)
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return json({ error: error.message }, 500)

  return json({ deleted: true })
})
