# CI/CD Demo — Next.js on a self-hosted VPS

![CI/CD](https://github.com/eiplsoma/cicd-nextjs-vps-demo/actions/workflows/ci-cd.yml/badge.svg)

A minimal, industry-standard CI/CD pipeline. Every push to `main` is linted,
type-checked, unit-tested, built into a Docker image, published to GitHub
Container Registry, and deployed to a Docker Compose stack on a VPS over a
Cloudflare Tunnel (sshd is not exposed publicly at all — the SSH key is also
restricted to a single forced command, so it can never do anything beyond
that one deploy script). A dockerized nginx proxy on the VPS terminates TLS,
enforces Cloudflare-IP allowlisting and Authenticated Origin Pulls, and
reverse-proxies to the app container.

**Live:** https://cicd-demo.eiplsoma.hu

## What this demonstrates

- A multi-job GitHub Actions pipeline (`lint-test` → `build-and-push` → `deploy`)
  with explicit job dependencies (`needs:`).
- TDD-style unit testing with Vitest + React Testing Library, run in CI before
  anything is built.
- A multi-stage Dockerfile producing a small, non-root runtime image using
  Next.js's `standalone` output.
- Publishing versioned images (commit SHA + `latest`) to `ghcr.io`.
- Push-based deployment: GitHub Actions connects over a Cloudflare Tunnel
  (no public SSH port) and triggers a forced-command deploy script that runs
  `docker compose pull && up -d` — no polling, no extra agent on the server,
  and the deploy key can never do anything beyond that one fixed command.
- The app container binds only to `127.0.0.1` plus the proxy's internal
  docker network — nothing public can reach it directly.
- The deploy job's health check runs from inside the SSH session against
  `127.0.0.1`, not the public domain — it verifies the deploy itself, and
  never depends on (or gets blocked by) DNS/CDN/proxy behavior in front.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, HSTS) and no version/framework disclosure
  (`server_tokens off`, `poweredByHeader: false`).
- Secrets handled exclusively through GitHub Actions secrets, never committed.

## Architecture

```
GitHub repo (push to main)
        │
        ▼
GitHub Actions
  ├─ lint-test        (ESLint, tsc --noEmit, Vitest)
  ├─ build-and-push    (Docker build → ghcr.io/eiplsoma/cicd-nextjs-vps-demo)
  └─ deploy             (Cloudflare Tunnel + forced-command SSH → deploy.sh)
                                        │
                                        ▼
                    VPS (shared with other projects)
                    ├─ nginx proxy  (dockerized: TLS, Cloudflare-IP allowlist,
                    │                Authenticated Origin Pulls)
                    └─ app          (this container, proxy's docker network
                                     + 127.0.0.1:3001)
                                        ▲
                                        │
                          Cloudflare (proxied — hides the origin IP)
                                        ▲
                                        │
                          cicd-demo.eiplsoma.hu
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

Run this in Git Bash or WSL — the `$(...)` command substitution isn't valid PowerShell syntax.

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
| `VPS_USER` | Dedicated, non-root deploy user on the VPS |
| `VPS_SSH_KEY` | Private key for that user — forced-command-restricted in `authorized_keys`, so it can only ever run the one deploy script |

The VPS's own tunnel hostname is hardcoded in the workflow (it's a public DNS
name, not a secret). GHCR authentication is a one-time `docker login` done
directly on the VPS, not a credential passed through the pipeline on every
run.

Full one-time setup (repo creation, VPS provisioning, DNS, first deploy) is in
[`docs/RUNBOOK.md`](docs/RUNBOOK.md).

## Out of scope, on purpose

No automatic rollback, no staging environment or PR preview deploys, no
Watchtower or other pull-based auto-update agent alongside the push-based
deploy. Reasoning for each of these is in `docs/adr/`.

## Possible next steps

- Roll back to the previous image tag automatically if the smoke test fails.
- Staging environment with PR-based preview deploys.
- Automate the nginx vhost as code instead of a manual VPS step.
- Dependabot/Renovate for dependency updates.
