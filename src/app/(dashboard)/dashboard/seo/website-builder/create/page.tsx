'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Toggle,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

const INDUSTRIES = [
  { value: 'credit-repair', label: 'Credit Repair' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial', label: 'Financial Services' },
  { value: 'home-services', label: 'Home Services' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'education', label: 'Education' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
];

const STEPS = ['Industry', 'Services', 'Region', 'Generate'] as const;

export default function CreateSitePage() {
  const api = useApi();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [industry, setIndustry] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [services, setServices] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [enableForum, setEnableForum] = useState(true);
  const [customDomain, setCustomDomain] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/seo/websites', {
        businessName,
        industry,
        services: services.split('\n').map((s) => s.trim()).filter(Boolean),
        region,
        city,
        state,
        enableForum,
        customDomain: customDomain || undefined,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      router.push('/dashboard/seo/website-builder');
    },
  });

  const canProceed = [
    () => !!industry && !!businessName,
    () => services.trim().length > 0,
    () => !!region,
    () => true,
  ];

  return (
    <div className="min-h-screen bg-card">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <PageHeader
          title="Create Website"
          subtitle="Build a new SEO-optimized website with forum"
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'SEO', href: '/dashboard/seo' },
            { label: 'Website Builder', href: '/dashboard/seo/website-builder' },
            { label: 'Create' },
          ]}
          actions={
            <Link href="/dashboard/seo/website-builder">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
                Back
              </Button>
            </Link>
          }
          className="mb-8"
        />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 transition-all duration-200 ${i <= step ? 'bg-red-500' : 'bg-muted'}`} />}
              <button
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  i === step
                    ? 'bg-red-600 text-white'
                    : i < step
                    ? 'bg-red-600/20 text-red-400 cursor-pointer hover:bg-red-600/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
                {label}
              </button>
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardContent className="p-8">
            {step === 0 && (
              <div className="space-y-6">
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground mb-6">Industry & Business</CardTitle>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">Business Name</label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                    className="bg-muted border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">Industry</label>
                  <Select
                    value={industry}
                    onChange={(v) => setIndustry(v)}
                    options={[{ value: '', label: 'Select industry...' }, ...INDUSTRIES]}
                    className="bg-muted border-white/[0.06] rounded-xl text-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground mb-6">Services Offered</CardTitle>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">
                    Services (one per line)
                  </label>
                  <Textarea
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    placeholder={'Credit Score Repair\nDebt Consolidation\nCredit Monitoring'}
                    rows={8}
                    className="bg-muted border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground mb-6">Service Region</CardTitle>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">Region</label>
                  <Select
                    value={region}
                    onChange={(v) => setRegion(v)}
                    options={[
                      { value: '', label: 'Select region...' },
                      { value: 'national', label: 'National' },
                      { value: 'state', label: 'State-wide' },
                      { value: 'local', label: 'Local / City' },
                    ]}
                    className="bg-muted border-white/[0.06] rounded-xl text-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
                {(region === 'state' || region === 'local') && (
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">State</label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. California" className="bg-muted border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200" />
                  </div>
                )}
                {region === 'local' && (
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">City</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Los Angeles" className="bg-muted border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200" />
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground mb-6">Review & Generate</CardTitle>

                <div className="rounded-2xl border border-white/[0.04] bg-card p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Business</span>
                    <span className="text-foreground">{businessName}</span>
                  </div>
                  <div className="h-px bg-white/[0.04]" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="text-foreground">{INDUSTRIES.find((i) => i.value === industry)?.label ?? industry}</span>
                  </div>
                  <div className="h-px bg-white/[0.04]" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Services</span>
                    <span className="text-foreground">{services.split('\n').filter(Boolean).length} services</span>
                  </div>
                  <div className="h-px bg-white/[0.04]" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Region</span>
                    <span className="text-foreground">{[city, state, region].filter(Boolean).join(', ')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-card p-6">
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable Forum</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Auto-create forum with SEO categories</p>
                  </div>
                  <Toggle checked={enableForum} onChange={setEnableForum} className="data-[state=checked]:bg-red-600" />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">Custom Domain (optional)</label>
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="yourbusiness.com"
                    className="bg-muted border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
          >
            Back
          </Button>

          {step < 3 ? (
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed[step]()}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Generating...' : 'Auto-Generate Site'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}