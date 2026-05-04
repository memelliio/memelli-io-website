'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Building2,
  FileText,
  MapPin,
  UserCheck,
  Users,
  ClipboardList,
  Clock,
  BadgeCheck,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const BUSINESS_TYPES = [
  {
    value: 'LLC',
    label: 'LLC',
    description: 'Limited Liability Company',
    detail: 'Flexible structure, personal liability protection, pass-through taxation.',
    popular: true,
  },
  {
    value: 'Corporation',
    label: 'Corporation',
    description: 'C-Corp or S-Corp',
    detail: 'Separate legal entity, ideal for investors, strict governance rules.',
    popular: false,
  },
  {
    value: 'Sole Proprietorship',
    label: 'Sole Proprietorship',
    description: 'Single-owner business',
    detail: 'Simplest form, no separation from personal assets, minimal filing.',
    popular: false,
  },
  {
    value: 'Partnership',
    label: 'Partnership',
    description: 'Two or more owners',
    detail: 'Shared ownership, flexible management, partners share profits & liability.',
    popular: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BusinessType {
  value: string;
}

interface BusinessName {
  primaryName: string;
  alternateName: string;
  purpose: string;
}

interface StateSelection {
  state: string;
}

interface RegisteredAgent {
  agentType: 'self' | 'service' | '';
  name: string;
  address: string;
  city: string;
  zip: string;
}

interface OwnerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ownershipPercent: string;
  address: string;
}

type StepKey = 'businessType' | 'businessName' | 'state' | 'registeredAgent' | 'ownerInfo' | 'review';

interface StepDef {
  key: StepKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepDef[] = [
  { key: 'businessType', label: 'Business Type', icon: Building2 },
  { key: 'businessName', label: 'Business Name', icon: FileText },
  { key: 'state', label: 'State', icon: MapPin },
  { key: 'registeredAgent', label: 'Registered Agent', icon: UserCheck },
  { key: 'ownerInfo', label: 'Owner Info', icon: Users },
  { key: 'review', label: 'Review & Submit', icon: ClipboardList },
];

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

function validateBusinessType(bt: BusinessType): string | null {
  if (!bt.value) return 'Please select a business type';
  return null;
}

function validateBusinessName(bn: BusinessName): string | null {
  if (!bn.primaryName.trim()) return 'Business name is required';
  if (!bn.purpose.trim()) return 'Please describe your business purpose';
  return null;
}

function validateState(ss: StateSelection): string | null {
  if (!ss.state) return 'Please select a state';
  return null;
}

function validateRegisteredAgent(ra: RegisteredAgent): string | null {
  if (!ra.agentType) return 'Please select a registered agent type';
  if (ra.agentType === 'self') {
    if (!ra.name.trim()) return 'Agent name is required';
    if (!ra.address.trim()) return 'Agent address is required';
    if (!ra.city.trim()) return 'City is required';
    if (!ra.zip.trim() || !/^\d{5}$/.test(ra.zip)) return 'Valid 5-digit ZIP code is required';
  }
  return null;
}

function validateOwnerInfo(oi: OwnerInfo): string | null {
  if (!oi.firstName.trim()) return 'First name is required';
  if (!oi.lastName.trim()) return 'Last name is required';
  if (!oi.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(oi.email))
    return 'Valid email is required';
  if (!oi.phone.trim() || oi.phone.replace(/\D/g, '').length < 10)
    return 'Valid phone number is required';
  if (!oi.ownershipPercent.trim()) return 'Ownership percentage is required';
  const pct = parseFloat(oi.ownershipPercent);
  if (isNaN(pct) || pct <= 0 || pct > 100) return 'Ownership must be between 1 and 100';
  if (!oi.address.trim()) return 'Address is required';
  return null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/* ------------------------------------------------------------------ */
/*  Shared UI Pieces                                                   */
/* ------------------------------------------------------------------ */

const inputClass =
  'w-full rounded-xl border border-border bg-muted backdrop-blur-xl px-3 py-2.5 text-sm text-foreground placeholder-white/20 focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all duration-200';

const selectClass =
  'w-full rounded-xl border border-border bg-muted backdrop-blur-xl px-3 py-2.5 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all duration-200 appearance-none cursor-pointer';

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isComplete = i < current;
          const isCurrent = i === current;
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isComplete
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : isCurrent
                        ? 'border-red-500/40 bg-red-500/10'
                        : 'border-border bg-muted'
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Icon
                      className={`h-4 w-4 ${isCurrent ? 'text-red-400' : 'text-muted-foreground'}`}
                    />
                  )}
                </div>
                <span
                  className={`hidden text-[10px] font-medium lg:block ${
                    isComplete
                      ? 'text-emerald-400/80'
                      : isCurrent
                        ? 'text-red-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-px flex-1 transition-all duration-300 ${
                    isComplete ? 'bg-emerald-500/30' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Linear progress */}
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
          style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <p className="text-right text-xs text-muted-foreground">
        Step {current + 1} of {STEPS.length}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Business Type                                             */
/* ------------------------------------------------------------------ */

function StepBusinessType({
  data,
  onChange,
}: {
  data: BusinessType;
  onChange: (v: BusinessType) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Choose Your Business Structure</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the entity type that best fits your goals.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {BUSINESS_TYPES.map((bt) => {
          const selected = data.value === bt.value;
          return (
            <button
              key={bt.value}
              type="button"
              onClick={() => onChange({ value: bt.value })}
              className={`relative rounded-2xl border p-4 text-left transition-all duration-200 ${
                selected
                  ? 'border-red-500/40 bg-red-500/[0.06] ring-1 ring-red-500/20'
                  : 'border-border bg-muted hover:border-border hover:bg-muted'
              }`}
            >
              {bt.popular && (
                <span className="absolute right-3 top-3 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                  Most Popular
                </span>
              )}
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    selected ? 'border-red-500 bg-red-500' : 'border-border'
                  }`}
                >
                  {selected && <Check className="h-3 w-3 text-foreground" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{bt.label}</p>
                  <p className="text-xs text-muted-foreground">{bt.description}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{bt.detail}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Business Name                                             */
/* ------------------------------------------------------------------ */

function StepBusinessName({
  data,
  onChange,
}: {
  data: BusinessName;
  onChange: (v: BusinessName) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Name Your Business</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your business name will be checked for availability with the Secretary of State.
        </p>
      </div>
      <div className="space-y-4">
        <FormField label="Primary Business Name" required>
          <input
            className={inputClass}
            placeholder="e.g. Acme Holdings LLC"
            value={data.primaryName}
            onChange={(e) => onChange({ ...data, primaryName: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Include your entity suffix (LLC, Inc., Corp.) if applicable.
          </p>
        </FormField>
        <FormField label="Alternate Name (optional)">
          <input
            className={inputClass}
            placeholder="Backup name if primary is unavailable"
            value={data.alternateName}
            onChange={(e) => onChange({ ...data, alternateName: e.target.value })}
          />
        </FormField>
        <FormField label="Business Purpose / Industry" required>
          <textarea
            className={`${inputClass} min-h-[80px] resize-none`}
            placeholder="Briefly describe what your business does (e.g. real estate investment, e-commerce retail, consulting services)"
            value={data.purpose}
            onChange={(e) => onChange({ ...data, purpose: e.target.value })}
          />
        </FormField>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — State Selection                                           */
/* ------------------------------------------------------------------ */

function StepStateSelection({
  data,
  onChange,
}: {
  data: StateSelection;
  onChange: (v: StateSelection) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Select Your State of Formation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the state where your business will be officially registered with the Secretary of
          State.
        </p>
      </div>
      <FormField label="State" required>
        <SelectWrapper>
          <select
            className={selectClass}
            value={data.state}
            onChange={(e) => onChange({ state: e.target.value })}
          >
            <option value="" className="bg-card text-muted-foreground">
              — Select a state —
            </option>
            {US_STATES.map((s) => (
              <option key={s} value={s} className="bg-card text-foreground">
                {s}
              </option>
            ))}
          </select>
        </SelectWrapper>
      </FormField>
      {data.state && (
        <div className="rounded-xl border border-border bg-muted p-4 space-y-1">
          <p className="text-sm font-semibold text-foreground">Filing in {data.state}</p>
          <p className="text-xs text-muted-foreground">
            We will guide you through the exact {data.state} Secretary of State filing process
            step-by-step. State fees typically range from $50–$500 and are paid directly to the
            state.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4 — Registered Agent                                         */
/* ------------------------------------------------------------------ */

function StepRegisteredAgent({
  data,
  onChange,
  state,
}: {
  data: RegisteredAgent;
  onChange: (v: RegisteredAgent) => void;
  state: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Registered Agent Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every {state || 'state'} business entity requires a registered agent to receive official
          legal documents.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            value: 'self' as const,
            label: 'Act as My Own Agent',
            detail: 'You use your own name & address. Your info becomes public record.',
          },
          {
            value: 'service' as const,
            label: 'Use a Registered Agent Service',
            detail: 'Keeps your personal address off public records. Recommended for privacy.',
          },
        ].map((opt) => {
          const selected = data.agentType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...data, agentType: opt.value })}
              className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                selected
                  ? 'border-red-500/40 bg-red-500/[0.06] ring-1 ring-red-500/20'
                  : 'border-border bg-muted hover:border-border hover:bg-muted'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    selected ? 'border-red-500 bg-red-500' : 'border-border'
                  }`}
                >
                  {selected && <Check className="h-3 w-3 text-foreground" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{opt.detail}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {data.agentType === 'self' && (
        <div className="space-y-4 rounded-2xl border border-border bg-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Agent Details
          </p>
          <FormField label="Full Legal Name" required>
            <input
              className={inputClass}
              placeholder="Your full name"
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
            />
          </FormField>
          <FormField label="Street Address" required>
            <input
              className={inputClass}
              placeholder="123 Main St, Suite 100"
              value={data.address}
              onChange={(e) => onChange({ ...data, address: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="City" required>
              <input
                className={inputClass}
                placeholder="City"
                value={data.city}
                onChange={(e) => onChange({ ...data, city: e.target.value })}
              />
            </FormField>
            <FormField label="ZIP Code" required>
              <input
                className={inputClass}
                placeholder="12345"
                maxLength={5}
                value={data.zip}
                onChange={(e) => onChange({ ...data, zip: e.target.value.replace(/\D/g, '') })}
              />
            </FormField>
          </div>
        </div>
      )}

      {data.agentType === 'service' && (
        <div className="rounded-2xl border border-border bg-muted p-4">
          <p className="text-sm text-foreground">
            We will guide you to a trusted registered agent service during the filing walkthrough.
            Many options are available starting at{' '}
            <span className="text-foreground font-medium">$0–$49/year</span>.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 5 — Owner / Member Info                                       */
/* ------------------------------------------------------------------ */

function StepOwnerInfo({
  data,
  onChange,
}: {
  data: OwnerInfo;
  onChange: (v: OwnerInfo) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Owner / Member Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Primary owner details for the Articles of Organization or Incorporation.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name" required>
            <input
              className={inputClass}
              placeholder="Jane"
              value={data.firstName}
              onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            />
          </FormField>
          <FormField label="Last Name" required>
            <input
              className={inputClass}
              placeholder="Smith"
              value={data.lastName}
              onChange={(e) => onChange({ ...data, lastName: e.target.value })}
            />
          </FormField>
        </div>
        <FormField label="Email Address" required>
          <input
            type="email"
            className={inputClass}
            placeholder="jane@example.com"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
          />
        </FormField>
        <FormField label="Phone Number" required>
          <input
            type="tel"
            className={inputClass}
            placeholder="(555) 000-0000"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: formatPhone(e.target.value) })}
          />
        </FormField>
        <FormField label="Ownership Percentage (%)" required>
          <input
            type="number"
            min={1}
            max={100}
            className={inputClass}
            placeholder="100"
            value={data.ownershipPercent}
            onChange={(e) => onChange({ ...data, ownershipPercent: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            For single-member LLCs this is typically 100%.
          </p>
        </FormField>
        <FormField label="Residential / Mailing Address" required>
          <input
            className={inputClass}
            placeholder="123 Main St, City, State ZIP"
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
          />
        </FormField>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 6 — Review & Submit                                           */
/* ------------------------------------------------------------------ */

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0 w-36">{label}</span>
      <span className="text-sm text-foreground text-right break-all">{value || '—'}</span>
    </div>
  );
}

function StepReview({
  businessType,
  businessName,
  stateSelection,
  registeredAgent,
  ownerInfo,
}: {
  businessType: BusinessType;
  businessName: BusinessName;
  stateSelection: StateSelection;
  registeredAgent: RegisteredAgent;
  ownerInfo: OwnerInfo;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Review Your Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm everything looks correct before we begin your filing walkthrough.
        </p>
      </div>

      {[
        {
          title: 'Business Structure',
          rows: [['Entity Type', businessType.value]],
        },
        {
          title: 'Business Name',
          rows: [
            ['Primary Name', businessName.primaryName],
            ['Alternate Name', businessName.alternateName || 'None'],
            ['Business Purpose', businessName.purpose],
          ],
        },
        {
          title: 'State of Formation',
          rows: [['State', stateSelection.state]],
        },
        {
          title: 'Registered Agent',
          rows:
            registeredAgent.agentType === 'service'
              ? [['Agent Type', 'Professional Service (guided during filing)']]
              : [
                  ['Agent Type', 'Self'],
                  ['Agent Name', registeredAgent.name],
                  ['Agent Address', `${registeredAgent.address}, ${registeredAgent.city} ${registeredAgent.zip}`],
                ],
        },
        {
          title: 'Owner / Member',
          rows: [
            ['Name', `${ownerInfo.firstName} ${ownerInfo.lastName}`],
            ['Email', ownerInfo.email],
            ['Phone', ownerInfo.phone],
            ['Ownership', `${ownerInfo.ownershipPercent}%`],
            ['Address', ownerInfo.address],
          ],
        },
      ].map((section) => (
        <div key={section.title} className="rounded-2xl border border-border bg-muted p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          {section.rows.map(([label, value]) => (
            <ReviewRow key={label} label={label} value={value} />
          ))}
        </div>
      ))}

      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-1">
        <p className="text-sm font-semibold text-red-400">Ready to Start Your Filing</p>
        <p className="text-xs text-muted-foreground">
          Clicking <span className="text-foreground font-medium">Submit</span> will dispatch your
          corporation setup to our system. We will reach out with your personalized step-by-step
          Secretary of State walkthrough.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirmation Screen                                                */
/* ------------------------------------------------------------------ */

function ConfirmationScreen({ businessName, state }: { businessName: string; state: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
        <CheckCircle className="h-10 w-10 text-emerald-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">You&apos;re All Set!</h2>
        <p className="text-foreground max-w-sm">
          Your Corporation Builder request for{' '}
          <span className="font-semibold text-foreground">{businessName}</span> in{' '}
          <span className="font-semibold text-foreground">{state}</span> has been dispatched to our
          system.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-muted p-6 w-full max-w-sm space-y-3">
        <p className="text-sm font-semibold text-foreground">What Happens Next</p>
        {[
          'We verify name availability with the Secretary of State',
          'Your personalized filing walkthrough is prepared',
          'You receive step-by-step guidance to complete the filing',
          'We monitor your application status',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400">
              {i + 1}
            </div>
            <p className="text-xs text-foreground text-left">{item}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="rounded-xl bg-muted px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CorporationBuilderPage() {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [businessType, setBusinessType] = useState<BusinessType>({ value: '' });
  const [businessName, setBusinessName] = useState<BusinessName>({
    primaryName: '',
    alternateName: '',
    purpose: '',
  });
  const [stateSelection, setStateSelection] = useState<StateSelection>({ state: '' });
  const [registeredAgent, setRegisteredAgent] = useState<RegisteredAgent>({
    agentType: '',
    name: '',
    address: '',
    city: '',
    zip: '',
  });
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ownershipPercent: '',
    address: '',
  });

  const currentStep = STEPS[stepIndex];

  function validateCurrentStep(): string | null {
    switch (currentStep.key) {
      case 'businessType':
        return validateBusinessType(businessType);
      case 'businessName':
        return validateBusinessName(businessName);
      case 'state':
        return validateState(stateSelection);
      case 'registeredAgent':
        return validateRegisteredAgent(registeredAgent);
      case 'ownerInfo':
        return validateOwnerInfo(ownerInfo);
      default:
        return null;
    }
  }

  function handleNext() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStepIndex((i) => i + 1);
  }

  function handleBack() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
      const res = await fetch(`${apiBase}/api/admin/command-center/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task: `Set up corporation for ${businessName.primaryName} in ${stateSelection.state}`,
          priority: 'high',
          metadata: {
            entityType: businessType.value,
            businessName: businessName.primaryName,
            alternateName: businessName.alternateName,
            purpose: businessName.purpose,
            state: stateSelection.state,
            registeredAgent: {
              type: registeredAgent.agentType,
              name: registeredAgent.name,
              address: registeredAgent.address,
              city: registeredAgent.city,
              zip: registeredAgent.zip,
            },
            owner: {
              name: `${ownerInfo.firstName} ${ownerInfo.lastName}`,
              email: ownerInfo.email,
              phone: ownerInfo.phone,
              ownershipPercent: ownerInfo.ownershipPercent,
              address: ownerInfo.address,
            },
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error ${res.status}`);
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <ConfirmationScreen
            businessName={businessName.primaryName}
            state={stateSelection.state}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Corporation Builder
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Secretary of State registration, guided step-by-step.
              </p>
            </div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <BadgeCheck className="h-3.5 w-3.5" />
                FREE — We guide you through the process
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Avg time: 15 minutes
              </span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <ProgressBar current={stepIndex} />

        {/* Step Card */}
        <Card className="rounded-2xl border border-border bg-muted backdrop-blur-xl">
          <CardContent className="p-6">
            {currentStep.key === 'businessType' && (
              <StepBusinessType data={businessType} onChange={setBusinessType} />
            )}
            {currentStep.key === 'businessName' && (
              <StepBusinessName data={businessName} onChange={setBusinessName} />
            )}
            {currentStep.key === 'state' && (
              <StepStateSelection data={stateSelection} onChange={setStateSelection} />
            )}
            {currentStep.key === 'registeredAgent' && (
              <StepRegisteredAgent
                data={registeredAgent}
                onChange={setRegisteredAgent}
                state={stateSelection.state}
              />
            )}
            {currentStep.key === 'ownerInfo' && (
              <StepOwnerInfo data={ownerInfo} onChange={setOwnerInfo} />
            )}
            {currentStep.key === 'review' && (
              <StepReview
                businessType={businessType}
                businessName={businessName}
                stateSelection={stateSelection}
                registeredAgent={registeredAgent}
                ownerInfo={ownerInfo}
              />
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={stepIndex === 0}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {currentStep.key !== 'review' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-red-500 active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-red-500 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit
                    </>
                  )}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          State filing fees (paid directly to the state) are separate and vary by state. Memelli
          charges $0 for this guided walkthrough.
        </p>
      </div>
    </div>
  );
}
