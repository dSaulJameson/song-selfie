# Production deployment: dSaulJameson/song-selfie

This repository is deployed on the **new HostHatch VPS `85.155.179.33`**,
in K3s namespace `song-selfie`. The old Docker VPS at `170.205.38.181`
is retired for deployments. Public ingress uses the new Cloudflare tunnel
and K3s Caddy; do not point `HOSTHATCH_HOST` or DNS at the old machine.

| Component | Private GHCR package | K3s image targets |
|---|---|---:|
| `song-selfie` | `ghcr.io/dsauljameson/song-selfie` | 1 |

## Release from Lasso

1. Commit and push the intended changes to `main`. The protected
   `.github/workflows/build-production-image.yml` publishes a SHA-tagged,
   digest-addressed GHCR image and a release metadata artifact. Its success
   means the image exists; it has not yet reached production.
2. In Lasso's terminal, run:

   ```sh
   cd /home/dev/projects/hosthatch-ops
   git pull --ff-only
   python3 new-server/release-production.py song-selfie
   ```

3. The command validates the pushed source, waits for the image build,
   promotes its digest through the protected `hosthatch-ops` production
   workflow, then waits for the new K3s rollout and source-revision checks.
   No root SSH or Kubernetes credential belongs in this source repository
   or the Lasso workspace.

## Verification

The production workflow reads the source revision through these public URLs:

- `https://www.songselfie.com/hosthatch-revision.json`

It also checks these application routes:

- `https://www.songselfie.com/`

For an independent check, inspect the completed `Apply production release`
run in `execution-associates/hosthatch-ops`, then compare its full source SHA
with the JSON at the public revision URL and the image digest in:

```sh
ssh hosthatch-new 'kubectl -n song-selfie get deployments,cronjobs -o wide'
```

If this project has no public hostname, the release workflow checks the
catalogued K3s targets and image build metadata instead. Do not infer
deployment from an old Docker container or a green GitHub build alone.
Database migrations and any one-off mail, social, payment, or scraper
actions require separate review before execution.

The production catalog and full procedure are in
[`hosthatch-ops/new-server/RELEASING.md`](https://github.com/execution-associates/hosthatch-ops/blob/main/new-server/RELEASING.md).
