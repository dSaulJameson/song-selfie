# Song Selfie Cloudflare mailer

This Worker is the only transactional email transport used by Song Selfie. It
sends through Cloudflare Email Service from `info@songselfie.com` and accepts
authenticated requests from the HostHatch application.

The `MAILER_SECRET` Worker secret must match the HostHatch
`MAILER_WORKER_SECRET`. Never place either value in this repository.

Deploy from this directory with Wrangler:

```bash
wrangler deploy --keep-vars
```

`GET /health` is public and reports the active provider and sender. Email
submission is restricted to authenticated `POST /` requests.
