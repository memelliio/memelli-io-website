'use client';

import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  label,
  error,
  className,
  id,
}: SelectProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full appearance-none rounded-md border bg-zinc-900 px-3 py-2.5 md:py-2 text-base md:text-sm text-zinc-100',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500/60 focus:ring-red-500/50'
              : 'border-zinc-700 hover:border-zinc-600',
            !value && 'text-zinc-500'
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            className="h-4 w-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
