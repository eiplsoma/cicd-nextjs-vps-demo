const REPO_URL = 'https://github.com/eiplsoma/cicd-nextjs-vps-demo';

const PIPELINE_STAGES = [
  { name: 'Lint & test', detail: 'ESLint, tsc --noEmit, Vitest' },
  { name: 'Build & push image', detail: 'Docker multi-stage build → ghcr.io' },
  { name: 'Deploy', detail: 'SSH into the VPS → docker compose pull && up -d' },
];

const SECURITY_NOTES = [
  'Non-root user inside the Docker container',
  'Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS',
  "Cloudflare in front of the origin — the VPS's IP isn't publicly exposed",
  'Secrets live only in GitHub Actions secrets, never committed to the repo',
];

export default function Home() {
  const gitSha = process.env.NEXT_PUBLIC_GIT_SHA ?? 'local-dev';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? 'not built yet';
  const commitUrl = `${REPO_URL}/commit/${gitSha}`;

  return (
    <main>
      <h1>This page deployed itself.</h1>
      <p>
        Every push to <code>main</code> runs through the pipeline below and
        lands right here, in a Docker container on a DigitalOcean VPS,
        reverse-proxied by nginx.
      </p>
      <ol>
        {PIPELINE_STAGES.map((stage) => (
          <li key={stage.name}>
            <strong>{stage.name}</strong> — {stage.detail}
          </li>
        ))}
      </ol>

      <h2>Security</h2>
      <ul>
        {SECURITY_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <dl>
        <dt>Git SHA</dt>
        <dd data-testid="git-sha">
          {gitSha === 'local-dev' ? gitSha : <a href={commitUrl}>{gitSha}</a>}
        </dd>
        <dt>Built at</dt>
        <dd data-testid="build-time">{buildTime}</dd>
      </dl>

      <p>
        <a href={REPO_URL}>View this project on GitHub</a>
      </p>
    </main>
  );
}
