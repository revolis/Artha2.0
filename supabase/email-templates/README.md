# Auth email templates

These are the emails Supabase sends. They live here so they are versioned with
the app, but Supabase reads them from its own configuration — pasting them into
the dashboard is what makes them take effect.

## Why a link arrived instead of a code

Supabase decides between a magic link and a six-digit code by looking at the
template, not at the API call:

| Template contains        | What is sent    |
| ------------------------ | --------------- |
| `{{ .ConfirmationURL }}` | a magic link    |
| `{{ .Token }}`           | a six-digit code |

The stock templates use `{{ .ConfirmationURL }}`. Every template here uses
`{{ .Token }}` instead.

## Where each one goes

**Authentication → Email Templates** in the dashboard.

| File                   | Template in the dashboard | Subject to set                                    |
| ---------------------- | ------------------------- | ------------------------------------------------- |
| `confirm-signup.html`  | Confirm signup            | `{{ .Token }} is your Artha sign-up code`          |
| `reset-password.html`  | Reset password            | `{{ .Token }} is your Artha password reset code`   |
| `magic-link.html`      | Magic Link                | `{{ .Token }} is your Artha sign-in code`          |

Paste the file contents into the message body and set the subject beside it.

Which template a flow uses is not a free choice — Supabase picks it from the API
call. That is why `lib/auth-flow.ts` routes sign-up through `signInWithOtp` and
reset through `resetPasswordForEmail`: two routes are the only way to get two
differently worded emails.

Magic Link is unused today (sign-in is by password). It is written anyway so
that adding passwordless sign-in later cannot silently fall back to a stock
Supabase magic link.

## The sender still says "Supabase Auth"

That is the built-in email service, and its sender name and address cannot be
changed. It is also rate-limited to a handful of messages per hour and is
documented as being for testing only — it will not carry real sign-ups.

Fixing both is the same job: **Authentication → Emails → SMTP Settings**, point
it at an SMTP provider (Resend, Postmark, SES, Brevo — all have a free tier at
this volume), and set:

- Sender name: `Artha`
- Sender email: an address at a domain you control

Until then the emails read correctly but arrive from Supabase.
