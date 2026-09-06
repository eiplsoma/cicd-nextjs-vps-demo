# 1. Push-based deployment over SSH, not a pull-based agent

## Status

Accepted

## Context

The image needs to get from GitHub Container Registry onto the VPS somehow.
Two common patterns exist: a **pull-based** agent running on the server
(e.g. Watchtower) that polls the registry and updates containers on its own,
or a **push-based** pipeline where CI explicitly drives the deploy step.

## Decision

GitHub Actions builds the image, pushes it to GHCR, then SSHes into the VPS
and runs `docker compose pull && up -d` as an explicit pipeline step. No
polling agent runs on the server.

## Consequences

- The entire deploy is visible and driven from the GitHub Actions run —
  there is one place to look when something goes wrong, and one thing to
  demonstrate in an interview: "the pipeline itself deploys the app."
- The VPS needs a dedicated, restricted SSH key and secrets stored in
  GitHub Actions (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`).
- No background process on the server to maintain, monitor, or secure.
- Trade-off: deploys only happen on a push to `main` — there is no
  independent "catch up if a deploy was missed" mechanism, which is
  acceptable for a single-environment demo project.
