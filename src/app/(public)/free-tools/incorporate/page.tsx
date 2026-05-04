'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@memelli/ui';
import {
  Building2,
  FileText,
  Globe,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mic,
  Monitor,
  Shield,
  Clock,
  MapPin,
  ExternalLink,
  Play,
  Video,
} from 'lucide-react';

/* ──────────────────────────── STATE DATA ──────────────────────────── */

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

/* ──────────────────────────── SOS WEBSITE DATA ──────────────────────────── */

const SOS_WEBSITES: Record<string, string> = {
  AL: 'https://www.sos.alabama.gov/business-entities',
  AK: 'https://www.commerce.alaska.gov/web/cbpl/corporations',
  AZ: 'https://azcc.gov/divisions/corporations',
  AR: 'https://www.sos.arkansas.gov/corps/search_all.php',
  CA: 'https://bizfileonline.sos.ca.gov',
  CO: 'https://www.sos.state.co.us/biz',
  CT: 'https://portal.ct.gov/SOTS/Business-Services',
  DE: 'https://corp.delaware.gov',
  FL: 'https://dos.fl.gov/sunbiz/',
  GA: 'https://ecorp.sos.ga.gov',
  HI: 'https://hbe.ehawaii.gov/documents/search.html',
  ID: 'https://sosbiz.idaho.gov/search/business',
  IL: 'https://www.ilsos.gov/corporatellc/',
  IN: 'https://inbiz.in.gov/BOS/Home/Index',
  IA: 'https://sos.iowa.gov/search/business/search.aspx',
  KS: 'https://www.sos.ks.gov/businesses.html',
  KY: 'https://web.sos.ky.gov/bussearchnew/search',
  LA: 'https://www.sos.la.gov/BusinessServices',
  ME: 'https://www.maine.gov/sos/cec/corp/',
  MD: 'https://egov.maryland.gov/BusinessExpress',
  MA: 'https://corp.sec.state.ma.us/corpweb/CorpSearch/CorpSearch.aspx',
  MI: 'https://cofs.lara.state.mi.us/SearchApi/Search/Search',
  MN: 'https://mblsportal.sos.state.mn.us',
  MS: 'https://charterportal.sos.ms.gov',
  MO: 'https://bsd.sos.mo.gov/BusinessEntity/BESearch.aspx',
  MT: 'https://sosmt.gov/business/',
  NE: 'https://www.sos.ne.gov/business/',
  NV: 'https://www.nvsos.gov/sos/businesses',
  NH: 'https://quickstart.sos.nh.gov/',
  NJ: 'https://www.njportal.com/DOR/businessformation',
  NM: 'https://portal.sos.state.nm.us',
  NY: 'https://dos.ny.gov/corporations-entity-search',
  NC: 'https://www.sosnc.gov/online_services/search/by_title/_Business_Registration',
  ND: 'https://firststop.sos.nd.gov/',
  OH: 'https://businesssearch.ohiosos.gov',
  OK: 'https://www.sos.ok.gov/business/default.aspx',
  OR: 'https://sos.oregon.gov/business/',
  PA: 'https://www.dos.pa.gov/BusinessCharities',
  RI: 'https://business.sos.ri.gov/',
  SC: 'https://businessfilings.sc.gov/',
  SD: 'https://sosenterprise.sd.gov/BusinessServices',
  TN: 'https://tnbear.tn.gov/NewBearSearch/',
  TX: 'https://www.sos.state.tx.us/corp/sosda/index.shtml',
  UT: 'https://secure.utah.gov/bes/',
  VT: 'https://sos.vermont.gov/corporations/',
  VA: 'https://cis.scc.virginia.gov/',
  WA: 'https://ccfs.sos.wa.gov/',
  WV: 'https://apps.wv.gov/SOS/BusinessEntitySearch/',
  WI: 'https://www.wdfi.org/apps/CorpSearch/',
  WY: 'https://wyobiz.wyo.gov/Business/FilingSearch.aspx',
};

/* ──────────────────────────── WALKTHROUGH STEPS PER STATE ──────────────────────────── */

interface WalkthroughStep {
  title: string;
  description: string;
  detail: string;
  screenshot: string;
  tip?: string;
}

