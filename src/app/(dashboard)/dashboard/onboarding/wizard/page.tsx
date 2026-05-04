'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Palette,
  LayoutGrid,
  Link2,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Upload,
  Check,
  Sparkles,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Twitter,
  ShoppingCart,
  Search,
  MessageSquare,
  GraduationCap,
  Users,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BusinessInfo {
  name: string;
  type: string;
  industry: string;
}

interface BrandSetup {
  logoFile: File | null;
  logoPreview: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
}

interface ModuleSelection {
  crm: boolean;
  commerce: boolean;
  seo: boolean;
  communications: boolean;
  coaching: boolean;
}

interface ConnectedAccounts {
  email: string;
  phone: string;
  instagram: string;
  facebook: string;
  twitter: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'Brand Setup', icon: Palette },
  { id: 3, label: 'Choose Modules', icon: LayoutGrid },
  { id: 4, label: 'Connect Accounts', icon: Link2 },
  { id: 5, label: 'Complete', icon: PartyPopper },
] as const;

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'LLC',
  'Corporation',
  'Partnership',
  'Nonprofit',
  'Freelancer',
  'Other',
];

const INDUSTRIES = [
  'Real Estate',
  'Financial Services',
  'E-Commerce',
  'Health & Wellness',
  'Technology',
  'Education',
  'Marketing & Advertising',
  'Consulting',
  'Construction',
  'Food & Beverage',
  'Other',
];

const MODULES = [
  {
    key: 'crm' as const,
    label: 'CRM',
    description: 'Manage contacts, deals, and pipelines',
    icon: Users,
  },
  {
    key: 'commerce' as const,
    label: 'Commerce',
    description: 'Stores, products, orders, and payments',
    icon: ShoppingCart,
  },
  {
    key: 'seo' as const,
    label: 'SEO & Traffic',
    description: 'Keyword clusters, AI articles, and rankings',
    icon: Search,
  },
  {
    key: 'communications' as const,
    label: 'Communications',
    description: 'Email, SMS, chat, and notifications',
    icon: MessageSquare,
  },
  {
    key: 'coaching' as const,
    label: 'Coaching',
    description: 'Programs, lessons, enrollments, and certificates',
    icon: GraduationCap,
  },
];

const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
];

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------

