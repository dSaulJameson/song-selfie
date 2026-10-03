This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or

<!-- BEGIN:hosthatch-deployment-notice -->
> **Current production:** K3s namespace `song-selfie` on the new HostHatch VPS. Use [the production deployment guide](docs/production-deployment.md) for the automatic GitHub release and public source-revision check. The old Docker/Compose deployment instructions below are historical.
<!-- END:hosthatch-deployment-notice -->
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production deployment

Production runs in the `song-selfie` K3s namespace behind the new VPS's
Caddy and Cloudflare tunnel. Pushes to `main` publish a GHCR image; the
[Lasso release command](docs/production-deployment.md) promotes it and
verifies the source SHA through `www.songselfie.com`. Runtime secrets are
K3s Secrets and must never be added to the repository or image.

Media is stored in the private Cloudflare R2 bucket `song-selfie-production`.
HostHatch uploads through the authenticated `song-selfie-media` Worker; the
Cloudflare account credential and R2 bucket credentials are never present in the
application runtime. Completed songs remain shareable through the Worker's
read-only object URLs.
