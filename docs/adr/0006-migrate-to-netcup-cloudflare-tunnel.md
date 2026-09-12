# 6. Migrate from the DigitalOcean VPS to a Netcup VPS reached over a Cloudflare Tunnel

## Status

Accepted (supersedes the DigitalOcean deployment target from
[0005](0005-nginx-instead-of-caddy.md))

## Context

The original DigitalOcean droplet worked, but consolidating onto a second,
already-managed VPS (also used for other personal projects) removed the need
to keep two boxes patched and monitored. That VPS's sshd is intentionally
bound to `127.0.0.1` only — it's reached exclusively through a Cloudflare
Tunnel, with no port ever exposed to the public internet.

A Cloudflare Access application with a Service Token was tried first for the
CI-side authentication, matching the pattern used for the box's human admin
access. It doesn't work for this use case: `cloudflared access ssh`/
`access tcp` ignores Service Token credentials and falls back to interactive
browser-based auth (a confirmed upstream bug, cloudflare/cloudflared#1673),
which cannot succeed in a headless GitHub Actions runner.

## Decision

- Deploy target: the Netcup VPS, reached via a dedicated Cloudflare Tunnel
  hostname (`ci-deploy.<domain>`) with **no Access application attached** —
  unlike the human-facing SSH hostname, this one relies solely on the SSH
  key itself for authentication, avoiding the Service Token bug entirely.
- The deploy SSH key is **forced-command restricted** in `authorized_keys`
  (`command="...",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding`)
  to a single fixed script — even a fully compromised key can only trigger
  that one script, never an interactive shell.
- The VPS's existing dockerized nginx proxy (already handling TLS,
  Cloudflare-IP allowlisting, and Authenticated Origin Pulls for other sites
  on the box) gets one more server block for this app, reached over its
  internal docker network rather than a second reverse-proxy layer.
- GHCR authentication is a one-time `docker login` performed directly on the
  VPS, not a token passed through the pipeline on every deploy.

## Consequences

- One fewer VPS to patch/monitor; the deploy pipeline's blast radius if the
  SSH key ever leaked is one fixed script, not a shell.
- Cloudflare Access Service Tokens are not a viable authentication method
  for `cloudflared access ssh`/`tcp` today — worth re-checking upstream
  before relying on that pattern elsewhere.
- The DigitalOcean droplet's cicd-demo container, nginx vhost, TLS
  certificate, DNS record, and CI-specific SSH key have all been removed;
  the droplet itself continues running its other, unrelated services.