function getStepsForState(stateCode: string): WalkthroughStep[] {
  const stateName = US_STATES.find(s => s.value === stateCode)?.label ?? stateCode;
  const sosUrl = SOS_WEBSITES[stateCode] ?? '#';

  return [
    {
      title: 'Name Availability Search',
      description: `Check if your business name is available in ${stateName}`,
      detail: `Go to the ${stateName} Secretary of State website and use the business entity search tool. Enter your desired business name to verify it is not already taken. Most states require the name to be distinguishable from existing entities. If your name is taken, try adding a descriptor like "Group", "Holdings", or "Solutions".`,
      screenshot: sosUrl,
      tip: `Search for exact and similar names. "${stateName}" may reject names too similar to existing businesses.`,
    },
    {
      title: 'Choose Your Entity Type',
      description: 'Select LLC, Corporation, or other structure',
      detail: `On the ${stateName} filing portal, you will select your entity type. For most small businesses, an LLC provides the best balance of liability protection and tax flexibility. Corporations (C-Corp or S-Corp) are better for businesses seeking investors. Select "Domestic LLC" or "Domestic Corporation" depending on your needs.`,
      screenshot: sosUrl,
      tip: 'LLC is the most popular choice for new businesses. It offers pass-through taxation and personal liability protection.',
    },
    {
      title: 'Fill Out Articles of Organization',
      description: 'Complete the formation document with your business details',
      detail: `The Articles of Organization (LLC) or Articles of Incorporation (Corporation) is the official formation document. You will need: your business name, principal office address, registered agent name and address, organizer/incorporator name, and management structure (member-managed or manager-managed for LLCs). Fill in each field carefully.`,
      screenshot: sosUrl,
      tip: 'Your registered agent must have a physical address in the state (not a PO Box). You can be your own registered agent.',
    },
    {
      title: 'Designate a Registered Agent',
      description: 'Appoint someone to receive legal documents on behalf of your business',
      detail: `Every ${stateName} business entity must have a registered agent with a physical street address in the state. The registered agent receives legal notices, tax documents, and official correspondence. You can serve as your own registered agent, use a trusted person, or hire a registered agent service (typically $50-150/year).`,
      screenshot: sosUrl,
      tip: 'If you work from home and do not want your address on public record, consider a registered agent service.',
    },
    {
      title: 'Pay the Filing Fee',
      description: `Submit your filing and pay the ${stateName} state fee`,
      detail: `Review all information for accuracy, then proceed to payment. ${stateName} accepts credit/debit cards for online filings. Filing fees vary by state and entity type (typically $50-500 for LLCs, $50-300 for corporations). After payment, you will receive a confirmation number. Processing times range from same-day to 4-6 weeks depending on the state.`,
      screenshot: sosUrl,
      tip: 'Save your confirmation number. You will need it to check filing status and make future amendments.',
    },
    {
      title: 'Get Your EIN (Federal Tax ID)',
      description: 'Apply for a free Employer Identification Number from the IRS',
      detail: 'After your state filing is approved, apply for an EIN on the IRS website (irs.gov/ein). This is free and takes about 5 minutes online. You need an EIN to open a business bank account, hire employees, and file taxes. The online application is available Monday-Friday, 7am-10pm ET. You will receive your EIN immediately upon completion.',
      screenshot: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
      tip: 'The IRS EIN application is completely free. Never pay a third party to obtain your EIN.',
    },
    {
      title: 'Open a Business Bank Account',
      description: 'Separate your personal and business finances',
      detail: `Bring your approved Articles of Organization/Incorporation, EIN confirmation letter, and a valid photo ID to your bank. Most banks also accept these documents digitally. Opening a dedicated business account is essential for maintaining your LLC/Corporation liability protection. Commingling personal and business funds can "pierce the corporate veil."`,
      screenshot: '#',
      tip: 'Shop around for business checking accounts with no monthly fees and low minimum balance requirements.',
    },
    {
      title: 'File for State and Local Licenses',
      description: 'Check for any additional permits your business may need',
      detail: `Depending on your business type and location in ${stateName}, you may need additional licenses or permits. Common requirements include a general business license, sales tax permit, professional license, health permit, or zoning permit. Check your city and county clerk websites for local requirements. Some states also require an annual report filing.`,
      screenshot: sosUrl,
      tip: 'Many states require an annual report and fee to keep your entity in good standing. Set a calendar reminder.',
    },
  ];
}

