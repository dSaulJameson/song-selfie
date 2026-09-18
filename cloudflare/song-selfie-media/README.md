# Song Selfie R2 media gateway

This Worker is the only write path from the HostHatch application to the private
`song-selfie-production` R2 bucket. `GATEWAY_SECRET` is stored as a Worker secret
and as a root-only HostHatch runtime secret; it is never committed.

Completed songs and temporary slideshow assets are readable from unguessable
object URLs to preserve Song Selfie's existing share and generation flows.
Uploads, deletes, and listings require the bearer secret.
