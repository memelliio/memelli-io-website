'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type QualField = 'name' | 'email' | 'phone' | 'state' | 'need' | 'amount';

interface QualificationCardProps {
  field: QualField;
  question: string;
  onSubmit: (value: string) => void;
  submitted?: boolean;
  submittedValue?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const INPUT_TYPE: Record<QualField, string> = {
  name: 'text',
  email: 'email',
  phone: 'tel',
  state: 'select',
  need: 'text',
  amount: 'text',
};

const PLACEHOLDER: Record<QualField, string> = {
  name: 'Your full name',
  email: 'you@example.com',
  phone: '(555) 123-4567',
  state: '',
  need: 'Describe your need',
  amount: '$0',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function QualificationCard({
  field,
  question,
  onSubmit,
  submitted = false,
  submittedValue,
}: QualificationCardProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  /* Collapsed / submitted state */
  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-700/20 bg-zinc-800/40
                      backdrop-blur-sm px-5 py-3.5 shadow-sm">
        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="text-[13px] font-medium tracking-tight text-zinc-200">
          {submittedValue ?? value}
        </span>
      </div>
    );
  }

  const inputType = INPUT_TYPE[field];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-700/40 bg-zinc-800/80 backdrop-blur-sm
                 p-5 space-y-4 shadow-lg shadow-black/10"
    >
      <p className="text-[13px] font-medium tracking-tight text-zinc-100 leading-relaxed">
        {question}
      </p>

      {inputType === 'select' ? (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl border border-zinc-600/60 bg-zinc-900/80 px-3.5 py-2.5
                     text-[13px] text-zinc-100 outline-none transition-colors
                     focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
        >
          <option value="">Select state...</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ) : (
        <input
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={PLACEHOLDER[field]}
          className="w-full rounded-xl border border-zinc-600/60 bg-zinc-900/80 px-3.5 py-2.5
                     text-[13px] text-zinc-100 placeholder-zinc-500 outline-none transition-colors
                     focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
        />
      )}

      <button
        type="submit"
        disabled={!value.trim()}
        className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-[13px] font-semibold
                   tracking-wide text-white shadow-md shadow-red-600/20
                   hover:bg-red-500 active:bg-red-700 transition-all duration-150
                   disabled:opacity-40 disabled:shadow-none"
      >
        Submit
      </button>
    </form>
  );
}