function ConfettiEffect() {
  const [particles, setParticles] = useState<
    { id: number; x: number; color: string; delay: number; duration: number; size: number }[]
  >([]);

  useEffect(() => {
    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];
    const p = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 4 + Math.random() * 8,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100dvh) rotate(720deg);
            opacity: 0;
          }
        }
      ` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({ currentStep }: { currentStep: number }) {
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="w-full mb-10">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${isComplete ? 'bg-red-500 text-white' : ''}
                  ${isCurrent ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50' : ''}
                  ${!isComplete && !isCurrent ? 'bg-white/5 text-white/30' : ''}
                `}
              >
                {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors duration-300 hidden sm:block ${
                  isCurrent ? 'text-red-400' : isComplete ? 'text-white/60' : 'text-white/30'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress track */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Business Info
// ---------------------------------------------------------------------------

function StepBusinessInfo({
  data,
  onChange,
}: {
  data: BusinessInfo;
  onChange: (d: BusinessInfo) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white/90">Tell us about your business</h2>
        <p className="text-white/40 text-sm mt-1">
          We&apos;ll use this to customize your experience.
        </p>
      </div>

      <div className="space-y-5">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">Business Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Enter your business name"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">Business Type</label>
          <select
            value={data.type}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/90 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition appearance-none"
          >
            <option value="" className="bg-card">
              Select business type
            </option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t} className="bg-card">
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">Industry</label>
          <select
            value={data.industry}
            onChange={(e) => onChange({ ...data, industry: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/90 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition appearance-none"
          >
            <option value="" className="bg-card">
              Select industry
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i} className="bg-card">
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Brand Setup
// ---------------------------------------------------------------------------

function StepBrandSetup({
  data,
  onChange,
}: {
  data: BrandSetup;
  onChange: (d: BrandSetup) => void;
}) {
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({ ...data, logoFile: file, logoPreview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white/90">Set up your brand</h2>
        <p className="text-white/40 text-sm mt-1">
          Upload a logo, pick your colors, and add a tagline.
        </p>
      </div>

      <div className="space-y-5">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">Logo</label>
          <label
            className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-red-500/40 transition group"
          >
            {data.logoPreview ? (
              <img
                src={data.logoPreview}
                alt="Logo preview"
                className="max-h-28 max-w-[200px] object-contain rounded"
              />
            ) : (
              <div className="flex flex-col items-center text-white/30 group-hover:text-white/50 transition">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">Click to upload logo</span>
                <span className="text-xs text-white/20 mt-0.5">PNG, JPG, SVG up to 2MB</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              Primary Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...data, primaryColor: c })}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    data.primaryColor === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={data.primaryColor}
                onChange={(e) => onChange({ ...data, primaryColor: e.target.value })}
                className="w-7 h-7 rounded-full border-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              Secondary Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...data, secondaryColor: c })}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    data.secondaryColor === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={data.secondaryColor}
                onChange={(e) => onChange({ ...data, secondaryColor: e.target.value })}
                className="w-7 h-7 rounded-full border-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">Tagline</label>
          <input
            type="text"
            value={data.tagline}
            onChange={(e) => onChange({ ...data, tagline: e.target.value })}
            placeholder="Your brand in a few words"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Choose Modules
// ---------------------------------------------------------------------------

function StepChooseModules({
  data,
  onChange,
}: {
  data: ModuleSelection;
  onChange: (d: ModuleSelection) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white/90">Choose your modules</h2>
        <p className="text-white/40 text-sm mt-1">
          Select the tools you want to activate. You can change this later.
        </p>
      </div>

      <div className="space-y-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = data[mod.key];
          return (
            <button
              key={mod.key}
              onClick={() => onChange({ ...data, [mod.key]: !isActive })}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left
                ${
                  isActive
                    ? 'bg-red-500/10 border-red-500/40 ring-1 ring-red-500/20'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20'
                }
              `}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/90">{mod.label}</div>
                <div className="text-xs text-white/40">{mod.description}</div>
              </div>
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                  isActive ? 'bg-red-500 border-red-500' : 'border-white/20'
                }`}
              >
                {isActive && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Connect Accounts
// ---------------------------------------------------------------------------

function StepConnectAccounts({
  data,
  onChange,
}: {
  data: ConnectedAccounts;
  onChange: (d: ConnectedAccounts) => void;
}) {
  const FIELDS = [
    { key: 'email' as const, label: 'Email Address', icon: Mail, placeholder: 'you@company.com', type: 'email' },
    { key: 'phone' as const, label: 'Phone Number', icon: Phone, placeholder: '+1 (555) 000-0000', type: 'tel' },
    { key: 'instagram' as const, label: 'Instagram', icon: Instagram, placeholder: '@yourhandle', type: 'text' },
    { key: 'facebook' as const, label: 'Facebook', icon: Facebook, placeholder: 'facebook.com/yourpage', type: 'text' },
    { key: 'twitter' as const, label: 'X / Twitter', icon: Twitter, placeholder: '@yourhandle', type: 'text' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white/90">Connect your accounts</h2>
        <p className="text-white/40 text-sm mt-1">
          Link your communication channels. All fields are optional.
        </p>
      </div>

      <div className="space-y-4">
        {FIELDS.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.key} className="relative">
              <label className="block text-sm font-medium text-white/60 mb-1.5">{field.label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={field.type}
                  value={data[field.key]}
                  onChange={(e) => onChange({ ...data, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Complete
// ---------------------------------------------------------------------------

function StepComplete({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center animate-pulse">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-white/95">You&apos;re all set!</h2>
        <p className="text-white/40 text-sm mt-2 max-w-md mx-auto">
          Your workspace is ready. Explore your dashboard, activate modules, and start building
          your universe.
        </p>
      </div>

      <button
        onClick={onGoToDashboard}
        className="mt-4 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98]"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard Page
// ---------------------------------------------------------------------------

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form state
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    type: '',
    industry: '',
  });

  const [brandSetup, setBrandSetup] = useState<BrandSetup>({
    logoFile: null,
    logoPreview: '',
    primaryColor: '#EF4444',
    secondaryColor: '#3B82F6',
    tagline: '',
  });

  const [modules, setModules] = useState<ModuleSelection>({
    crm: false,
    commerce: false,
    seo: false,
    communications: false,
    coaching: false,
  });

  const [accounts, setAccounts] = useState<ConnectedAccounts>({
    email: '',
    phone: '',
    instagram: '',
    facebook: '',
    twitter: '',
  });

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next === STEPS.length) {
        setShowConfetti(true);
        // Auto-dismiss confetti after 4 seconds
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleGoToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12">
      {showConfetti && <ConfettiEffect />}

      <div className="w-full max-w-2xl">
        {/* Progress */}
        <ProgressBar currentStep={currentStep} />

        {/* Step Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {/* Step Content */}
          {currentStep === 1 && (
            <StepBusinessInfo data={businessInfo} onChange={setBusinessInfo} />
          )}
          {currentStep === 2 && <StepBrandSetup data={brandSetup} onChange={setBrandSetup} />}
          {currentStep === 3 && <StepChooseModules data={modules} onChange={setModules} />}
          {currentStep === 4 && (
            <StepConnectAccounts data={accounts} onChange={setAccounts} />
          )}
          {currentStep === 5 && <StepComplete onGoToDashboard={handleGoToDashboard} />}

          {/* Navigation Buttons */}
          {currentStep < STEPS.length && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
              {/* Back */}
              <button
                onClick={goBack}
                disabled={currentStep === 1}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentStep === 1
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-3">
                {/* Skip */}
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-white/60 transition"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip
                </button>

                {/* Next */}
                <button
                  onClick={goNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm shadow-red-500/20 hover:shadow-red-500/30 active:scale-[0.97]"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-white/20 text-xs mt-4">
          Step {currentStep} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
