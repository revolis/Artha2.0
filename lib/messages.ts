"use client"

// Sending a contact or feedback message, and deleting an account.
//
// Both are edge functions rather than plain table writes, because both need
// something the browser must not hold: deleting a user needs the service role
// key, and emailing a message needs the mail provider's key. Neither belongs
// in a bundle anyone can read.

import { createClient } from "@/lib/supabase/client"

export type MessageSource = "contact" | "feedback"

export interface MessageDraft {
  source: MessageSource
  topic: string
  replyTo: string
  subject?: string
  body: string
}

export interface MessageResult {
  /** Always true on success — the message is recorded either way. */
  saved: true
  /** Whether it also reached an inbox. False if mail is not configured yet. */
  emailed: boolean
}

/** Stores a message and emails it on. Throws with a readable reason. */
export async function sendMessage(draft: MessageDraft): Promise<MessageResult> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke("send-message", {
    body: draft,
  })

  if (error) {
    // The function replies with a readable message in the body; the client
    // only reports "non-2xx", so the useful half has to be dug out of it.
    const detail = await readFunctionError(error)
    throw new Error(detail ?? "Could not send that. Try again in a moment.")
  }
  if (data?.error) throw new Error(String(data.error))

  return { saved: true, emailed: Boolean(data?.emailed) }
}

/**
 * Deletes the signed-in account and everything in it.
 *
 * The function works out who is asking from their own token, so there is no
 * account this can be pointed at except the caller's own.
 */
export async function deleteAccount(): Promise<void> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke("delete-account", {
    body: {},
  })

  if (error) {
    const detail = await readFunctionError(error)
    throw new Error(detail ?? "Could not delete the account. Try again.")
  }
  if (data?.error) throw new Error(String(data.error))
}

/** Pulls the message out of a FunctionsHttpError, which hides it in a Response. */
async function readFunctionError(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown }).context
  if (context instanceof Response) {
    try {
      const body = await context.json()
      if (body?.error) return String(body.error)
    } catch {
      // Not JSON — fall through to the generic message.
    }
  }
  return error instanceof Error ? error.message : null
}
