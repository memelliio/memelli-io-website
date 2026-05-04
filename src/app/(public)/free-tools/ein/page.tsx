'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════════════
   DATA — IRS SS-4 walkthrough steps
   ══════════════════════════════════════════════════════════════════════ */

interface EINStep {
  id: number;
  title: string;
  subtitle: string;
  irsLabel: string;
  irsDescription: string;
  fields: StepField[];
  tip: string;
  irsScreenHint: string;
}

interface StepField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'radio' | 'tel' | 'email';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

const ENTITY_TYPES = [
  { value: 'sole_proprietor', label: 'Sole Proprietor / Individual' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'corporation', label: 'Corporation' },
  { value: 's_corp', label: 'S Corporation' },
  { value: 'llc', label: 'LLC' },
  { value: 'nonprofit', label: 'Nonprofit Organization' },
  { value: 'trust', label: 'Trust' },
  { value: 'estate', label: 'Estate' },
];

const REASONS_FOR_APPLYING = [
  { value: 'started_new_business', label: 'Started a new business' },
  { value: 'hired_employees', label: 'Hired employees' },
  { value: 'banking_purposes', label: 'Banking purposes only' },
  { value: 'changed_organization', label: 'Changed type of organization' },
  { value: 'purchased_business', label: 'Purchased active business' },
  { value: 'created_trust', label: 'Created a trust' },
  { value: 'created_pension_plan', label: 'Created a pension plan' },
  { value: 'compliance', label: 'Compliance with IRS withholding' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
].map((s) => ({ value: s, label: s }));

const STEPS: EINStep[] = [
  {
    id: 1,
    title: 'Select Your Entity Type',
    subtitle: 'This tells the IRS what kind of business structure you have.',
    irsLabel: 'IRS SS-4, Line 9a — Type of Entity',
    irsDescription: 'The IRS online application begins by asking you to identify your business structure. Select the entity type that matches your formation documents.',
    fields: [
      {
        name: 'entityType',
        label: 'Entity Type',
        type: 'select',
        options: ENTITY_TYPES,
        required: true,
      },
    ],
    tip: 'If you filed Articles of Organization with your state, you are an LLC. If you filed Articles of Incorporation, you are a Corporation.',
    irsScreenHint: 'You will see a page titled "Type of Legal Structure" with radio buttons for each entity type.',
  },
  {
    id: 2,
    title: 'Reason for Applying',
    subtitle: 'Why do you need an EIN? The IRS uses this to classify your account.',
    irsLabel: 'IRS SS-4, Line 10 — Reason for Applying',
    irsDescription: 'The IRS needs to know why you are requesting an EIN. Most new businesses select "Started a new business." If you just need an EIN for a bank account, select "Banking purposes only."',
    fields: [
      {
        name: 'reasonForApplying',
        label: 'Reason for Applying',
        type: 'select',
        options: REASONS_FOR_APPLYING,
        required: true,
      },
    ],
    tip: 'Selecting "Started a new business" is the most common choice for new LLCs and corporations.',
    irsScreenHint: 'You will see a dropdown or radio list titled "Reason for Applying."',
  },
  {
    id: 3,
    title: 'Responsible Party Information',
    subtitle: 'The IRS requires one individual as the responsible party for the EIN.',
    irsLabel: 'IRS SS-4, Lines 1 & 7a — Responsible Party',
    irsDescription: 'The responsible party is the person who controls, manages, or directs the entity. For an LLC, this is typically the managing member. For a corporation, it is usually the president or principal officer. The IRS requires a valid SSN or ITIN for this person.',
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', placeholder: 'John', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Smith', required: true },
      { name: 'ssn', label: 'SSN or ITIN (for IRS verification)', type: 'text', placeholder: 'XXX-XX-XXXX', required: true },
    ],
    tip: 'The responsible party MUST be an individual, not another business entity. You will need your Social Security Number or ITIN.',
    irsScreenHint: 'The IRS page will show fields for "Name of responsible party" and "SSN, ITIN, or EIN."',
  },
  {
    id: 4,
    title: 'Business Name & Address',
    subtitle: 'Enter your legal business name exactly as it appears on your formation documents.',
    irsLabel: 'IRS SS-4, Lines 1-3 — Legal Name & Address',
    irsDescription: 'Enter the exact legal name of your entity as registered with your state. The trade name (DBA) is optional. The mailing address should be where you want to receive IRS correspondence.',
    fields: [
      { name: 'legalName', label: 'Legal Business Name', type: 'text', placeholder: 'My Business LLC', required: true },
      { name: 'tradeName', label: 'Trade Name / DBA (optional)', type: 'text', placeholder: 'My Business' },
      { name: 'address', label: 'Street Address', type: 'text', placeholder: '123 Main St', required: true },
      { name: 'city', label: 'City', type: 'text', placeholder: 'Houston', required: true },
      { name: 'state', label: 'State', type: 'select', options: US_STATES, required: true },
      { name: 'zip', label: 'ZIP Code', type: 'text', placeholder: '77001', required: true },
    ],
    tip: 'Use your LEGAL name, not a nickname. If your LLC was filed as "Smith Enterprises LLC" then enter exactly that.',
    irsScreenHint: 'The IRS page will show separate fields for Legal Name, Trade Name, and a full mailing address block.',
  },
  {
    id: 5,
    title: 'Business Details',
    subtitle: 'A few more details about your business activity and start date.',
    irsLabel: 'IRS SS-4, Lines 11-18 — Business Information',
    irsDescription: 'The IRS asks when your business started (or will start), what your primary activity is, and whether you expect to have employees. Answer honestly — this determines your filing requirements.',
    fields: [
      { name: 'startDate', label: 'Date Business Started (or will start)', type: 'text', placeholder: 'MM/DD/YYYY', required: true },
      { name: 'businessActivity', label: 'Primary Business Activity', type: 'text', placeholder: 'e.g., Consulting, Real Estate, Retail', required: true },
      { name: 'hasEmployees', label: 'Will you have employees in the next 12 months?', type: 'radio', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], required: true },
    ],
    tip: 'If you are unsure about employees, select "No" for now. You can update this later.',
    irsScreenHint: 'You will see date fields, a text box for describing your business, and Yes/No radio buttons for employees.',
  },
  {
    id: 6,
    title: 'Review & Apply',
    subtitle: 'Confirm everything looks correct, then apply directly on IRS.gov.',
    irsLabel: 'Final Review — Ready to Submit',
    irsDescription: 'Before submitting on the IRS website, review all your information. The IRS online EIN application is available Monday-Friday, 7am-10pm Eastern Time. You will receive your EIN immediately upon successful completion.',
    fields: [],
    tip: 'Save or screenshot your EIN confirmation. The IRS will also mail a confirmation letter (CP 575) within 4-6 weeks.',
    irsScreenHint: 'The final IRS page will show a summary of all your entries with a "Submit" button.',
  },
];

