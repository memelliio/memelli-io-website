'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CreditCard,
  Truck,
  Lock,
  CheckCircle2,
  Package,
  ShoppingCart,
  Shield,
  Printer,
  Flame,
} from 'lucide-react';

/* ──────────────────────────── TYPES ──────────────────────────── */

interface DemoItem {
  name: string;
  price: number;
  quantity: number;
  gradient: string;
  icon: typeof Printer;
}

/* ──────────────────────────── DATA ──────────────────────────── */

const demoCart: DemoItem[] = [
  { name: 'ForgePress XL 600', price: 7999, quantity: 1, gradient: 'from-orange-600 via-red-500 to-orange-400', icon: Printer },
  { name: 'HeatForge Auto Swing', price: 5499, quantity: 1, gradient: 'from-blue-600 via-indigo-500 to-violet-500', icon: Flame },
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

/* ──────────────────────────── PAGE ──────────────────────────── */

export default function CheckoutPage() {
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    nameOnCard: '',
  });

  const subtotal = demoCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 299;
  const tax = Math.round(subtotal * 0.0825);
  const total = subtotal + shipping + tax;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── SUCCESS ── */
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Order Confirmed</h1>
          <p className="mt-3 text-slate-400 text-lg">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          <div className="mt-8 p-6 rounded-2xl bg-muted border border-white/10 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Order Number</span>
              <span className="font-mono font-semibold text-orange-400">#DTF-2026-0847</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Total Charged</span>
              <span className="font-bold text-lg">{fmt(total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Estimated Delivery</span>
              <span className="font-medium">5-7 Business Days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Shipping</span>
              <span className="font-medium text-emerald-400">Free</span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-300">
              A confirmation email has been sent. Our team will reach out within 24 hours to schedule delivery and installation.
            </p>
          </div>

          <div className="mt-8 flex gap-3 justify-center">
            <Link
              href="/presentation/store"
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all"
            >
              Continue Shopping
            </Link>
            <Link
              href="/presentation/net-terms"
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-sm font-semibold transition-all"
            >
              Apply for Net Terms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── CHECKOUT FORM ── */
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0F172A]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/presentation/store" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            Secure Checkout
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form sections */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping */}
              <div className="rounded-2xl bg-muted border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-orange-400" />
                  </div>
                  <h2 className="text-lg font-bold">Shipping Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">First Name</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Last Name</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Smith"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Company</label>
                    <input
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Acme Print Co."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@company.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Street Address</label>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="123 Industrial Blvd, Suite 100"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Houston"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">State</label>
                      <input
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="TX"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">ZIP</label>
                      <input
                        name="zip"
                        value={form.zip}
                        onChange={handleChange}
                        placeholder="77001"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-2xl bg-muted border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-orange-400" />
                  </div>
                  <h2 className="text-lg font-bold">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Name on Card</label>
                    <input
                      name="nameOnCard"
                      value={form.nameOnCard}
                      onChange={handleChange}
                      placeholder="John Smith"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Card Number</label>
                    <input
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={handleChange}
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Expiry</label>
                      <input
                        name="expiry"
                        value={form.expiry}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">CVC</label>
                      <input
                        name="cvc"
                        value={form.cvc}
                        onChange={handleChange}
                        placeholder="123"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-300">Demo mode — no real payment will be processed. Your information is secure.</p>
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl bg-muted border border-white/10 p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  {demoCart.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold">{fmt(item.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shipping</span>
                    <span className={shipping === 0 ? 'text-emerald-400' : ''}>{shipping === 0 ? 'Free' : fmt(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tax (est.)</span>
                    <span>{fmt(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-white/10">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Place Order
                </button>

                <Link
                  href="/presentation/net-terms"
                  className="mt-3 block w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium text-center transition-all"
                >
                  Prefer Net Terms? Apply Here
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
