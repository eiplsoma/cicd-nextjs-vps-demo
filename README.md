# CI/CD Demo — Next.js on a self-hosted VPS

![CI/CD](https://github.com/eiplsoma/cicd-nextjs-vps-demo/actions/workflows/ci-cd.yml/badge.svg)

A minimal, industry-standard CI/CD pipeline. Every push to `main` is linted,
type-checked, unit-tested, built into a Docker image, published to GitHub
Container Registry, and deployed over SSH to a Docker Compose stack on a
DigitalOcean VPS — behind Caddy with automatic HTTPS.

**Live:** https://cicd-demo.woollydesign.hu

## What this demonstrates

- A multi-job GitHub Actions pipeline (`lint-test` → `build-and-push` → `deploy`)
  with explicit job dependencies (`needs:`).
- TDD-style unit testing with Vitest + React Testing Library, run in CI before
  anything is built.
- A multi-stage Dockerfile producing a small, non-root runtime image using
  Next.js's `standalone` output.
- Publishing versioned images (commit SHA + `latest`) to `ghcr.io`.
- Push-based deployment: GitHub Actions SSHes into the target host and runs
  `docker compose pull && up -d` — no polling, no extra agent on the server.
- Reverse proxy + automatic HTTPS via Caddy, fronting the app container.
- Secrets handled exclusively through GitHub Actions secrets, never committed.

## Architecture

```
GitHub repo (push to main)
        │
        ▼
GitHub Actions
  ├─ lint-test        (ESLint, tsc --noEmit, Vitest)
  ├─ build-and-push    (Docker build → ghcr.io/eiplsoma/cicd-nextjs-vps-demo)
  └─ deploy             (SSH → docker compose pull && up -d → smoke test)
                                        │
                                        ▼
                    DigitalOcean VPS (Docker Compose)
                    ├─ caddy   (reverse proxy, auto HTTPS)
                    └─ app     (this Next.js container)
                                        │
                          cicd-demo.woollydesign.hu
```

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run test
```

## Building the container locally

```bash
docker build \
  --build-arg GIT_SHA=$(git rev-parse --short HEAD) \
  --build-arg BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  -t cicd-nextjs-vps-demo:local .
docker run --rm -p 3000:3000 cicd-nextjs-vps-demo:local
```

## Required GitHub Actions secrets

| Secret | Purpose |
| --- | --- |
| `VPS_HOST` | IP/hostname of the deploy target |
| `VPS_USER` | Dedicated, non-root deploy user on the VPS |
| `VPS_SSH_KEY` | Private key for that user, restricted to this pipeline |
| `GHCR_TOKEN` | PAT with `read:packages` only, used by the VPS to pull images |

Full one-time setup (repo creation, VPS provisioning, DNS, first deploy) is in
[`docs/RUNBOOK.md`](docs/RUNBOOK.md).

## Out of scope, on purpose

No automatic rollback, no staging environment or PR preview deploys, no
Watchtower or other pull-based auto-update agent alongside the push-based
deploy. Reasoning for each of these is in `docs/adr/`.

## Possible next steps

- Roll back to the previous image tag automatically if the smoke test fails.
- Staging environment with PR-based preview deploys.
- Traefik instead of Caddy (Docker-label-driven config).
- Dependabot/Renovate for dependency updates.
