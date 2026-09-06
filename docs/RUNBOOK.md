# Go-Live Runbook

One-time steps to take this repo from "code on disk" to "live pipeline."
Each step notes where it runs.

## 1. Create the GitHub repo (local machine)

```bash
gh repo create eiplsoma/cicd-nextjs-vps-demo --public --source=. --remote=origin
```

If `gh` isn't installed or authenticated, create the repo manually at
https://github.com/new (owner `eiplsoma`, name `cicd-nextjs-vps-demo`, public,
do **not** initialize with a README/.gitignore/license — this repo already has
them), then:

```bash
git remote add origin git@github.com:eiplsoma/cicd-nextjs-vps-demo.git
git branch -M main
git push -u origin main
```

## 2. Add GitHub Actions secrets (github.com, repo Settings → Secrets and
   variables → Actions)

| Secret | Value |
| --- | --- |
| `VPS_HOST` | your VPS's public IP or hostname |
| `VPS_USER` | `deploy` (created in step 3) |
| `VPS_SSH_KEY` | the *private* key generated in step 3 |
| `GHCR_TOKEN` | a classic PAT, scope `read:packages` only |

## 3. VPS one-time setup (Termius, on the VPS)

```bash
# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh

# dedicated deploy user, in the docker group
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy

# firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# app directory
sudo mkdir -p /opt/cicd-demo
sudo chown deploy:deploy /opt/cicd-demo
```

On your **local machine**, generate a deploy-only key pair and install the
public half on the VPS:

```bash
ssh-keygen -t ed25519 -f ./cicd_deploy_key -C "github-actions-deploy" -N ""
scp ./cicd_deploy_key.pub deploy@<VPS_HOST>:/home/deploy/temp_key.pub
ssh deploy@<VPS_HOST> "mkdir -p ~/.ssh && cat ~/temp_key.pub >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && rm ~/temp_key.pub"
```

Paste the contents of `./cicd_deploy_key` (the private half) into the
`VPS_SSH_KEY` GitHub secret, then delete both local key files.

Copy the compose files to the VPS:

```bash
scp docker-compose.yml Caddyfile deploy@<VPS_HOST>:/opt/cicd-demo/
```

## 4. DNS (domain registrar / DNS provider for woollydesign.hu)

Add an A record:
- Name: `cicd-demo`
- Value: `<VPS_HOST>` (the VPS's public IPv4)

## 5. First deploy (local machine)

```bash
git push origin main
gh run watch
```

## 6. Verify

```bash
curl -fsS https://cicd-demo.woollydesign.hu/api/health
```
Expected: `{"status":"ok"}`.

Open https://cicd-demo.woollydesign.hu and confirm the displayed Git SHA
matches `git rev-parse --short HEAD` for the commit you just pushed.