/* ══════════════════════════════════════════════════════════════════════
   INLINE SVG ICONS (no external dependency)
   ══════════════════════════════════════════════════════════════════════ */

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function LightBulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  );
}

function VideoCameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP ICONS MAP
   ══════════════════════════════════════════════════════════════════════ */

const STEP_ICONS = [BuildingIcon, ClipboardIcon, UserIcon, MapPinIcon, BriefcaseIcon, CheckIcon];

/* ══════════════════════════════════════════════════════════════════════
   LEAD CAPTURE MODAL
   ══════════════════════════════════════════════════════════════════════ */

function LeadCaptureModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    setSubmitted(true);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8"
      >
        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckIcon className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">You are all set</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Click the button below to open the IRS EIN application. Use the guide on this page to walk through each step.
            </p>
            <a
              href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500"
            >
              Open IRS EIN Application
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="mt-4 block w-full text-center text-sm text-muted-foreground transition-colors hover:text-muted-foreground"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-white">Get Your Free EIN</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your info below and we will send you a direct link to the IRS application, plus a PDF checklist of exactly what to enter.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                  placeholder="(555) 123-4567"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500"
              >
                Get My Free EIN Link & Checklist
              </button>
            </form>
            <button
              onClick={onClose}
              className="mt-4 block w-full text-center text-sm text-muted-foreground transition-colors hover:text-muted-foreground"
            >
              Cancel
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   VOICE AGENT HELP BUTTON
   ══════════════════════════════════════════════════════════════════════ */

