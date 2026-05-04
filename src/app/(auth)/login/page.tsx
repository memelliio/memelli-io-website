'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/auth';

/* Inline icons */

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

/* Login Page */

export default function LoginPage() {
  const router = useRouter();
  const { token, login, showInactivityWarning, dismissInactivityWarning } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // If user already has a token, skip login entirely — go straight to dashboard
  useEffect(() => {
    if (token) {
      router.replace('/dashboard');
    }
  }, [token, router]);

  // Load saved "remember me" preference + pre-fill admin email if nothing saved
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('memelli_remember_me_pref');
      if (saved === 'true') setRememberMe(true);

      // Pre-fill admin email if no other credentials have been saved by the browser
      // (only when email field is still empty)
      if (!email) {
        setEmail('admin@memelli.com');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Save remember me preference
      localStorage.setItem('memelli_remember_me_pref', String(rememberMe));
      await login(email.toLowerCase().trim(), password, rememberMe);
      toast.success('Welcome back!');
      // Instant redirect — replace to prevent back-button returning to login
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // If we have a token, don't show login page at all (will redirect above)
  if (token) return null;

  return (
    <>
      {/* Inactivity warning overlay */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[hsl(var(--foreground)/0.35)] backdrop-blur-sm">
          <div className="memelli-card max-w-sm p-8 text-center">
            <div className="mb-2 text-lg font-semibold text-[hsl(var(--warning))]">Session Timeout</div>
            <p className="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
              You&apos;ve been inactive for 10 minutes. You will be logged out in 1 minute unless you continue.
            </p>
            <button
              onClick={dismissInactivityWarning}
              className="rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="memelli-card p-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to home
        </Link>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Welcome back</h1>
          <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">Sign in to your Memelli workspace</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="memelli-error mb-5">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[12px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="memelli-input block w-full"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[12px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[12px] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="memelli-input block w-full pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex cursor-pointer select-none items-center gap-2.5 pt-0.5">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded text-[hsl(var(--primary))] accent-[hsl(var(--primary))]"
            />
            <span className="text-[13px] text-[hsl(var(--muted-foreground))]">Remember me for 30 days</span>
          </label>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Start free */}
        <p className="mt-6 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
          New to Memelli?{' '}
          <Link href="/register" className="font-semibold text-[hsl(var(--primary))] transition-opacity hover:opacity-80">
            Start free
          </Link>
        </p>
      </div>
    </>
  );
}
