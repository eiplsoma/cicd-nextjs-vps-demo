# 4. Single environment: no staging, no automatic rollback, no Watchtower

## Status

Accepted

## Context

This project's primary purpose is to practice and demonstrate core CI/CD
mechanics (build, test, publish, deploy) for DevOps job interviews, not to
run production-grade infrastructure. It would be easy to keep adding
"industry standard" pieces — staging environments, blue-green deploys,
automatic rollback, a pull-based update agent alongside the push-based
pipeline — until the project no longer fit in a reasonable amount of time
to build or explain.

## Decision

Scope the pipeline to: one branch (`main`) triggers one deploy to one
environment. No PR-based staging or preview deploys. No automatic rollback
if the post-deploy smoke test fails (the workflow just goes red). No
Watchtower or other pull-based auto-update agent running alongside the
push-based deploy from ADR 0001.

## Consequences

- The pipeline stays small enough to fully explain end-to-end in an
  interview, and small enough to have actually been built and tested by
  the author rather than half-implemented.
- A failed deploy requires a manual fix (or a manual re-run against an
  older image tag — see ADR 0002) rather than self-healing.
- These are explicitly *not* rejected ideas — they're documented as
  possible future work in the README, should the project be extended.
