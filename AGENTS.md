<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:hosthatch-production -->
## HostHatch production

- Production target: **new VPS `85.155.179.33`, K3s namespace `song-selfie`**.
  `170.205.38.181` is retired for application deployments.
- This private application repository belongs under `dSaulJameson`.
  Do not transfer or mirror it to the Execution Associates organization.
- Pushing to `main` starts the protected image build and K3s deployment.
  The source workflow stays red unless production passes the exact source
  revision gate. For a deliberate rerun from Lasso, use
  `python3 /home/dev/projects/hosthatch-ops/new-server/release-production.py song-selfie`.
  Lasso does not hold cluster or root deploy credentials.
- Read `docs/production-deployment.md` for component images, the GitHub
  workflow, public revision gate, and verification commands. The image build
  job alone or a healthy pod on the wrong source revision is not success.
- Do not run the historical Docker/Compose deploy scripts or restart old VPS
  timers and workers. Review database and external side effects separately.
<!-- END:hosthatch-production -->
