'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  User,
  FileText,
  ClipboardList,
  Send,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type EntityType =
  | 'sole_proprietor'
  | 'llc_single'
  | 'llc_multi'
  | 'c_corp'
  | 's_corp'
  | 'partnership'
  | 'nonprofit'
  | 'estate'
  | 'trust'
  | 'other';

type ApplyReason =
  | 'started_business'
  | 'banking'
  | 'hiring'
  | 'pension'
  | 'changed_structure'
  | 'acquired_business'
  | 'other';

interface Step1Data {
  entityType: EntityType | '';
  businessName: string;
  stateOfFormation: string;
  dateFormed: string;
}

interface Step2Data {
  responsiblePartyName: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface Step3Data {
  reason: ApplyReason | '';
  closingMonth: string;
  employeesExpected: string;
  agriculturalEmployees: string;
  householdEmployees: string;
  otherEmployees: string;
  firstWagesDate: string;
}

interface FormData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  einNumber: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ENTITY_TYPES: { value: EntityType; label: string; description: string }[] = [
  { value: 'sole_proprietor', label: 'Sole Proprietor', description: 'Individual with no separate business entity' },
  { value: 'llc_single', label: 'Single-Member LLC', description: 'One-owner limited liability company' },
  { value: 'llc_multi', label: 'Multi-Member LLC', description: 'Two or more owners in an LLC' },
  { value: 'c_corp', label: 'C Corporation', description: 'Standard corporation, separate tax entity' },
  { value: 's_corp', label: 'S Corporation', description: 'Pass-through taxation corporation' },
  { value: 'partnership', label: 'Partnership', description: 'Two or more persons carrying on a trade or business' },
  { value: 'nonprofit', label: 'Nonprofit / Church', description: 'Tax-exempt organization' },
  { value: 'estate', label: 'Estate', description: 'Estate of a deceased individual' },
  { value: 'trust', label: 'Trust', description: 'Legal arrangement for managing assets' },
  { value: 'other', label: 'Other', description: 'Other entity type not listed above' },
];

const APPLY_REASONS: { value: ApplyReason; label: string; description: string }[] = [
  { value: 'started_business', label: 'Started a new business', description: 'Just formed your entity and need a tax ID' },
  { value: 'banking', label: 'Banking purposes', description: 'Opening a business bank account' },
  { value: 'hiring', label: 'Hired or will hire employees', description: 'Need EIN for payroll and tax withholding' },
  { value: 'pension', label: 'Created a pension / retirement plan', description: 'Set up a 401(k) or other plan' },
  { value: 'changed_structure', label: 'Changed type of organization', description: 'Converted from sole prop, LLC, etc.' },
  { value: 'acquired_business', label: 'Purchased going business', description: 'Acquired an existing business' },
  { value: 'other', label: 'Other reason', description: 'Required by an agency, compliance, or legal' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const FISCAL_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STEP_CONFIG = [
  { id: 1, label: 'Entity Type', icon: Building2 },
  { id: 2, label: 'Responsible Party', icon: User },
  { id: 3, label: 'Reason', icon: FileText },
  { id: 4, label: 'SS-4 Preview', icon: ClipboardList },
  { id: 5, label: 'Apply', icon: Send },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function maskSSN(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function entityLabel(v: EntityType | ''): string {
  return ENTITY_TYPES.find((e) => e.value === v)?.label ?? '';
}

function reasonLabel(v: ApplyReason | ''): string {
  return APPLY_REASONS.find((r) => r.value === v)?.label ?? '';
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FreeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-400">
      <ShieldCheck className="h-3.5 w-3.5" />
      FREE — IRS does not charge for EIN
    </span>
  );
}

function TimeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Estimated 5–10 minutes
    </span>
  );
}

function ProgressStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_CONFIG.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = current > step.id;
        const isActive = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                  isCompleted
                    ? 'border-red-500 bg-red-500 text-white'
                    : isActive
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`hidden text-[10px] font-medium tracking-wide sm:block ${
                  isActive ? 'text-foreground' : isCompleted ? 'text-red-400/60' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEP_CONFIG.length - 1 && (
              <div
                className={`mx-1 h-px w-8 sm:w-12 transition-colors duration-300 ${
                  current > step.id ? 'bg-red-500/50' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldGroup({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-red-500/40 focus:bg-muted focus:ring-1 focus:ring-red-500/20"
    />
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 appearance-none cursor-pointer"
    >
      {children}
    </select>
  );
}

function NavButtons({
  step,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  loading = false,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {step > 1 ? (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-border hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
            Dispatching...
          </>
        ) : (
          <>
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Entity Type                                               */
/* ------------------------------------------------------------------ */

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: Step1Data;
  onChange: (d: Partial<Step1Data>) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Business Entity Type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the legal structure of your business. This determines your tax obligations and EIN application path.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ENTITY_TYPES.map((e) => (
          <button
            key={e.value}
            onClick={() => onChange({ entityType: e.value })}
            className={`rounded-xl border p-4 text-left transition-all duration-200 ${
              data.entityType === e.value
                ? 'border-red-500/40 bg-red-500/[0.06]'
                : 'border-border bg-muted hover:border-border hover:bg-muted'
            }`}
          >
            <p className={`text-sm font-medium ${data.entityType === e.value ? 'text-red-400' : 'text-foreground'}`}>
              {e.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="Legal Business Name">
          <TextInput
            value={data.businessName}
            onChange={(v) => onChange({ businessName: v })}
            placeholder="e.g. Acme Holdings LLC"
          />
        </FieldGroup>
        <FieldGroup label="State of Formation">
          <SelectInput value={data.stateOfFormation} onChange={(v) => onChange({ stateOfFormation: v })}>
            <option value="">Select state...</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectInput>
        </FieldGroup>
        <FieldGroup label="Date Formed / Acquired" hint="Leave blank if not yet formed">
          <TextInput
            value={data.dateFormed}
            onChange={(v) => onChange({ dateFormed: v })}
            type="date"
          />
        </FieldGroup>
      </div>

      <NavButtons
        step={1}
        onBack={() => {}}
        onNext={onNext}
        nextDisabled={!data.entityType || !data.businessName || !data.stateOfFormation}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Responsible Party                                         */
/* ------------------------------------------------------------------ */

function Step2({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: Step2Data;
  onChange: (d: Partial<Step2Data>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [showSSN, setShowSSN] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Responsible Party Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The IRS requires the name and SSN/ITIN of the individual who controls, manages, or directs the entity.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 flex gap-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          Your SSN is required by the IRS for EIN issuance. This information is stored securely and used only for
          your application. We never sell or share your personal data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="Full Legal Name">
          <TextInput
            value={data.responsiblePartyName}
            onChange={(v) => onChange({ responsiblePartyName: v })}
            placeholder="First Middle Last"
          />
        </FieldGroup>

        <FieldGroup label="Social Security Number (SSN)" hint="Format: XXX-XX-XXXX">
          <div className="relative">
            <input
              type={showSSN ? 'text' : 'password'}
              value={maskSSN(data.ssn)}
              onChange={(e) => onChange({ ssn: e.target.value.replace(/\D/g, '').slice(0, 9) })}
              placeholder="XXX-XX-XXXX"
              className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-red-500/40 focus:bg-muted focus:ring-1 focus:ring-red-500/20"
            />
            <button
              type="button"
              onClick={() => setShowSSN(!showSSN)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSSN ? 'Hide' : 'Show'}
            </button>
          </div>
        </FieldGroup>

        <FieldGroup label="Street Address">
          <TextInput
            value={data.address}
            onChange={(v) => onChange({ address: v })}
            placeholder="123 Main Street"
          />
        </FieldGroup>

        <FieldGroup label="City">
          <TextInput
            value={data.city}
            onChange={(v) => onChange({ city: v })}
            placeholder="City"
          />
        </FieldGroup>

        <FieldGroup label="State">
          <SelectInput value={data.state} onChange={(v) => onChange({ state: v })}>
            <option value="">Select state...</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectInput>
        </FieldGroup>

        <FieldGroup label="ZIP Code">
          <TextInput
            value={data.zip}
            onChange={(v) => onChange({ zip: v.replace(/\D/g, '').slice(0, 10) })}
            placeholder="00000"
          />
        </FieldGroup>
      </div>

      <NavButtons
        step={2}
        onBack={onBack}
        onNext={onNext}
        nextDisabled={
          !data.responsiblePartyName ||
          data.ssn.length < 9 ||
          !data.address ||
          !data.city ||
          !data.state ||
          !data.zip
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Reason for Applying                                       */
/* ------------------------------------------------------------------ */

function Step3({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: Step3Data;
  onChange: (d: Partial<Step3Data>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const showEmployeeFields =
    data.reason === 'hiring' || data.reason === 'started_business';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Reason for Applying</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The IRS requires the primary reason you are requesting an EIN. Select all that apply.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {APPLY_REASONS.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange({ reason: r.value })}
            className={`rounded-xl border p-4 text-left transition-all duration-200 ${
              data.reason === r.value
                ? 'border-red-500/40 bg-red-500/[0.06]'
                : 'border-border bg-muted hover:border-border hover:bg-muted'
            }`}
          >
            <p className={`text-sm font-medium ${data.reason === r.value ? 'text-red-400' : 'text-foreground'}`}>
              {r.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="Closing Month of Accounting Year">
          <SelectInput value={data.closingMonth} onChange={(v) => onChange({ closingMonth: v })}>
            <option value="">Select month...</option>
            {FISCAL_MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </SelectInput>
        </FieldGroup>

        {showEmployeeFields && (
          <>
            <FieldGroup label="Expected # of Employees (Agricultural)">
              <TextInput
                value={data.agriculturalEmployees}
                onChange={(v) => onChange({ agriculturalEmployees: v.replace(/\D/g, '') })}
                placeholder="0"
              />
            </FieldGroup>
            <FieldGroup label="Expected # of Employees (Household)">
              <TextInput
                value={data.householdEmployees}
                onChange={(v) => onChange({ householdEmployees: v.replace(/\D/g, '') })}
                placeholder="0"
              />
            </FieldGroup>
            <FieldGroup label="Expected # of Employees (Other)">
              <TextInput
                value={data.otherEmployees}
                onChange={(v) => onChange({ otherEmployees: v.replace(/\D/g, '') })}
                placeholder="0"
              />
            </FieldGroup>
            <FieldGroup label="Date First Wages Paid" hint="MM/DD/YYYY">
              <TextInput
                value={data.firstWagesDate}
                onChange={(v) => onChange({ firstWagesDate: v })}
                type="date"
              />
            </FieldGroup>
          </>
        )}
      </div>

      <NavButtons
        step={3}
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!data.reason || !data.closingMonth}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4 — SS-4 Preview                                              */
/* ------------------------------------------------------------------ */

function Step4({
  formData,
  onBack,
  onNext,
}: {
  formData: FormData;
  onBack: () => void;
  onNext: () => void;
}) {
  const { step1, step2, step3 } = formData;

  const rows: { label: string; value: string }[] = [
    { label: 'Line 1 — Legal name of entity', value: step1.businessName },
    { label: 'Line 3 — Executor / administrator / trustee / owner', value: step2.responsiblePartyName },
    { label: 'Line 4a — Mailing address', value: step2.address },
    { label: 'Line 4b — City, State, ZIP', value: `${step2.city}, ${step2.state} ${step2.zip}` },
    { label: 'Line 7a — Responsible party name', value: step2.responsiblePartyName },
    { label: 'Line 7b — Responsible party SSN/ITIN', value: `***-**-${step2.ssn.slice(-4)}` },
    { label: 'Line 8a — Entity type', value: entityLabel(step1.entityType) },
    { label: 'Line 10 — Reason for applying', value: reasonLabel(step3.reason) },
    { label: 'Line 11 — Date business started', value: step1.dateFormed || 'Not specified' },
    { label: 'Line 12 — Closing month of accounting year', value: step3.closingMonth || 'Not specified' },
    { label: 'Line 13 — Highest # of employees expected', value: String(
        (parseInt(step3.agriculturalEmployees || '0') +
         parseInt(step3.householdEmployees || '0') +
         parseInt(step3.otherEmployees || '0')) || 0
      )
    },
    { label: 'Line 16 — State where principal business located', value: step1.stateOfFormation },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">IRS Form SS-4 Summary Preview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the information that will be submitted to the IRS. This is a preview of your EIN application.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-muted overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Form SS-4</p>
            <p className="text-sm font-medium text-foreground">Application for Employer Identification Number</p>
          </div>
          <span className="rounded-lg border border-red-500/20 bg-red-500/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-red-400">
            Preview Only
          </span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-3">
              <p className="w-64 shrink-0 text-xs text-muted-foreground leading-5">{row.label}</p>
              <p className="text-sm font-medium text-foreground">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4 flex gap-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-blue-300">Important Notice</p>
          <p className="text-xs text-blue-300/60 leading-relaxed">
            The IRS Online EIN application is available Monday–Friday, 7 a.m. to 10 p.m. Eastern time. Your session
            will expire after 15 minutes of inactivity. Have this information ready before you begin.
          </p>
        </div>
      </div>

      <NavButtons step={4} onBack={onBack} onNext={onNext} nextLabel="Proceed to Apply" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 5 — Submit / Apply Guidance                                   */
/* ------------------------------------------------------------------ */

function Step5({
  formData,
  onBack,
  onSubmit,
  loading,
}: {
  formData: FormData;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">How to Apply for Your EIN</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The fastest way to get your EIN is directly through the IRS website — it&apos;s instant and free.
        </p>
      </div>

      {/* IRS Online Application Card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Option 1 (Recommended): IRS Online Application</p>
            <p className="text-xs text-muted-foreground">Get your EIN immediately — no waiting</p>
          </div>
        </div>
        <ol className="space-y-2 pl-1">
          {[
            'Go to the IRS EIN Online Application (link below)',
            'Select your entity type: ' + entityLabel(formData.step1.entityType),
            'Enter your business information as shown in the SS-4 preview',
            'Enter the responsible party name and SSN',
            'Select reason: ' + reasonLabel(formData.step3.reason),
            'Submit — your EIN will be displayed immediately',
            'Save or print your EIN confirmation letter (CP-575)',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                {i + 1}
              </span>
              <p className="text-sm text-foreground leading-5">{item}</p>
            </li>
          ))}
        </ol>
        <a
          href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/80 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600"
        >
          <ExternalLink className="h-4 w-4" />
          Open IRS EIN Application
        </a>
      </div>

      {/* Alternative methods */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            title: 'By Fax',
            detail: 'Fax SS-4 to (855) 641-6935. Receive EIN within 4 business days.',
          },
          {
            title: 'By Mail',
            detail: 'Mail SS-4 to IRS. Takes 4–6 weeks. Use only if cannot apply online.',
          },
          {
            title: 'By Phone',
            detail: 'International: (267) 941-1099. Mon–Fri 6am–11pm ET.',
          },
        ].map((m) => (
          <div
            key={m.title}
            className="rounded-xl border border-border bg-muted p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{m.title}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.detail}</p>
          </div>
        ))}
      </div>

      {/* Dispatch agent task */}
      <div className="rounded-xl border border-border bg-muted p-4 space-y-2">
        <p className="text-xs font-medium text-foreground">
          Click &quot;Dispatch Agent&quot; to queue an AI agent that will guide and assist with your EIN application process.
        </p>
      </div>

      <NavButtons
        step={5}
        onBack={onBack}
        onNext={onSubmit}
        nextLabel="Dispatch Agent"
        loading={loading}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Success Screen                                                     */
/* ------------------------------------------------------------------ */

function SuccessScreen({
  businessName,
  einNumber,
  onEINChange,
  onGoToDashboard,
}: {
  businessName: string;
  einNumber: string;
  onEINChange: (v: string) => void;
  onGoToDashboard: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function formatEIN(val: string): string {
    const d = val.replace(/\D/g, '').slice(0, 9);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}-${d.slice(2)}`;
  }

  function handleCopy() {
    if (einNumber) {
      navigator.clipboard.writeText(einNumber).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Agent Dispatched!</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your EIN application agent is queued for <span className="text-foreground">{businessName}</span>. Once the
          IRS provides your EIN, enter it below for your records.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Enter Your EIN (after IRS provides it)
        </p>
        <div className="relative">
          <input
            type="text"
            value={formatEIN(einNumber)}
            onChange={(e) => onEINChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="XX-XXXXXXX"
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-center text-lg font-mono tracking-[0.3em] text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
          />
          {einNumber.length === 9 && (
            <button
              onClick={handleCopy}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>
        {einNumber.length === 9 && (
          <p className="text-xs text-emerald-400">EIN saved to your records.</p>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <a
          href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-border hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          IRS Official EIN Application
        </a>
        <button
          onClick={onGoToDashboard}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:brightness-110"
        >
          Return to Credit Dashboard
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function EINWalkthroughPage() {
  const api = useApi();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    step1: {
      entityType: '',
      businessName: '',
      stateOfFormation: '',
      dateFormed: '',
    },
    step2: {
      responsiblePartyName: '',
      ssn: '',
      address: '',
      city: '',
      state: '',
      zip: '',
    },
    step3: {
      reason: '',
      closingMonth: '',
      employeesExpected: '',
      agriculturalEmployees: '0',
      householdEmployees: '0',
      otherEmployees: '0',
      firstWagesDate: '',
    },
    einNumber: '',
  });

  function patchStep1(d: Partial<Step1Data>) {
    setFormData((prev) => ({ ...prev, step1: { ...prev.step1, ...d } }));
  }
  function patchStep2(d: Partial<Step2Data>) {
    setFormData((prev) => ({ ...prev, step2: { ...prev.step2, ...d } }));
  }
  function patchStep3(d: Partial<Step3Data>) {
    setFormData((prev) => ({ ...prev, step3: { ...prev.step3, ...d } }));
  }

  async function handleDispatch() {
    setLoading(true);
    setDispatchError(null);
    try {
      const res = await api.post('/api/admin/command-center/dispatch', {
        task: `Apply for EIN for ${formData.step1.businessName}`,
        metadata: {
          entityType: formData.step1.entityType,
          businessName: formData.step1.businessName,
          stateOfFormation: formData.step1.stateOfFormation,
          responsibleParty: formData.step2.responsiblePartyName,
          reason: formData.step3.reason,
        },
      });
      if (res.error) throw new Error(res.error);
      setDone(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch agent';
      setDispatchError(message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <SuccessScreen
            businessName={formData.step1.businessName}
            einNumber={formData.einNumber}
            onEINChange={(v) => setFormData((p) => ({ ...p, einNumber: v }))}
            onGoToDashboard={() => router.push('/dashboard/credit')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <FreeBadge />
            <TimeBadge />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">EIN Walkthrough</h1>
          <p className="text-sm text-muted-foreground">
            An Employer Identification Number (EIN) is your business&apos;s federal tax ID. Required for banking,
            hiring, and building business credit. Apply directly with the IRS — always free.
          </p>
          <a
            href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors"
          >
            IRS Official EIN Information
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Progress Stepper */}
        <div className="flex justify-center">
          <ProgressStepper current={step} />
        </div>

        {/* Step Card */}
        <div className="rounded-2xl border border-border bg-muted backdrop-blur-xl p-6">
          {step === 1 && (
            <Step1
              data={formData.step1}
              onChange={patchStep1}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2
              data={formData.step2}
              onChange={patchStep2}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3
              data={formData.step3}
              onChange={patchStep3}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <Step4
              formData={formData}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}
          {step === 5 && (
            <Step5
              formData={formData}
              onBack={() => setStep(4)}
              onSubmit={handleDispatch}
              loading={loading}
            />
          )}

          {dispatchError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs text-red-300">{dispatchError}</p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-muted-foreground">
          Memelli OS — Engine 2: EIN Walkthrough &middot; IRS data is entered directly on the official IRS website.
          We never submit on your behalf without your action.
        </p>
      </div>
    </div>
  );
}
