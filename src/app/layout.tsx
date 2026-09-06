import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CI/CD Demo — Next.js on a self-hosted VPS',
  description:
    'A minimal, industry-standard CI/CD pipeline: GitHub Actions builds and deploys this very page to a Docker Compose stack on a DigitalOcean VPS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
