# 2. GitHub Container Registry as the image registry

## Status

Accepted

## Context

The Docker image needs to live somewhere between the build job and the
deploy job. The two realistic options were GitHub Container Registry
(`ghcr.io`) and Docker Hub.

## Decision

Use `ghcr.io`, authenticating with the workflow's automatic `GITHUB_TOKEN`
for pushes. The VPS authenticates separately with a personal access token
scoped to `read:packages` only, to pull images.

## Consequences

- No extra registry account or secret needed for the push side — the
  built-in `GITHUB_TOKEN` already has permission once the workflow declares
  `permissions: packages: write`.
- Images are versioned by commit SHA (`:<sha>`) as well as `:latest`,
  giving a manual rollback path (re-run deploy against an older tag) even
  though this project has no automatic rollback (see ADR 0004).
- The VPS's pull-side credential (`GHCR_TOKEN`) is deliberately narrower
  than the CI push-side credential — it can only read packages, never
  push or manage them.
