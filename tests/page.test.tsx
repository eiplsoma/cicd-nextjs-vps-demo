import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../src/app/page';

describe('Home page', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the headline', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', { name: /this page deployed itself/i })
    ).toBeInTheDocument();
  });

  it('lists all three pipeline stages', () => {
    render(<Home />);
    expect(screen.getByText('Lint & test')).toBeInTheDocument();
    expect(screen.getByText('Build & push image')).toBeInTheDocument();
    expect(screen.getByText('Deploy')).toBeInTheDocument();
  });

  it('falls back to "local-dev" for the git SHA when the env var is unset', () => {
    render(<Home />);
    expect(screen.getByTestId('git-sha')).toHaveTextContent('local-dev');
  });

  it('renders the actual git SHA when the env var is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GIT_SHA', 'abc1234');
    render(<Home />);
    expect(screen.getByTestId('git-sha')).toHaveTextContent('abc1234');
  });

  it('renders the actual build time when the env var is set', () => {
    vi.stubEnv('NEXT_PUBLIC_BUILD_TIME', '2026-09-06T12:00:00Z');
    render(<Home />);
    expect(screen.getByTestId('build-time')).toHaveTextContent('2026-09-06T12:00:00Z');
  });
});
