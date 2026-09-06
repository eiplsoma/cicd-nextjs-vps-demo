# 5. Use the VPS's existing nginx instead of Caddy

## Status

Accepted (supersedes [0003](0003-caddy-reverse-proxy-subdomain.md))

## Context

ADR 0003 planned a dedicated Caddy container to terminate TLS and reverse-proxy
the app, bound to host ports 80/443. During go-live setup, `ss -tulpn` on the
actual VPS showed nginx already listening on both 80 and 443 for other,
pre-existing sites on the same box — this VPS is shared with other projects,
not a clean host dedicated to this one. A second process binding those same
ports isn't possible, so Caddy as planned cannot run here.

## Decision

Drop the Caddy container entirely. Instead:
- The app container binds only to `127.0.0.1:3001` on the host (not a public
  port) — nothing but processes on the VPS itself can reach it directly.
- The existing nginx gets one additional server block for
  `cicd-demo.woollydesign.hu`, reverse-proxying to `127.0.0.1:3001`, with a
  certificate obtained via `certbot` (the standard tool for exactly this,
  and likely already in use on this box for its other sites' certs).

## Consequences

- One less moving part in the compose stack (no `caddy` service, no
  `Caddyfile`, no dedicated cert volume) — the project now shares the
  existing reverse-proxy layer instead of running a second one alongside it.
- Consistent with how the VPS's other projects are already exposed (their
  containers are also bound to `127.0.0.1:<port>` and proxied by the same
  nginx, per `ss -tulpn`).
- Loses Caddy's zero-config automatic HTTPS — the cert for this subdomain is
  now one more manual `certbot` invocation to run and (if not already
  automated on this box) keep renewed.
- The firewall story is simpler, not more complex: 80/443 stay owned by the
  one existing nginx process; nothing new needs opening for this project.
