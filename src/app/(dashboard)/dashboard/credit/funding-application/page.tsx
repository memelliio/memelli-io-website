'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Hash,
  Factory,
  CalendarDays,
  DollarSign,
  CreditCard,
  Target,
  FileText,
  Upload,
  X,
  CheckCircle2,
  Clock,
  Search,
  Send,
  AlertCircle,
  ChevronRight,
  Banknote,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ApplicationStatus = 'draft' | 'submitted' | 'review' | 'approved' | 'funded';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface FormData {
  companyName: string;
  ein: string;
  industry: string;
  yearsInBusiness: string;
  monthlyRevenue: string;
  creditScoreRange: string;
  fundingAmount: string;
  fundingPurpose: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INDUSTRIES = [
  'Construction',
  'E-Commerce',
  'Food & Beverage',
  'Healthcare',
  'Manufacturing',
  'Professional Services',
  'Real Estate',
  'Retail',
  'Technology',
  'Transportation',
  'Other',
];

const CREDIT_SCORE_RANGES = [
  '750+',
  '700 - 749',
  '650 - 699',
  '600 - 649',
  'Below 600',
];

const FUNDING_PURPOSES = [
  'Working Capital',
  'Equipment Purchase',
  'Inventory',
  'Expansion',
  'Debt Consolidation',
  'Payroll',
  'Marketing',
  'Real Estate',
  'Other',
];

const STATUS_STEPS: { key: ApplicationStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'review', label: 'Under Review', icon: Search },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'funded', label: 'Funded', icon: Banknote },
];

