# Edge functions

Four functions run on Supabase rather than Vercel, each because it needs
something that must not reach a browser.

| Function | Called by | Why it is server-side |
| --- | --- | --- |
| `delete-account` | Danger zone in Settings | Deleting a user needs the service role key. It only ever deletes the caller — the id comes from their own verified token, never the request body. |
| `send-message` | Contact and feedback forms | Holds the mail provider's key. The only endpoint open to signed-out visitors, so it validates its input and caps messages per address and per hour. |
| `send-notification-emails` | `pg_cron`, weekly and monthly | Reads every subscriber's address, so it stays behind a service-role call. |
| `refresh-rates` | Vercel Cron and a GitHub Action, daily | Writes the shared rate table, and the call is what keeps a free project from being paused for inactivity. |

## JWT verification is not in the source

Whether a function demands a valid token is deployment configuration, not code,
so it cannot be read from the files here. Getting it wrong breaks things
quietly in both directions — a public endpoint that starts rejecting callers,
or a private one that stops asking.

| Function | `verify_jwt` | If it were wrong |
| --- | --- | --- |
| `delete-account` | **on** | Off would let anyone reach it. It still checks the caller, so it would refuse — but there is no reason to accept the request at all. |
| `send-message` | **off** | On would break the public contact form, which has to work for someone who is not signed in. |
| `send-notification-emails` | **on** | Off would expose every subscriber's email address. |
| `refresh-rates` | **off** | On would stop the schedulers, which hold no key — and the project would eventually be paused. |

Deploy with the flag set explicitly:

```bash
supabase functions deploy delete-account
supabase functions deploy send-notification-emails
supabase functions deploy send-message --no-verify-jwt
supabase functions deploy refresh-rates --no-verify-jwt
```

## Secrets

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
injected by the platform. The rest are set by hand:

```bash
supabase secrets set RESEND_API_KEY=re_your_key
```

Optional: `MESSAGES_FROM` (default `Artha <noreply@0xr8n.me>`) and
`MESSAGES_TO` (where contact mail lands).

Without `RESEND_API_KEY` nothing breaks — messages are still stored and the
summary job reports that it sent nothing.

## The scheduled ones

`pg_cron` runs the summaries: weekly on Mondays at 08:00 UTC, monthly on the
1st at 08:05 UTC. Both go through `public.dispatch_notification_emails`, which
reads a service role key from Vault at run time rather than keeping it in the
schedule, where anyone able to read `cron.job` could read it too:

```sql
select vault.create_secret('<service role key>', 'service_role_key');
```

Until that secret exists the job runs and quietly does nothing.

## Seeing an email before it is sent

`send-notification-emails` renders one without sending when given
`{"preview": true}`, which returns the HTML instead of mailing it:

```sql
select net.http_post(
  url := 'https://vosxgtbaizimrbdoztir.supabase.co/functions/v1/send-notification-emails',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
  ),
  body := jsonb_build_object('kind', 'monthly', 'preview', true)
);
-- then read the HTML back
select content from net._http_response order by created desc limit 1;
```
