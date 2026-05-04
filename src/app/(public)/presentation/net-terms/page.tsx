'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle2,
  Shield,
  Clock,
  CreditCard,
  Users,
  TrendingUp,
  BadgeCheck,
} from 'lucide-react';

/* ──────────────────────────── TYPES ──────────────────────────── */

type Step = 'form' | 'confirmation';

/* ──────────────────────────── PAGE ──────────────────────────── */

export default function NetTermsPage() {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({
    companyName: '',
    ein: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    yearsInBusiness: '',
    annualRevenue: '',
    termsRequested: 'net30',
    ref1Company: '',
    ref1Contact: '',
    ref1Phone: '',
    ref2Company: '',
    ref2Contact: '',
    ref2Phone: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all';
  const labelClass = 'block text-xs text-slate-400 mb-1.5 uppercase tracking-wider';
  const selectClass =
    'w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all appearance-none';

  /* ── CONFIRMATION ── */
  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Application Received</h1>
          <p className="mt-3 text-slate-400 text-lg">
            Your net terms application for <span className="text-white font-semibold">{form.companyName || 'your company'}</span> has been submitted successfully.
          </p>

          <div className="mt-8 p-6 rounded-2xl bg-muted border border-white/10 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Application ID</span>
              <span className="font-mono font-semibold text-orange-400">#NT-2026-1294</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Terms Requested</span>
              <span className="font-medium">
                {form.termsRequested === 'net30' ? 'Net 30' : form.termsRequested === 'net60' ? 'Net 60' : 'Net 90'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Review Timeline</span>
              <span className="font-medium">1-2 Business Days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Status</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">Under Review</span>
            </div>
          </div>

          {/* Demo approval message */}
          <div className="mt-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left">
            <div className="flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Pre-Qualification Result</p>
                <p className="text-sm text-emerald-300/80 mt-1">
                  Based on the information provided, your business pre-qualifies for up to <span className="font-bold text-emerald-300">$25,000</span> in net terms credit.
                  A credit specialist will contact you within 24 hours to finalize your approval and set up your account.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-muted border border-white/10">
            <p className="text-xs text-slate-400">
              Our credit team will verify your trade references and business information. You will receive an email notification once your application has been reviewed.
            </p>
          </div>

          <div className="mt-8 flex gap-3 justify-center">
            <Link
              href="/presentation/store"
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-sm font-semibold transition-all"
            >
              Browse Equipment
            </Link>
            <Link
              href="/presentation/checkout"
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── APPLICATION FORM ── */
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0F172A]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/presentation/store" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            Secure Application
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Title section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Apply for Net Terms</h1>
          <p className="mt-2 text-slate-400 text-lg">
            Get approved for B2B financing and pay on Net 30, 60, or 90 day terms. No interest on approved accounts.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Clock, title: 'Net 30/60/90', desc: 'Flexible payment terms' },
            { icon: CreditCard, title: '0% Interest', desc: 'No interest charges' },
            { icon: TrendingUp, title: 'Up to $50K', desc: 'Credit lines available' },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3 p-4 rounded-xl bg-muted border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-slate-400">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <div className="rounded-2xl bg-muted border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-orange-400" />
              </div>
              <h2 className="text-lg font-bold">Company Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Company Name</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Acme Print Co." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>EIN (Tax ID)</label>
                <input name="ein" value={form.ein} onChange={handleChange} placeholder="XX-XXXXXXX" className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>Years in Business</label>
                <select name="yearsInBusiness" value={form.yearsInBusiness} onChange={handleChange} className={selectClass}>
                  <option value="" className="bg-slate-900">Select...</option>
                  <option value="0-1" className="bg-slate-900">Less than 1 year</option>
                  <option value="1-3" className="bg-slate-900">1-3 years</option>
                  <option value="3-5" className="bg-slate-900">3-5 years</option>
                  <option value="5-10" className="bg-slate-900">5-10 years</option>
                  <option value="10+" className="bg-slate-900">10+ years</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Business Address</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="123 Industrial Blvd, Suite 100" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Houston" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>State</label>
                  <input name="state" value={form.state} onChange={handleChange} placeholder="TX" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ZIP</label>
                  <input name="zip" value={form.zip} onChange={handleChange} placeholder="77001" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Annual Revenue Range</label>
                <select name="annualRevenue" value={form.annualRevenue} onChange={handleChange} className={selectClass}>
                  <option value="" className="bg-slate-900">Select...</option>
                  <option value="under-100k" className="bg-slate-900">Under $100K</option>
                  <option value="100k-500k" className="bg-slate-900">$100K - $500K</option>
                  <option value="500k-1m" className="bg-slate-900">$500K - $1M</option>
                  <option value="1m-5m" className="bg-slate-900">$1M - $5M</option>
                  <option value="5m+" className="bg-slate-900">$5M+</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Terms Requested</label>
                <select name="termsRequested" value={form.termsRequested} onChange={handleChange} className={selectClass}>
                  <option value="net30" className="bg-slate-900">Net 30</option>
                  <option value="net60" className="bg-slate-900">Net 60</option>
                  <option value="net90" className="bg-slate-900">Net 90</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-2xl bg-muted border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-400" />
              </div>
              <h2 className="text-lg font-bold">Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Contact Name</label>
                <input name="contactName" value={form.contactName} onChange={handleChange} placeholder="John Smith" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} placeholder="john@company.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input name="contactPhone" type="tel" value={form.contactPhone} onChange={handleChange} placeholder="(555) 123-4567" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Trade References */}
          <div className="rounded-2xl bg-muted border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-orange-400" />
              </div>
              <h2 className="text-lg font-bold">Trade References</h2>
              <span className="text-xs text-slate-500">(Minimum 2 required)</span>
            </div>

            {/* Reference 1 */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-300 mb-3">Reference 1</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Company</label>
                  <input name="ref1Company" value={form.ref1Company} onChange={handleChange} placeholder="Supplier Inc." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Contact Name</label>
                  <input name="ref1Contact" value={form.ref1Contact} onChange={handleChange} placeholder="Jane Doe" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input name="ref1Phone" type="tel" value={form.ref1Phone} onChange={handleChange} placeholder="(555) 987-6543" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Reference 2 */}
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-3">Reference 2</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Company</label>
                  <input name="ref2Company" value={form.ref2Company} onChange={handleChange} placeholder="Vendor Corp." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Contact Name</label>
                  <input name="ref2Contact" value={form.ref2Contact} onChange={handleChange} placeholder="Bob Johnson" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input name="ref2Phone" type="tel" value={form.ref2Phone} onChange={handleChange} placeholder="(555) 456-7890" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Submit Application
            </button>
            <p className="text-xs text-slate-500">
              By submitting, you authorize us to verify business information and contact trade references.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