const REQUIRED_DOCUMENTS = [
  { label: 'Business Bank Statements (3 months)', key: 'bank_statements' },
  { label: 'Business Tax Returns', key: 'tax_returns' },
  { label: 'Proof of Business Ownership', key: 'ownership_proof' },
  { label: 'Government-Issued ID', key: 'gov_id' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function statusIndex(status: ApplicationStatus): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

/* ------------------------------------------------------------------ */
/*  Form Field                                                         */
/* ------------------------------------------------------------------ */

function FormField({
  label,
  icon: Icon,
  required,
  error,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium tracking-tight text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Tracker                                                     */
/* ------------------------------------------------------------------ */

function StatusTracker({ status }: { status: ApplicationStatus }) {
  const currentIdx = statusIndex(status);

  return (
    <Card className="rounded-2xl border border-border bg-muted backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground tracking-tight">
          <Clock className="h-4 w-4 text-red-400" />
          Application Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isComplete = currentIdx > i;
            const isCurrent = currentIdx === i;
            const isPending = currentIdx < i;

            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isComplete
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : isCurrent
                          ? 'border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/10'
                          : 'border-border bg-muted'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <StepIcon
                        className={`h-5 w-5 ${
                          isCurrent ? 'text-red-400' : 'text-muted-foreground'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-tight ${
                      isComplete
                        ? 'text-emerald-400'
                        : isCurrent
                          ? 'text-red-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className="mx-2 mt-[-18px] h-0.5 flex-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete
                          ? 'bg-emerald-500/40'
                          : isCurrent
                            ? 'bg-gradient-to-r from-red-500/40 to-white/[0.06]'
                            : 'bg-muted'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {status === 'draft' && (
          <div className="mt-4 rounded-xl border border-border bg-muted px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Complete the form below and upload required documents to submit your application.
            </p>
          </div>
        )}

        {status !== 'draft' && (
          <div className="mt-4 rounded-xl border border-border bg-muted px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {status === 'submitted' && 'Your application has been received. A funding specialist will begin reviewing it shortly.'}
              {status === 'review' && 'Your application is being reviewed by our underwriting team. You may be contacted for additional information.'}
              {status === 'approved' && 'Congratulations! Your funding has been approved. Final disbursement is being processed.'}
              {status === 'funded' && 'Funds have been disbursed to your business account. Thank you for choosing Memelli.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Document Upload Section                                            */
/* ------------------------------------------------------------------ */

function DocumentUpload({
  files,
  onAdd,
  onRemove,
}: {
  files: UploadedFile[];
  onAdd: (newFiles: UploadedFile[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        type: f.type,
      }));
      onAdd(newFiles);
    },
    [onAdd],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  return (
    <Card className="rounded-2xl border border-border bg-muted backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground tracking-tight">
          <Upload className="h-4 w-4 text-red-400" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required checklist */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Required Documents
          </p>
          <ul className="space-y-1.5">
            {REQUIRED_DOCUMENTS.map((doc) => {
              const uploaded = files.some(
                (f) =>
                  f.name.toLowerCase().includes(doc.key.replace('_', ' ')) ||
                  f.name.toLowerCase().includes(doc.key.replace('_', '')),
              );
              return (
                <li key={doc.key} className="flex items-center gap-2 text-xs">
                  {uploaded ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-border" />
                  )}
                  <span className={uploaded ? 'text-foreground' : 'text-muted-foreground'}>
                    {doc.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
            dragOver
              ? 'border-red-500/40 bg-red-500/[0.04]'
              : 'border-border bg-muted hover:border-border hover:bg-muted'
          }`}
        >
          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium tracking-tight text-muted-foreground">
            Drop files here or click to browse
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            PDF, PNG, JPG up to 10MB each
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
        </div>

        {/* Uploaded files */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted px-3 py-2.5"
              >
                <div className="rounded-lg bg-muted p-1.5">
                  <FileText className="h-4 w-4 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium tracking-tight text-foreground">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => onRemove(file.id)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FundingApplicationPage() {
  const router = useRouter();
  const [applicationStatus] = useState<ApplicationStatus>('draft');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<FormData>({
    companyName: '',
    ein: '',
    industry: '',
    yearsInBusiness: '',
    monthlyRevenue: '',
    creditScoreRange: '',
    fundingAmount: '',
    fundingPurpose: '',
  });

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!form.ein.trim()) newErrors.ein = 'EIN is required';
    else if (!/^\d{2}-?\d{7}$/.test(form.ein.replace(/\s/g, '')))
      newErrors.ein = 'Enter a valid EIN (XX-XXXXXXX)';
    if (!form.industry) newErrors.industry = 'Select an industry';
    if (!form.yearsInBusiness) newErrors.yearsInBusiness = 'Required';
    if (!form.monthlyRevenue) newErrors.monthlyRevenue = 'Required';
    if (!form.creditScoreRange) newErrors.creditScoreRange = 'Select a range';
    if (!form.fundingAmount) newErrors.fundingAmount = 'Required';
    if (!form.fundingPurpose) newErrors.fundingPurpose = 'Select a purpose';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  const inputClass =
    'w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder-white/20 outline-none transition-all duration-200 focus:border-red-500/30 focus:bg-muted focus:ring-1 focus:ring-red-500/20';

  const selectClass =
    'w-full appearance-none rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:border-red-500/30 focus:bg-muted focus:ring-1 focus:ring-red-500/20';

  /* --- Submitted state --- */
  if (submitted) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Funding Application"
          subtitle="Business funding application and status tracking"
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Credit', href: '/dashboard/credit' },
            { label: 'Funding Application' },
          ]}
        />
        <StatusTracker status="submitted" />

        <Card className="rounded-2xl border border-border bg-muted backdrop-blur-xl">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Application Submitted
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Your funding application has been submitted successfully. Our team will review your
              information and reach out within 1-2 business days.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push('/dashboard/credit')}
                className="rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-border hover:bg-muted"
              >
                Back to Credit
              </button>
              <button
                onClick={() => router.push('/dashboard/credit/funding-pipeline')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:shadow-red-500/30 hover:brightness-110"
              >
                View Pipeline
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* --- Form state --- */
  return (
    <div className="space-y-8">
      <PageHeader
        title="Funding Application"
        subtitle="Apply for business funding — complete the form and upload required documents"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Credit', href: '/dashboard/credit' },
          { label: 'Funding Application' },
        ]}
      />

      <StatusTracker status={applicationStatus} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Business Information Form — spans 2 columns */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border border-border bg-muted backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground tracking-tight">
                <Building2 className="h-4 w-4 text-red-400" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Row 1: Company Name + EIN */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Company Name" icon={Building2} required error={errors.companyName}>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                    placeholder="Acme Corp LLC"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="EIN (Tax ID)" icon={Hash} required error={errors.ein}>
                  <input
                    type="text"
                    value={form.ein}
                    onChange={(e) => update('ein', e.target.value)}
                    placeholder="XX-XXXXXXX"
                    maxLength={10}
                    className={inputClass}
                  />
                </FormField>
              </div>

              {/* Row 2: Industry + Years in Business */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Industry" icon={Factory} required error={errors.industry}>
                  <select
                    value={form.industry}
                    onChange={(e) => update('industry', e.target.value)}
                    className={selectClass}
                  >
                    <option value="" className="bg-card">Select industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind} className="bg-card">
                        {ind}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Years in Business" icon={CalendarDays} required error={errors.yearsInBusiness}>
                  <select
                    value={form.yearsInBusiness}
                    onChange={(e) => update('yearsInBusiness', e.target.value)}
                    className={selectClass}
                  >
                    <option value="" className="bg-card">Select</option>
                    <option value="less_than_1" className="bg-card">Less than 1 year</option>
                    <option value="1_2" className="bg-card">1-2 years</option>
                    <option value="3_5" className="bg-card">3-5 years</option>
                    <option value="5_10" className="bg-card">5-10 years</option>
                    <option value="10_plus" className="bg-card">10+ years</option>
                  </select>
                </FormField>
              </div>

              {/* Row 3: Monthly Revenue + Credit Score Range */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Monthly Revenue" icon={DollarSign} required error={errors.monthlyRevenue}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input
                      type="text"
                      value={form.monthlyRevenue}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9,]/g, '');
                        update('monthlyRevenue', val);
                      }}
                      placeholder="25,000"
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </FormField>

                <FormField label="Credit Score Range" icon={CreditCard} required error={errors.creditScoreRange}>
                  <select
                    value={form.creditScoreRange}
                    onChange={(e) => update('creditScoreRange', e.target.value)}
                    className={selectClass}
                  >
                    <option value="" className="bg-card">Select range</option>
                    {CREDIT_SCORE_RANGES.map((range) => (
                      <option key={range} value={range} className="bg-card">
                        {range}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Row 4: Funding Amount + Funding Purpose */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Funding Amount Needed" icon={Target} required error={errors.fundingAmount}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input
                      type="text"
                      value={form.fundingAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9,]/g, '');
                        update('fundingAmount', val);
                      }}
                      placeholder="100,000"
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </FormField>

                <FormField label="Funding Purpose" icon={FileText} required error={errors.fundingPurpose}>
                  <select
                    value={form.fundingPurpose}
                    onChange={(e) => update('fundingPurpose', e.target.value)}
                    className={selectClass}
                  >
                    <option value="" className="bg-card">Select purpose</option>
                    {FUNDING_PURPOSES.map((purpose) => (
                      <option key={purpose} value={purpose} className="bg-card">
                        {purpose}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Submit area */}
              <div className="flex items-center justify-between border-t border-border pt-5">
                <p className="text-[10px] text-muted-foreground">
                  All fields marked with <span className="text-red-400">*</span> are required
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-sm font-medium tracking-tight text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:shadow-red-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Upload — right column */}
        <div className="lg:col-span-1">
          <DocumentUpload
            files={files}
            onAdd={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          />
        </div>
      </div>
    </div>
  );
}
