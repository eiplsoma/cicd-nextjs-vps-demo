#!/bin/bash
# Reference copy of the fixed deploy script that lives at
# /opt/cicd-demo/deploy.sh on the target VPS.
#
# This file is NOT executed by anything in this repo or by GitHub Actions —
# it's a reproducibility copy, same pattern as docs/nginx/*.conf. The real
# copy lives only on the VPS, owned by the cicd-deploy user, and is invoked
# via an SSH forced-command (see docs/RUNBOOK.md and the authorized_keys
# entry for the cicd-deploy user): the GitHub Actions deploy step can send
# whatever it wants over SSH, the server always runs exactly this script
# instead, nothing else — that's what makes the forced-command restriction
# meaningful.
#
# If this file and the VPS ever drift apart, the VPS is the source of
# truth — update this copy to match it, not the other way around.
set -e
cd /opt/cicd-demo
docker compose pull
docker compose up -d
docker image prune -f
for i in $(seq 1 10); do
  if curl -fsS http://127.0.0.1:3001/api/health; then exit 0; fi
  sleep 2
done
echo "Health check failed after 10 attempts (20s)" >&2
exit 1