/* ──────────────────────────── COMPONENT ──────────────────────────── */

type ViewState = 'landing' | 'collect-info' | 'walkthrough';

export default function IncorporatePage() {
  const [view, setView] = useState<ViewState>('landing');
  const [selectedState, setSelectedState] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [screenRecordConsent, setScreenRecordConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; state?: string }>({});

  const steps = selectedState ? getStepsForState(selectedState) : [];
  const stateName = US_STATES.find(s => s.value === selectedState)?.label ?? '';

  function validateAndProceed() {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!selectedState) newErrors.state = 'Select a state to continue';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setView('walkthrough');
      setCurrentStep(0);
    }
  }

  function markStepComplete(index: number) {
    setCompletedSteps(prev => new Set([...prev, index]));
    if (index < steps.length - 1) {
      setCurrentStep(index + 1);
    }
  }

  /* ──────────── LANDING VIEW ──────────── */
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
        {/* Hero */}
        <section className="relative px-6 py-24 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
            <div className="h-80 w-80 rounded-full bg-red-600/8 blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card backdrop-blur-2xl px-4 py-1.5 text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              100% Free Tool
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Incorporate Your Business{' '}
              <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
                Step by Step
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Free guided walkthrough for incorporating in any U.S. state. We show you exactly
              what to click on your Secretary of State website -- no lawyer needed, no hidden fees.
            </p>
            <div className="mt-10">
              <Button variant="primary" onClick={() => setView('collect-info')} className="h-12 px-8 text-base">
                Start Free Walkthrough
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Globe, title: 'All 50 States', desc: 'Step-by-step guides tailored to your specific state Secretary of State website.' },
              { icon: FileText, title: 'Plain English', desc: 'Every form field explained in language anyone can understand. No legal jargon.' },
              { icon: Shield, title: 'No Hidden Fees', desc: 'Completely free. You only pay the state filing fee directly to the government.' },
              { icon: Clock, title: '15-30 Minutes', desc: 'Most incorporations can be completed in a single sitting with our guide.' },
              { icon: Mic, title: 'Voice Agent Support', desc: 'Stuck on a step? Connect with our AI voice agent for real-time help.' },
              { icon: Monitor, title: 'Screen Share Ready', desc: 'Opt in to screen recording so our AI can see exactly where you are and help.' },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl p-6 hover:border-border transition-all duration-200"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-center text-foreground mb-12">How It Works</h2>
            <div className="space-y-8">
              {[
                { num: '01', title: 'Enter Your Info', desc: 'Name, email, and which state you want to incorporate in.' },
                { num: '02', title: 'Follow the Guide', desc: 'Step-by-step instructions with direct links to your state filing portal.' },
                { num: '03', title: 'Get Help Anytime', desc: 'Connect with our AI voice agent if you get stuck on any step.' },
                { num: '04', title: 'Done', desc: 'Your business is officially incorporated. We send you a checklist of next steps.' },
              ].map((s) => (
                <div key={s.num} className="flex gap-6 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400 text-sm font-bold">
                    {s.num}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card backdrop-blur-xl p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-foreground">Ready to Incorporate?</h2>
            <p className="mt-3 text-muted-foreground">
              Takes 15-30 minutes. You will only pay the state filing fee -- nothing to us.
            </p>
            <div className="mt-8">
              <Button variant="primary" onClick={() => setView('collect-info')} className="h-12 px-8 text-base">
                Start Free Walkthrough
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ──────────── COLLECT INFO VIEW ──────────── */
  if (view === 'collect-info') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
        <section className="relative px-6 py-24">
          <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
            <div className="h-60 w-60 rounded-full bg-violet-600/8 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-lg">
            <button
              onClick={() => setView('landing')}
              className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Get Started</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We need a few details to customize your walkthrough. Your info stays private.
                </p>
              </div>

              <div className="space-y-5">
                <Input
                  label="Full Name"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />

                <Select
                  label="State of Incorporation"
                  placeholder="Select your state..."
                  options={US_STATES}
                  value={selectedState}
                  onChange={setSelectedState}
                  searchable
                  error={errors.state}
                  size="lg"
                />

                {/* Screen Recording Consent */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screenRecordConsent}
                      onChange={(e) => setScreenRecordConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/10 bg-muted text-red-500 focus:ring-red-500/20 focus:ring-offset-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Enable Screen Recording</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Optional. Allow our AI voice agent to view your screen so it can guide you
                        through the exact page you are on. You can disable this at any time.
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  variant="primary"
                  onClick={validateAndProceed}
                  className="w-full h-12 text-base mt-2"
                >
                  Start Free Walkthrough
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  No credit card required. You only pay the state filing fee directly to the government.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ──────────── WALKTHROUGH VIEW ──────────── */
  const step = steps[currentStep];
  const progress = steps.length > 0 ? Math.round((completedSteps.size / steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-[hsl(var(--background))]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('collect-info')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="font-medium text-foreground">{stateName}</span>
              <span className="text-muted-foreground">Incorporation Guide</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>{completedSteps.size}/{steps.length} steps</span>
              <div className="h-1.5 w-24 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Voice agent integration placeholder
                window.alert('Voice agent connecting... This feature will connect you with an AI voice agent to guide you through the process in real time.');
              }}
              className="h-9 text-xs gap-2"
            >
              <Mic className="h-3.5 w-3.5" />
              Voice Agent
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar - Step List */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Steps</h3>
              <nav className="space-y-1">
                {steps.map((s, i) => {
                  const isActive = i === currentStep;
                  const isComplete = completedSteps.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isComplete
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isActive
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className="truncate">{s.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div>
            {/* Mobile Step Indicator */}
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
              <div className="flex-1 h-1 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {step && (
              <div className="space-y-6">
                {/* Step Header */}
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                    Step {currentStep + 1}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>

                {/* Screenshot/Link Card */}
                <div className="rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden">
                  <div className="border-b border-border bg-card px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      <span className="truncate max-w-xs">{step.screenshot}</span>
                    </div>
                    {step.screenshot !== '#' && (
                      <a
                        href={step.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Open Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="p-6 flex items-center justify-center min-h-[200px] bg-[hsl(var(--background))]/50">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border">
                        <Play className="h-6 w-6 text-red-400" />
                      </div>
                      {step.screenshot !== '#' ? (
                        <>
                          <p className="text-sm text-muted-foreground font-medium">Open the link above to follow along</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Place this guide side-by-side with the Secretary of State website
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No specific website for this step</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detail */}
                <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Instructions</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                </div>

                {/* Tip */}
                {step.tip && (
                  <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
                        !
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-amber-300">Pro Tip</h4>
                        <p className="mt-1 text-sm text-amber-200/60 leading-relaxed">{step.tip}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Agent Card */}
                <div className="rounded-2xl border border-violet-500/10 bg-violet-500/5 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                        <Mic className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-violet-300">Need Help?</h4>
                        <p className="text-xs text-violet-400/60">Connect with our AI voice agent for real-time guidance</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.alert('Voice agent connecting... This feature will connect you with an AI voice agent to guide you through the process in real time.');
                      }}
                      className="h-9 text-xs gap-2 border-violet-500/20 text-violet-300 hover:bg-violet-500/10"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Connect
                    </Button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-3">
                    {!completedSteps.has(currentStep) && (
                      <Button
                        variant="primary"
                        onClick={() => markStepComplete(currentStep)}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark Complete
                      </Button>
                    )}
                    {currentStep < steps.length - 1 ? (
                      <Button
                        variant={completedSteps.has(currentStep) ? 'primary' : 'secondary'}
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="gap-2"
                      >
                        Next Step
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : completedSteps.size === steps.length ? (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400 font-medium">
                        All Steps Complete
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Completion Card */}
                {completedSteps.size === steps.length && (
                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Congratulations!</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                      You have completed all the steps to incorporate your business in {stateName}.
                      Your state filing may take a few days to process. In the meantime, keep your
                      confirmation number safe and check back with the Secretary of State for updates.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setView('landing');
                          setCompletedSteps(new Set());
                          setCurrentStep(0);
                        }}
                        className="gap-2"
                      >
                        Start Over
                      </Button>
                      <a href="/" className="inline-block">
                        <Button variant="primary" className="gap-2">
                          Explore Memelli
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
