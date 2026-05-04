'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/auth';
import { Button, Input } from '@memelli/ui';
import { API_URL } from '@/lib/config';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrbState = 'idle' | 'submitting' | 'success' | 'error';
type PageStep = 'form' | 'verify';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

// ─── Country codes ────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: '+1', label: 'US/CA', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: '+44', label: 'UK', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: '+61', label: 'AU', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: '+33', label: 'FR', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: '+49', label: 'DE', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: '+81', label: 'JP', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: '+91', label: 'IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: '+55', label: 'BR', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: '+52', label: 'MX', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: '+86', label: 'CN', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: '+234', label: 'NG', flag: '\u{1F1F3}\u{1F1EC}' },
  { code: '+27', label: 'ZA', flag: '\u{1F1FF}\u{1F1E6}' },
  { code: '+971', label: 'AE', flag: '\u{1F1E6}\u{1F1EA}' },
];

// ─── Memelli Status Indicator (replaces dark orb) ─────────────────────────────

function MemelliStatusBadge({ state }: { state: OrbState }) {
  const tone =
    state === 'success' ? 'memelli-status-ok' :
    state === 'error' ? 'memelli-status-err' :
    state === 'submitting' ? 'memelli-status-info' :
    'memelli-status-info';

  const label =
    state === 'success' ? 'Verified' :
    state === 'error' ? 'Action needed' :
    state === 'submitting' ? 'Working…' :
    'Ready';

  return (
    <div className="mb-6 flex items-center justify-center">
      <span className={`memelli-status ${tone}`}>{label}</span>
    </div>
  );
}

// ─── Verification Code Input ──────────────────────────────────────────────────

function VerificationCodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').slice(0, 6).split('');

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.join('').replace(/ /g, '');
    onChange(newValue);
    if (char && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) focusInput(index - 1);
    if (e.key === 'ArrowRight' && index < 5) focusInput(index + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, 5);
    focusInput(nextIndex);
  };

  return (
    <div className="flex justify-center gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit === ' ' ? '' : digit}
          disabled={disabled}
          autoFocus={i === 0}
          className="memelli-input h-14 w-12 text-center text-xl font-semibold disabled:opacity-50"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

// ─── Main Register Page ───────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [countryCode, setCountryCode] = useState('+1');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verification state
  const [step, setStep] = useState<PageStep>('form');
  const [userId, setUserId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyError, setVerifyError] = useState('');

  // Status indicator state
  const [orbState, setOrbState] = useState<OrbState>('idle');

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Expose form setters for GlobalMemelliOrb voice filling
  useEffect(() => {
    (window as any).__memelliFormSetters = {
      firstName: (v: string) => setForm(f => ({ ...f, firstName: v })),
      lastName:  (v: string) => setForm(f => ({ ...f, lastName:  v })),
      email:     (v: string) => setForm(f => ({ ...f, email:     v })),
      phone:     (v: string) => setForm(f => ({ ...f, phone:     v.replace(/\D/g, '').slice(0, 10) })),
      password:  (v: string) => setForm(f => ({ ...f, password:  v })),
    };
    return () => { delete (window as any).__memelliFormSetters; };
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // ── Phone formatting ──────────────────────────────────────────────────────

  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, phone: raw }));
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address';
    }

    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      errors.phone = 'Phone number is required';
    } else if (phoneDigits.length < 7) {
      errors.phone = 'Enter a valid phone number';
    }

    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit registration ───────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) {
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 1500);
      return;
    }

    setIsLoading(true);
    setOrbState('submitting');

    try {
      const fullPhone = `${countryCode}${form.phone}`;

      // Call the auth signup endpoint (phone-verified registration)
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: fullPhone,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const errMsg = (err.error ?? err.message ?? 'Registration failed') as string;
        throw new Error(errMsg);
      }

      const json = (await res.json()) as Record<string, unknown>;
      const data = json.data as Record<string, unknown> | undefined;
      const returnedUserId = (data?.userId ?? '') as string;
      setUserId(returnedUserId);

      // Registration successful -- move to phone verification
      setOrbState('success');
      setStep('verify');
      setResendCooldown(60);
      toast.success('Account created! Verify your phone number.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setServerError(message);
      setOrbState('error');
      toast.error(message);
      setTimeout(() => setOrbState('idle'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verify phone code ─────────────────────────────────────────────────────

  const handleVerify = useCallback(async () => {
    if (verificationCode.length !== 6) return;
    setIsVerifying(true);
    setVerifyError('');
    setOrbState('submitting');

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: verificationCode,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const errMsg = (err.error ?? err.message ?? 'Verification failed') as string;
        throw new Error(errMsg);
      }

      const json = (await res.json()) as Record<string, unknown>;
      const payload = (json.data ?? json) as Record<string, unknown>;
      const token = (payload.token ?? json.token) as string | undefined;

      // If the verify endpoint returns a token, store it and log in
      if (token) {
        localStorage.setItem('memelli_token', token);
      }

      setOrbState('success');
      toast.success('Verified! Redirecting to dashboard...');

      // If no token from verify, fall back to logging in with credentials
      if (!token) {
        try {
          await register(form.email, form.password, form.firstName, form.lastName, `${form.firstName} ${form.lastName}`);
        } catch {
          // Token may already be set from registration -- continue to redirect
        }
      }

      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setVerifyError(message);
      setOrbState('error');
      toast.error(message);
      setTimeout(() => setOrbState('idle'), 2000);
    } finally {
      setIsVerifying(false);
    }
  }, [verificationCode, userId, form, register, router]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (verificationCode.length === 6 && step === 'verify') {
      handleVerify();
    }
  }, [verificationCode, step, handleVerify]);

  // ── Resend code ───────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setResendCooldown(60);
      setVerificationCode('');
      toast.success('New code sent!');
    } catch {
      toast.error('Failed to resend code');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Pass the brand-conformant input look through @memelli/ui's Input className.
  const inputClassName = 'memelli-input';

  return (
    <div className="memelli-card p-8">
      {/* Back to homepage */}
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to home
      </Link>

      {/* Status indicator */}
      <MemelliStatusBadge state={orbState} />

      <div className="mb-8 flex flex-col items-center justify-center gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          {step === 'form' ? 'Create your account' : 'Verify your phone'}
        </h1>
        <p className="text-[13px] font-medium text-[hsl(var(--muted-foreground))]">
          {step === 'form'
            ? 'Join the Memelli universe'
            : `We sent a code to ${countryCode} ${formatPhone(form.phone)}`}
        </p>
      </div>

      {/* Registration Form */}

      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: step === 'form' ? 800 : 0,
          opacity: step === 'form' ? 1 : 0,
          transform: step === 'form' ? 'translateY(0)' : 'translateY(-20px)',
        }}
      >
        {serverError && (
          <div className="memelli-error mb-5">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              id="firstName"
              type="text"
              required
              value={form.firstName}
              onChange={set('firstName')}
              placeholder="Jane"
              error={fieldErrors.firstName}
              className={inputClassName}
            />
            <Input
              label="Last Name"
              id="lastName"
              type="text"
              required
              value={form.lastName}
              onChange={set('lastName')}
              placeholder="Doe"
              error={fieldErrors.lastName}
              className={inputClassName}
            />
          </div>

          <Input
            label="Email"
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@company.com"
            error={fieldErrors.email}
            className={inputClassName}
          />

          {/* Phone with country code selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-[hsl(var(--foreground))]">
              Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="memelli-input h-10 w-[100px] shrink-0 cursor-pointer appearance-none"
                aria-label="Country code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                required
                value={formatPhone(form.phone)}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                aria-invalid={!!fieldErrors.phone}
                className="memelli-input h-10 w-full"
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-xs text-[hsl(var(--primary))]">{fieldErrors.phone}</p>
            )}
          </div>

          <Input
            label="Password"
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            placeholder="Min 8 characters"
            error={fieldErrors.password}
            className={inputClassName}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full rounded-lg bg-[hsl(var(--primary))] py-3 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
          >
            Register
          </Button>
        </form>

        <p className="mt-8 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[hsl(var(--primary))] transition-opacity hover:opacity-80">
            Sign in
          </Link>
        </p>
      </div>

      {/* Phone Verification Step */}

      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: step === 'verify' ? 400 : 0,
          opacity: step === 'verify' ? 1 : 0,
          transform: step === 'verify' ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        {step === 'verify' && (
          <div className="space-y-6">
            {verifyError && (
              <div className="memelli-error">
                {verifyError}
              </div>
            )}

            <VerificationCodeInput
              value={verificationCode}
              onChange={setVerificationCode}
              disabled={isVerifying}
            />

            <Button
              type="button"
              isLoading={isVerifying}
              disabled={verificationCode.length !== 6}
              onClick={handleVerify}
              className="w-full rounded-lg bg-[hsl(var(--primary))] py-3 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Verify Code
            </Button>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
                  Resend code in{' '}
                  <span className="font-medium text-[hsl(var(--foreground))]">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[13px] font-medium text-[hsl(var(--primary))] transition-opacity duration-200 hover:opacity-80"
                >
                  Resend Code
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOrbState('idle');
                setVerificationCode('');
                setVerifyError('');
              }}
              className="w-full text-center text-[13px] text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]"
            >
              Back to registration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
