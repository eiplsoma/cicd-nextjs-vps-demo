# 3. Caddy reverse proxy on a dedicated subdomain

## Status

Superseded by [0005](0005-nginx-instead-of-caddy.md) — the target VPS turned
out to already run nginx bound to 80/443 for other sites, discovered during
go-live setup. Kept here for the record of why Caddy was the first choice.

## Context

The app container needs TLS termination and a public hostname. Options
considered: Caddy (automatic HTTPS via Let's Encrypt, minimal config),
Traefik (Docker-label-driven, more common in larger container fleets), or
exposing the app's port directly with no reverse proxy at all.

The VPS's existing domain, `woollydesign.hu`, is also used for another,
unrelated site, so the root domain could not simply be repointed at this
project's container.

## Decision

Use Caddy 2 with a two-line Caddyfile, fronting the app on a dedicated
subdomain, `cicd-demo.woollydesign.hu`, added as its own DNS A record.

## Consequences

- HTTPS is automatic and effectively zero-config — Caddy requests and
  renews the Let's Encrypt certificate itself on first request to the
  domain.
- The subdomain isolates this project completely from the root domain and
  whatever runs there — no shared reverse-proxy config, no risk of one
  project's deploy affecting the other's routing.
- Traefik remains a documented future option (its Docker-label-based
  config is a commonly expected DevOps skill) — see the README's "possible
  future work" section — but was not chosen here to keep the stack to two
  services.
