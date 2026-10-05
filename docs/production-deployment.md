# Production deployment: dSaulJameson/song-selfie

This repository is deployed on the **new HostHatch VPS `85.155.179.33`**,
in K3s namespace `song-selfie`. The old Docker VPS at `170.205.38.181`
is retired for deployments. Public ingress uses the new Cloudflare tunnel
and K3s Caddy; do not point `HOSTHATCH_HOST` or DNS at the old machine.

| Component | Private GHCR package | K3s image targets |
|---|---|---:|
| `song-selfie` | `ghcr.io/dsauljameson/song-selfie` | 1 |

## Automatic release from Lasso

1. Commit and push the intended changes to `main`. The protected
   `.github/workflows/build-production-image.yml` builds a SHA-tagged,
   digest-addressed GHCR image and then automatically dispatches the
   protected operations workflow. The source workflow waits for the K3s
   rollout and source-revision checks. **Its whole run is green only when
   production is verified.**
2. Watch the source workflow run in GitHub. It links to the exact operations
   release run. The deploy job carries a short lived GitHub signed identity;
   it has no root SSH or Kubernetes credential.

For a deliberate rerun of the current `main` revision, use Lasso's terminal:

   ```sh
   cd /home/dev/projects/hosthatch-ops
   git pull --ff-only
   python3 new-server/release-production.py song-selfie
   ```

The command starts a fresh source build and waits for the same verified
production result. A future sandbox or client can turn off automatic
production promotion while retaining this deliberate workflow.

## Verification

The production workflow reads the source revision through these public URLs:

- `https://www.songselfie.com/hosthatch-revision.json`

It also checks these application routes:

- `https://www.songselfie.com/`

For an independent check, inspect the completed `Apply production release`
run in `dSaulJameson/hosthatch-ops`, then compare its full source SHA
with the JSON at the public revision URL and the image digest in:

```sh
ssh hosthatch-new 'kubectl -n song-selfie get deployments,cronjobs -o wide'
```

If this project has no public hostname, the release workflow checks the
catalogued K3s targets and image build metadata instead. Do not infer
deployment from an old Docker container or the image build job alone.
Database migrations and any one-off mail, social, payment, or scraper
actions require separate review before execution.

The production catalog and full procedure are in
[`hosthatch-ops/new-server/RELEASING.md`](https://github.com/dSaulJameson/hosthatch-ops/blob/main/new-server/RELEASING.md).

## Security release checks

The protected release scans incoming source for credentials and the exact immutable
runtime image for vulnerabilities. A fixable critical finding blocks production
promotion. High and unfixed findings are retained as private Actions artifacts
for review. Keep these gates and the public source-revision checks enabled.
Security changes follow the same production workflow; Lasso needs no root key.
