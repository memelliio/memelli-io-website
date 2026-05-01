/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — Quick Add Contact collapsible form                               */
/*  Extracted from CrmPanel.tsx (refactor 2026-04-30).                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import { ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react';
import { card } from './CrmPanel.utils';
import { InputField, SectionHeader } from './CrmPanel.primitives';

export interface ContactFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
}

interface QuickAddContactProps {
  open: boolean;
  onToggle: () => void;
  contactForm: ContactFormState;
  contactFormError: string | null;
  contactFormSuccess: boolean;
  savingContact: boolean;
  handleContactFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitContact: (e: React.FormEvent) => void;
}

export function QuickAddContact({
  open,
  onToggle,
  contactForm,
  contactFormError,
  contactFormSuccess,
  savingContact,
  handleContactFormChange,
  submitContact,
}: QuickAddContactProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <SectionHeader>Quick Add Contact</SectionHeader>
        {open ? (
          <ChevronUp size={13} className="text-zinc-500" />
        ) : (
          <ChevronDown size={13} className="text-zinc-500" />
        )}
      </button>

      {open && (
        <form
          onSubmit={submitContact}
          className="px-3 pb-3 flex flex-col gap-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <InputField
              name="firstName"
              placeholder="First name"
              value={contactForm.firstName}
              onChange={handleContactFormChange}
            />
            <InputField
              name="lastName"
              placeholder="Last name"
              value={contactForm.lastName}
              onChange={handleContactFormChange}
            />
            <InputField
              name="email"
              placeholder="Email"
              value={contactForm.email}
              onChange={handleContactFormChange}
              type="email"
              className="col-span-2"
            />
            <InputField
              name="phone"
              placeholder="Phone"
              value={contactForm.phone}
              onChange={handleContactFormChange}
            />
            <InputField
              name="company"
              placeholder="Company"
              value={contactForm.company}
              onChange={handleContactFormChange}
            />
          </div>

          {contactFormError && (
            <p className="text-[10px] text-red-400 font-mono">
              {contactFormError}
            </p>
          )}
          {contactFormSuccess && (
            <p className="text-[10px] text-emerald-400 font-mono">
              Contact added.
            </p>
          )}

          <button
            type="submit"
            disabled={savingContact}
            className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#dc2626' }}
          >
            {savingContact ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Plus size={11} />
            )}
            Save Contact
          </button>
        </form>
      )}
    </div>
  );
}