function VoiceAgentButton() {
  const [active, setActive] = useState(false);

  return (
    <button
      onClick={() => setActive(!active)}
      className={`fixed bottom-20 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-2xl transition-all duration-300 md:bottom-8 ${
        active
          ? 'bg-red-600 text-white shadow-red-600/30'
          : 'border border-border bg-card text-muted-foreground backdrop-blur-xl hover:border-border hover:text-white'
      }`}
    >
      <MicrophoneIcon className="h-5 w-5" />
      {active ? 'Listening...' : 'Ask Melli for Help'}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   IRS SCREEN PREVIEW CARD
   ══════════════════════════════════════════════════════════════════════ */

function IRSScreenPreview({ step }: { step: EINStep }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="ml-2 text-[11px] text-muted-foreground">irs.gov/ein-application</span>
      </div>

      {/* Simulated IRS page */}
      <div className="rounded-xl border border-blue-900/20 bg-[#0a0e1a] p-5">
        <div className="mb-3 flex items-center gap-2 border-b border-blue-900/20 pb-3">
          <ShieldIcon className="h-4 w-4 text-blue-400/60" />
          <span className="text-xs font-medium text-blue-300/60">IRS.gov - EIN Application</span>
        </div>
        <p className="text-xs font-medium text-muted-foreground">{step.irsLabel}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{step.irsScreenHint}</p>

        {/* Simulated form fields */}
        <div className="mt-4 space-y-2">
          {step.fields.length > 0 ? (
            step.fields.slice(0, 3).map((f) => (
              <div key={f.name} className="rounded-lg border border-blue-900/15 bg-blue-950/20 px-3 py-2">
                <span className="text-[10px] text-blue-300/40">{f.label}</span>
                <div className="mt-0.5 h-2 w-2/3 rounded bg-blue-900/20" />
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-emerald-900/20 bg-emerald-950/20 px-4 py-3 text-center">
              <CheckIcon className="mx-auto h-5 w-5 text-emerald-400/60" />
              <span className="mt-1 block text-[10px] text-emerald-300/50">Ready to submit</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP CONTENT COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

function StepContent({
  step,
  formData,
  onFieldChange,
}: {
  step: EINStep;
  formData: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
}) {
  const Icon = STEP_ICONS[step.id - 1] ?? CheckIcon;

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Step header */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <Icon className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <span className="text-xs font-medium text-red-400">Step {step.id} of {STEPS.length}</span>
            <h2 className="text-xl font-semibold text-white">{step.title}</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{step.subtitle}</p>
      </div>

      {/* IRS context card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{step.irsLabel}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{step.irsDescription}</p>
      </div>

      {/* Form fields */}
      {step.fields.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Practice filling it out here</p>
          {step.fields.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                {field.label}
                {field.required && <span className="ml-1 text-red-400">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  value={formData[field.name] ?? ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white outline-none transition-colors focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'radio' ? (
                <div className="flex gap-4">
                  {field.options?.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all duration-200 ${
                        formData[field.name] === opt.value
                          ? 'border-red-500/30 bg-red-500/10 text-white'
                          : 'border-border bg-muted text-muted-foreground hover:border-border'
                      }`}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={opt.value}
                        checked={formData[field.name] === opt.value}
                        onChange={(e) => onFieldChange(field.name, e.target.value)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          formData[field.name] === opt.value
                            ? 'border-red-400 bg-red-500'
                            : 'border-zinc-600'
                        }`}
                      >
                        {formData[field.name] === opt.value && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      {opt.label}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review summary (step 6) */}
      {step.id === 6 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your information summary</p>
          {[
            { label: 'Entity Type', key: 'entityType' },
            { label: 'Reason', key: 'reasonForApplying' },
            { label: 'Name', key: 'firstName', suffix: 'lastName' },
            { label: 'Business', key: 'legalName' },
            { label: 'Address', key: 'address', suffix: 'city' },
            { label: 'Activity', key: 'businessActivity' },
          ].map((item) => {
            const val = formData[item.key]
              ? item.suffix
                ? `${formData[item.key]} ${formData[item.suffix] ?? ''}`
                : formData[item.key]
              : '';
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3"
              >
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-sm text-foreground">{val || '--'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tip card */}
      <div className="flex gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-4">
        <LightBulbIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
        <div>
          <p className="text-xs font-medium text-amber-300">Pro Tip</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.tip}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function FreeEINPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const step = STEPS[currentStep];

  function handleFieldChange(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function goNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function goPrev() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleLeadSubmit(data: { name: string; email: string; phone: string }) {
    // Store lead data locally and fire to API when available
    if (typeof window !== 'undefined') {
      try {
        const leads = JSON.parse(localStorage.getItem('memelli_ein_leads') ?? '[]');
        leads.push({ ...data, formData, timestamp: new Date().toISOString() });
        localStorage.setItem('memelli_ein_leads', JSON.stringify(leads));
      } catch {
        // silently fail
      }
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-20 pt-28">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[700px] w-[700px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="pointer-events-none absolute -top-40 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-5 py-2 text-sm text-muted-foreground backdrop-blur-xl">
            <ShieldIcon className="h-4 w-4 text-emerald-400" />
            100% Free - Straight from the IRS
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Get Your EIN
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Step-by-Step Guide
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            An EIN (Employer Identification Number) is free from the IRS. No paid service needed.
            This guide walks you through the exact IRS SS-4 form so you know what to enter on every screen.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => {
                contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500"
            >
              Start the Walkthrough
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <a
              href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:text-white"
            >
              Go Directly to IRS.gov
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
              No paid services
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
              IRS issues EIN instantly
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
              Available Mon-Fri 7am-10pm ET
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
              SSN or ITIN required
            </span>
          </div>
        </div>
      </section>

      {/* ── Step-by-Step Walkthrough ── */}
      <section ref={contentRef} className="px-6 pb-20 pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* ── Left: Step Navigation ── */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-1">
                <p className="mb-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Walkthrough Steps</p>
                {STEPS.map((s, idx) => {
                  const Icon = STEP_ICONS[idx];
                  const isActive = idx === currentStep;
                  const isComplete = idx < currentStep;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setCurrentStep(idx)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-red-500/10 text-white'
                          : isComplete
                          ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          : 'text-muted-foreground hover:bg-white/[0.02] hover:text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? 'bg-red-500/20'
                            : isComplete
                            ? 'bg-emerald-500/10'
                            : 'bg-muted'
                        }`}
                      >
                        {isComplete ? (
                          <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-red-400' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      <span className="truncate">{s.title}</span>
                    </button>
                  );
                })}

                {/* Screen recording teaser */}
                <div className="mt-6 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <VideoCameraIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Video Walkthrough</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    Watch a screen recording of the full IRS application process so you can see exactly what each page looks like.
                  </p>
                  <button className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-400 transition-colors hover:text-red-300">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* ── Center: Step Content ── */}
            <div className="lg:col-span-5">
              <AnimatePresence mode="wait">
                <StepContent
                  step={step}
                  formData={formData}
                  onFieldChange={handleFieldChange}
                />
              </AnimatePresence>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    currentStep === 0
                      ? 'cursor-not-allowed text-muted-foreground'
                      : 'border border-border text-muted-foreground hover:border-border hover:text-white'
                  }`}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Previous
                </button>

                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={goNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500"
                  >
                    Next Step
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setLeadModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500"
                  >
                    Get Your Free EIN
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Right: IRS Screen Preview ── */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div>
                  <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">What the IRS page looks like</p>
                  <IRSScreenPreview step={step} />
                </div>

                {/* Progress */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-violet-500"
                      initial={false}
                      animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* CTA card */}
                <div className="rounded-xl border border-red-500/10 bg-red-500/[0.04] p-5 text-center">
                  <h3 className="text-sm font-semibold text-white">Ready to apply?</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Once you have reviewed each step, click below to open the real IRS application.
                  </p>
                  <button
                    onClick={() => setLeadModalOpen(true)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500"
                  >
                    Get Your Free EIN
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Is getting an EIN really free?',
                a: 'Yes. The IRS issues EINs at no cost. Any website that charges you for an EIN is acting as a paid middleman. You can apply directly at IRS.gov for free.',
              },
              {
                q: 'How long does it take to get an EIN?',
                a: 'If you apply online, you will receive your EIN immediately after submitting. The IRS online application is available Monday through Friday, 7:00 AM to 10:00 PM Eastern Time.',
              },
              {
                q: 'Do I need an EIN?',
                a: 'You need an EIN if you have employees, operate as a corporation or partnership, file certain tax returns (excise, employment, alcohol/tobacco/firearms), or withhold taxes on non-wage income to a non-resident alien. Most LLCs and businesses need one.',
              },
              {
                q: 'What do I need before applying?',
                a: 'You need a valid Social Security Number (SSN) or Individual Taxpayer Identification Number (ITIN), your legal business name, business address, entity type, and the reason you are applying.',
              },
              {
                q: 'Can I apply if I am a sole proprietor?',
                a: 'Yes. Sole proprietors can apply for an EIN. It is often recommended even if you do not have employees, as it allows you to open a business bank account without using your SSN.',
              },
              {
                q: 'What is the SS-4 form?',
                a: 'Form SS-4 is the IRS form used to apply for an Employer Identification Number. When you apply online, the IRS walks you through the same questions that are on the paper SS-4 form.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-card transition-colors open:border-border"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop paying for something that is{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              completely free
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            The IRS does not charge a single dollar for an EIN. Use our walkthrough, apply directly, and keep your money.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => setLeadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500"
            >
              Get Your Free EIN
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:text-white"
            >
              Need help forming your business?
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Modals & Floating Elements ── */}
      <LeadCaptureModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onSubmit={handleLeadSubmit}
      />
      <VoiceAgentButton />
    </div>
  );
}
