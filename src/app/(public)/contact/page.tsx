'use client';

import { useState } from 'react';
import Link from 'next/link';

const contactInfo = [
  {
    label: 'Email',
    value: 'support@memelli.com',
    href: 'mailto:support@memelli.com',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    label: 'Sales',
    value: 'sales@memelli.com',
    href: 'mailto:sales@memelli.com',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: '(888) 555-MELI',
    href: 'tel:+18885556354',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
  },
];

const officeHours = [
  { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
  { day: 'Saturday', hours: '10:00 AM - 2:00 PM EST' },
  { day: 'Sunday', hours: 'Closed' },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Hero */}
      <section className="relative px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
          <div className="h-80 w-80 rounded-full bg-red-600/8 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
            Get in{' '}
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Have a question, need support, or want to learn more? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-card backdrop-blur-2xl p-8">
                {submitted ? (
                  <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-2xl text-white shadow-[0_0_30px_rgba(147,51,234,0.2)]">
                      &#10003;
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Message Sent</h2>
                    <p className="mt-3 text-muted-foreground leading-relaxed">
                      We&apos;ll get back to you within 24 hours. Check your email for a confirmation.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-6 text-sm text-red-400 underline hover:text-red-300 transition-colors duration-200"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-6 text-xl font-bold text-foreground">
                      Send Us a{' '}
                      <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
                        Message
                      </span>
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="name" className="mb-1 block text-sm font-medium text-muted-foreground">
                            Full Name
                          </label>
                          <input
                            id="name"
                            type="text"
                            required
                            className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors duration-200"
                            placeholder="Jane Smith"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="mb-1 block text-sm font-medium text-muted-foreground">
                            Email Address
                          </label>
                          <input
                            id="email"
                            type="email"
                            required
                            className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors duration-200"
                            placeholder="jane@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="subject" className="mb-1 block text-sm font-medium text-muted-foreground">
                          Subject
                        </label>
                        <select
                          id="subject"
                          required
                          className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors duration-200"
                        >
                          <option value="">Select a topic</option>
                          <option value="general">General Inquiry</option>
                          <option value="sales">Sales & Pricing</option>
                          <option value="support">Technical Support</option>
                          <option value="partnership">Partnership Opportunity</option>
                          <option value="billing">Billing Question</option>
                          <option value="feedback">Product Feedback</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className="mb-1 block text-sm font-medium text-muted-foreground">
                          Message
                        </label>
                        <textarea
                          id="message"
                          rows={5}
                          required
                          className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors duration-200"
                          placeholder="Tell us how we can help..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-red-600 hover:bg-red-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(147,51,234,0.15)] hover:shadow-[0_0_30px_rgba(147,51,234,0.25)] transition-all duration-200"
                      >
                        Send Message
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:col-span-2">
              {/* Contact Info */}
              <div className="rounded-2xl border border-border bg-card backdrop-blur-2xl p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Contact Information</h3>
                <div className="space-y-4">
                  {contactInfo.map((info) => (
                    <a
                      key={info.label}
                      href={info.href}
                      className="flex items-center gap-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-red-400"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-red-400">
                        {info.icon}
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{info.label}</div>
                        <div className="font-medium text-muted-foreground">{info.value}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Office Hours */}
              <div className="rounded-2xl border border-border bg-card backdrop-blur-2xl p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Office Hours</h3>
                <div className="space-y-2">
                  {officeHours.map((h) => (
                    <div key={h.day} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{h.day}</span>
                      <span className="font-medium text-muted-foreground">{h.hours}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  AI support is available 24/7 through your dashboard.
                </p>
              </div>

              {/* Quick Links */}
              <div className="rounded-2xl border border-border bg-card backdrop-blur-2xl p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/pricing" className="block text-sm text-red-400 hover:text-red-300 transition-colors duration-200">
                    View Pricing Plans
                  </Link>
                  <Link href="/affiliate" className="block text-sm text-red-400 hover:text-red-300 transition-colors duration-200">
                    Affiliate Program
                  </Link>
                  <Link href="/blog" className="block text-sm text-red-400 hover:text-red-300 transition-colors duration-200">
                    Read Our Blog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
