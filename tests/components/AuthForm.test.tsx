import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AuthForm } from '../../src/components/Auth/AuthForm';

// Mock the auth context
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

describe('AuthForm', () => {
  it('renders sign up form', () => {
    render(
      <AuthForm
        mode="signup"
        onToggleMode={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(screen.getByText('Create account')).toBeDefined();
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
  });

  it('renders sign in form', () => {
    render(
      <AuthForm
        mode="signin"
        onToggleMode={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(screen.getByText('Welcome back')).toBeDefined();
  });

  it('has email and password inputs', () => {
    render(
      <AuthForm
        mode="signup"
        onToggleMode={() => {}}
        onSuccess={() => {}}
      />
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    expect(emailInput.getAttribute('type')).toBe('email');
    expect(passwordInput.getAttribute('type')).toBe('password');
    expect(passwordInput.getAttribute('minLength')).toBe('6');
  });
});
