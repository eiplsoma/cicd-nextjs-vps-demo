import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../src/app/page';

describe('Home page', () => {
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
});
