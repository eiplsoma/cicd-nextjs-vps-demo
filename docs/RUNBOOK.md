# Go-Live Runbook

One-time steps to take this repo from "code on disk" to "live pipeline."
Each step notes where it runs. DNS is done early (step 3) so it has time to
propagate before the TLS certificate is requested in step 4.

`<YOUR_DOMAIN>` below stands for whatever subdomain you point at your own
VPS (e.g. `cicd-demo.example.com`) — this project's own live instance uses
`cicd-demo.woollydesign.hu`, but that domain belongs to its author, not to
anyone reproducing this repo. Bring your own domain and VPS.

## 1. Create the GitHub repo

Local machine:

```bash
gh repo create eiplsoma/cicd-nextjs-vps-demo --public --source=. --remote=origin
```

If `gh` isn't installed or authenticated, create the repo manually at
https://github.com/new, skipping the README/.gitignore/license init — this
repo already has them — then:

```bash
git remote add origin git@github.com:<your-username>/cicd-nextjs-vps-demo.git
git branch -M main
git push -u origin main
```

## 2. Add GitHub Actions secrets

github.com, repo Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | your VPS's public IP or hostname |
| `VPS_USER` | `deploy` (created in step 4) |
| `VPS_SSH_KEY` | the private key generated in step 4 |
| `GHCR_TOKEN` | a classic PAT, scope `read:packages` only |

## 3. DNS

At your own domain registrar / DNS provider. Add an A record:
- Name: the subdomain part of `<YOUR_DOMAIN>` (e.g. `cicd-demo`)
- Value: `<VPS_HOST>` (the VPS's public IPv4)
- Proxy status: DNS only at first, if your provider offers one (e.g.
  Cloudflare) — turn on proxying later, after step 5's deploy job has run
  once with its health check hitting the VPS directly (`127.0.0.1`), not
  the public domain. Proxying before that can make bot-protection reject
  the pipeline's own request.

DNS propagation can take a few minutes to a few hours — step 4's certbot
invocation will fail if it hasn't propagated yet, so it's fine to start this
step and come back to step 4 later.

## 4. VPS one-time setup

Termius, on the VPS, using your existing SSH access. If the VPS is shared
with other projects, it may already run nginx bound to 80/443 and already
have Docker installed — check before assuming a clean slate (see
[ADR 0005](adr/0005-nginx-instead-of-caddy.md), written for the case where
it is).

```bash
# Docker + Compose plugin (skip if `docker --version` already works)
curl -fsSL https://get.docker.com | sh

# dedicated deploy user, in the docker group (skip if it already exists)
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy

# check the firewall before touching it — a shared VPS likely already has
# 22/80/443 open for its other sites; only add what's actually missing
sudo ufw status verbose

# app directory
sudo mkdir -p /opt/cicd-demo
sudo chown deploy:deploy /opt/cicd-demo
```

Generate a deploy-only key pair, on your local machine:

```bash
ssh-keygen -t ed25519 -f ./cicd_deploy_key -C "github-actions-deploy" -N ""
cat ./cicd_deploy_key.pub
```

Copy the printed public key. Back in the existing sudo session on the VPS —
not a new login as `deploy`, which has no password and no key yet — install
it:

```bash
sudo mkdir -p /home/deploy/.ssh
echo "PASTE_THE_PUBLIC_KEY_HERE" | sudo tee -a /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Paste the contents of `./cicd_deploy_key` (the private half) into the
`VPS_SSH_KEY` GitHub secret.

`deploy` now accepts the new key — copy the compose file to the VPS with it:

```bash
scp -i ./cicd_deploy_key docker-compose.yml deploy@<VPS_HOST>:/opt/cicd-demo/
```

Delete both local key files (`cicd_deploy_key` and `cicd_deploy_key.pub`)
once that's done.

Add an nginx server block for `<YOUR_DOMAIN>`, as root/sudo on the VPS:

```bash
sudo tee /etc/nginx/sites-available/<YOUR_DOMAIN> > /dev/null <<'EOF'
server {
    listen 80;
    server_name <YOUR_DOMAIN>;
    server_tokens off;

    location / {
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/<YOUR_DOMAIN> /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Once DNS (step 3) has propagated, get a certificate — certbot's nginx plugin
edits the server block above in place to add TLS and the HTTP→HTTPS redirect:

```bash
sudo certbot --nginx -d <YOUR_DOMAIN>
```

Add `Strict-Transport-Security` (HSTS) afterward, directly to the same
file's HTTPS (`listen 443 ssl`) block — HSTS only makes sense once HTTPS
exists, and certbot doesn't add it on its own.

A copy of this project's own resulting config, with all four headers, is
kept for reference at
[`docs/nginx/cicd-demo.woollydesign.hu.conf`](nginx/cicd-demo.woollydesign.hu.conf) —
useful as a worked example, not something to deploy verbatim onto a
different domain. Nothing deploys it automatically either way; it just
keeps this project's own live VPS config reproducible instead of existing
only as an undocumented manual change.

## 5. Trigger the deploy

Local machine. If step 1's repo creation already pushed your code, the very
first workflow run already happened and failed at the `deploy` job — that's
expected, since secrets and the VPS weren't ready yet. Re-run it instead of
pushing again:

```bash
gh run list --workflow=ci-cd.yml --limit 1
gh run rerun --failed <run-id-from-above>
gh run watch
```

If nothing has been pushed yet, trigger the first run normally:

```bash
git push origin main
gh run watch
```

## 6. Verify

```bash
curl -fsS https://<YOUR_DOMAIN>/api/health
```
Expected: `{"status":"ok"}`.

Open `https://<YOUR_DOMAIN>` and confirm the displayed Git SHA matches
`git rev-parse --short HEAD` for the commit you just pushed. Once this
passes, it's safe to switch the DNS record from step 3 to proxied (if your
provider offers it) — the deploy job's health check never touches the
public domain, so a proxy in front of it won't interfere.
