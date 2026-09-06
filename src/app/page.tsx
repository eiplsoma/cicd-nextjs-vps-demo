const PIPELINE_STAGES = [
  { name: 'Lint & test', detail: 'ESLint, tsc --noEmit, Vitest' },
  { name: 'Build & push image', detail: 'Docker multi-stage build → ghcr.io' },
  { name: 'Deploy', detail: 'SSH into the VPS → docker compose pull && up -d' },
];

export default function Home() {
  const gitSha = process.env.NEXT_PUBLIC_GIT_SHA ?? 'local-dev';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? 'not built yet';

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
      <dl>
        <dt>Git SHA</dt>
        <dd data-testid="git-sha">{gitSha}</dd>
        <dt>Built at</dt>
        <dd data-testid="build-time">{buildTime}</dd>
      </dl>
    </main>
  );
}
