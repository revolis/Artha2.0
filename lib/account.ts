"use client"

// Changing the password and the email address on a signed-in account.
//
// These were design-phase stand-ins: the dialog made up a six-digit code,
// printed it on screen and compared it to itself. Nothing was sent and nothing
// was checked, so the verification step proved only that the person could read
// the page they were already looking at.
//
// The real versions hand both halves to Supabase. The code is generated and
// mailed by the auth server and verified there, which is the only place a
// check like this means anything.

import { createClient } from "@/lib/supabase/client"

function friendly(message: string): string {
  if (/rate limit|too many|after \d+ seconds/i.test(message)) {
    return "Too many attempts. Wait a minute and try again."
  }
  if (/nonce|token|otp/i.test(message) && /invalid|expired/i.test(message)) {
    return "That code is wrong or has expired. Send a new one."
  }
  if (/same.*password|should be different/i.test(message)) {
    return "That is already your password. Pick a different one."
  }
  if (/weak|pwned|leaked/i.test(message)) {
    return "That password has appeared in a data breach. Pick a different one."
  }
  if (/already been registered|already exists/i.test(message)) {
    return "An account already uses that email address."
  }
  return message
}

/** The address on the current session — where a code will be sent. */
async function currentEmail(): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email
  if (!email) throw new Error("Sign in again to change your password.")
  return email
}

/**
 * Mails a six-digit code to the address on the account.
 *
 * This is what replaces asking for the current password. Proving you can read
 * the account's email is a stronger claim than knowing a password that may
 * have been saved in a shared browser — and an account created through Google
 * has no password to be asked for at all, so the old form could not even be
 * completed.
 *
 * The recovery route, not reauthenticate(): the nonce from reauthenticate is
 * only enforced when the session is more than a day old, so a wrong code was
 * accepted and the password changed anyway. A recovery code is checked by the
 * auth server every time, which is the only version of this worth having.
 */
export async function sendPasswordChangeCode(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    await currentEmail()
  )
  if (error) throw new Error(friendly(error.message))
}

/**
 * Sets a new password, given a code from sendPasswordChangeCode.
 *
 * The code is checked first and separately. If it does not match, verifyOtp
 * fails and the password is never touched.
 */
export async function changePassword(
  newPassword: string,
  code: string
): Promise<void> {
  const supabase = createClient()

  const { error: codeError } = await supabase.auth.verifyOtp({
    email: await currentEmail(),
    token: code.trim(),
    type: "recovery",
  })
  if (codeError) {
    throw new Error(
      /invalid|expired|token/i.test(codeError.message)
        ? "That code is wrong or has expired. Send a new one."
        : friendly(codeError.message)
    )
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(friendly(error.message))

  // Only now is it true. The old code set these the moment the fake dialog
  // closed, so Settings would claim the account had a password whether or not
  // anything had been saved.
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    await supabase
      .from("settings")
      .update({ has_password: true, login_method: "password" })
      .eq("user_id", data.user.id)
  }
}

/**
 * Starts an email change. Supabase sends a confirmation to the new address —
 * and to the old one as well, if Secure Email Change is on — and the address
 * only moves once those are followed.
 *
 * Nothing is written to the profile here. The old code updated it immediately,
 * so Artha would show the new address while sign-in still expected the old
 * one, which is a bad way to find out your email never changed.
 */
export async function requestEmailChange(newEmail: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
  if (error) throw new Error(friendly(error.message))
}
