'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FileText,
  Plus,
  Send,
  Download,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  Repeat,
  Loader2,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  EmptyState,
  type BadgeVariant,
} from '@memelli/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { DemoBanner } from '@/components/shared/DemoBadge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partial';
type InvoiceTemplate = 'modern' | 'classic' | 'minimal';

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  lineItems: LineItem[];
  taxRate: number;
  discount: number;
  dueDate: string;
  notes: string;
  status: InvoiceStatus;
  amountPaid: number;
  template: InvoiceTemplate;
  recurring: boolean;
  recurringInterval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_VARIANT: Record<InvoiceStatus, BadgeVariant> = {
  draft: 'muted',
  sent: 'info',
  paid: 'success',
  overdue: 'error',
  partial: 'warning',
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  partial: 'Partial',
};

const TEMPLATE_NAMES: Record<InvoiceTemplate, string> = {
  modern: 'Modern',
  classic: 'Classic',
  minimal: 'Minimal',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateInvoiceNumber(count: number): string {
  return `INV-${String(count + 1).padStart(4, '0')}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calcSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.rate, 0);
}

function calcTotal(items: LineItem[], taxRate: number, discount: number): number {
  const subtotal = calcSubtotal(items);
  const taxAmount = subtotal * (taxRate / 100);
  const discountAmount = subtotal * (discount / 100);
  return subtotal + taxAmount - discountAmount;
}

function isOverdue(dueDate: string, status: InvoiceStatus): boolean {
  if (status === 'paid') return false;
  return new Date(dueDate) < new Date();
}

function emptyLineItem(): LineItem {
  return { id: generateId(), description: '', qty: 1, rate: 0 };
}

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: generateId(),
    number: 'INV-0001',
    clientName: 'Acme Corporation',
    clientEmail: 'billing@acme.com',
    lineItems: [
      { id: generateId(), description: 'Web Design Services', qty: 1, rate: 2500 },
      { id: generateId(), description: 'SEO Optimization', qty: 3, rate: 500 },
    ],
    taxRate: 8.5,
    discount: 0,
    dueDate: '2026-03-20',
    notes: 'Payment due within 30 days.',
    status: 'sent',
    amountPaid: 0,
    template: 'modern',
    recurring: false,
    recurringInterval: 'monthly',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: generateId(),
    number: 'INV-0002',
    clientName: 'BluePeak Ventures',
    clientEmail: 'ap@bluepeak.io',
    lineItems: [
      { id: generateId(), description: 'Consulting Hours', qty: 20, rate: 150 },
    ],
    taxRate: 10,
    discount: 5,
    dueDate: '2026-02-28',
    notes: '',
    status: 'overdue',
    amountPaid: 0,
    template: 'classic',
    recurring: false,
    recurringInterval: 'monthly',
    createdAt: '2026-02-15T09:00:00Z',
  },
  {
    id: generateId(),
    number: 'INV-0003',
    clientName: 'Zenith Labs',
    clientEmail: 'finance@zenithlabs.co',
    lineItems: [
      { id: generateId(), description: 'Monthly Retainer', qty: 1, rate: 5000 },
      { id: generateId(), description: 'Ad Spend Management', qty: 1, rate: 1200 },
    ],
    taxRate: 7,
    discount: 10,
    dueDate: '2026-04-01',
    notes: 'Recurring monthly invoice.',
    status: 'paid',
    amountPaid: 5874,
    template: 'minimal',
    recurring: true,
    recurringInterval: 'monthly',
    createdAt: '2026-03-05T14:30:00Z',
  },
  {
    id: generateId(),
    number: 'INV-0004',
    clientName: 'Coral Digital',
    clientEmail: 'pay@coraldigital.com',
    lineItems: [
      { id: generateId(), description: 'Mobile App Development', qty: 1, rate: 12000 },
      { id: generateId(), description: 'QA Testing', qty: 40, rate: 75 },
    ],
    taxRate: 9,
    discount: 0,
    dueDate: '2026-03-25',
    notes: 'Phase 1 deliverable.',
    status: 'partial',
    amountPaid: 5000,
    template: 'modern',
    recurring: false,
    recurringInterval: 'monthly',
    createdAt: '2026-03-10T08:00:00Z',
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/* ---- Stats Cards ------------------------------------------------- */

function StatsCards({ invoices }: { invoices: Invoice[] }) {
  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + calcTotal(i.lineItems, i.taxRate, i.discount), 0);
  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'draft')
    .reduce((s, i) => s + calcTotal(i.lineItems, i.taxRate, i.discount) - i.amountPaid, 0);
  const overdueCount = invoices.filter((i) => i.status === 'overdue' || (i.status !== 'paid' && isOverdue(i.dueDate, i.status))).length;
  const draftCount = invoices.filter((i) => i.status === 'draft').length;

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Outstanding', value: formatCurrency(totalOutstanding), icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Overdue', value: String(overdueCount), icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Drafts', value: String(draftCount), icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className={`rounded-lg p-2.5 ${c.bg}`}>
            <c.icon className={`h-5 w-5 ${c.color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Invoice Preview Panel --------------------------------------- */

function InvoicePreview({
  invoice,
  template,
}: {
  invoice: {
    clientName: string;
    clientEmail: string;
    lineItems: LineItem[];
    taxRate: number;
    discount: number;
    dueDate: string;
    notes: string;
    number: string;
  };
  template: InvoiceTemplate;
}) {
  const subtotal = calcSubtotal(invoice.lineItems);
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const discountAmount = subtotal * (invoice.discount / 100);
  const total = subtotal + taxAmount - discountAmount;

  const templateStyles: Record<InvoiceTemplate, { wrapper: string; header: string; accent: string }> = {
    modern: {
      wrapper: 'bg-card border-border rounded-2xl',
      header: 'bg-gradient-to-r from-red-600/20 to-red-500/5 border-b border-red-500/20 rounded-t-2xl',
      accent: 'text-red-400',
    },
    classic: {
      wrapper: 'bg-card border-border rounded-xl',
      header: 'bg-muted border-b border-border rounded-t-xl',
      accent: 'text-amber-400',
    },
    minimal: {
      wrapper: 'bg-card border-border rounded-lg',
      header: 'border-b border-border',
      accent: 'text-foreground',
    },
  };

  const s = templateStyles[template];

  return (
    <div className={`border overflow-hidden ${s.wrapper}`}>
      {/* Header */}
      <div className={`p-6 ${s.header}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`text-lg font-bold ${s.accent}`}>INVOICE</h3>
            <p className="text-xs text-muted-foreground mt-1">{invoice.number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground font-medium">Memelli Universe</p>
            <p className="text-xs text-muted-foreground">universe.memelli.com</p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="p-6 pb-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Bill To</p>
        <p className="text-sm text-foreground font-medium">{invoice.clientName || 'Client Name'}</p>
        <p className="text-xs text-muted-foreground">{invoice.clientEmail || 'client@email.com'}</p>
        <p className="text-xs text-muted-foreground mt-2">Due: {invoice.dueDate ? formatDate(invoice.dueDate) : '--'}</p>
      </div>

      {/* Line Items */}
      <div className="px-4 md:px-6 overflow-x-auto">
        <table className="w-full text-xs min-w-[400px]">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 font-medium">Description</th>
              <th className="text-right py-2 font-medium w-14">Qty</th>
              <th className="text-right py-2 font-medium w-20">Rate</th>
              <th className="text-right py-2 font-medium w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.filter((li) => li.description).map((li) => (
              <tr key={li.id} className="border-b border-border">
                <td className="py-2 text-foreground">{li.description}</td>
                <td className="py-2 text-right text-muted-foreground">{li.qty}</td>
                <td className="py-2 text-right text-muted-foreground">{formatCurrency(li.rate)}</td>
                <td className="py-2 text-right text-foreground">{formatCurrency(li.qty * li.rate)}</td>
              </tr>
            ))}
            {invoice.lineItems.filter((li) => li.description).length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground italic">No line items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-6 py-4">
        <div className="ml-auto w-48 space-y-1 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {invoice.taxRate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}
          {invoice.discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount ({invoice.discount}%)</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className={`flex justify-between font-bold text-sm pt-2 border-t border-border ${s.accent}`}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="px-6 pb-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
          <p className="text-xs text-muted-foreground">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ---- Create / Edit Form ----------------------------------------- */

function InvoiceForm({
  invoice,
  invoiceCount,
  onSave,
  onCancel,
}: {
  invoice: Invoice | null;
  invoiceCount: number;
  onSave: (inv: Invoice) => void;
  onCancel: () => void;
}) {
  const isEdit = !!invoice;

  const [clientName, setClientName] = useState(invoice?.clientName ?? '');
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail ?? '');
  const [lineItems, setLineItems] = useState<LineItem[]>(invoice?.lineItems ?? [emptyLineItem()]);
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ?? 0);
  const [discount, setDiscount] = useState(invoice?.discount ?? 0);
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? '');
  const [notes, setNotes] = useState(invoice?.notes ?? '');
  const [template, setTemplate] = useState<InvoiceTemplate>(invoice?.template ?? 'modern');
  const [recurring, setRecurring] = useState(invoice?.recurring ?? false);
  const [recurringInterval, setRecurringInterval] = useState<Invoice['recurringInterval']>(invoice?.recurringInterval ?? 'monthly');

  const invNumber = invoice?.number ?? generateInvoiceNumber(invoiceCount);

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);
  const removeLineItem = (id: string) => setLineItems((prev) => prev.filter((li) => li.id !== id));
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, [field]: value } : li)),
    );
  };

  const handleSubmit = () => {
    if (!clientName.trim()) return;
    const inv: Invoice = {
      id: invoice?.id ?? generateId(),
      number: invNumber,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      lineItems: lineItems.filter((li) => li.description.trim()),
      taxRate,
      discount,
      dueDate,
      notes,
      status: invoice?.status ?? 'draft',
      amountPaid: invoice?.amountPaid ?? 0,
      template,
      recurring,
      recurringInterval,
      createdAt: invoice?.createdAt ?? new Date().toISOString(),
    };
    onSave(inv);
  };

  const inputClass =
    'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-colors';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left: Form */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Client info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Client Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Client Name *</label>
              <input
                className={inputClass}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Company or person name"
              />
            </div>
            <div>
              <label className={labelClass}>Client Email</label>
              <input
                className={inputClass}
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="billing@client.com"
              />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
            <button
              onClick={addLineItem}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {lineItems.map((li, idx) => (
              <div key={li.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {idx === 0 && <label className={labelClass}>Description</label>}
                  <input
                    className={inputClass}
                    value={li.description}
                    onChange={(e) => updateLineItem(li.id, 'description', e.target.value)}
                    placeholder="Service or product"
                  />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className={labelClass}>Qty</label>}
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={li.qty}
                    onChange={(e) => updateLineItem(li.id, 'qty', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <label className={labelClass}>Rate ($)</label>}
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    step={0.01}
                    value={li.rate}
                    onChange={(e) => updateLineItem(li.id, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  {idx === 0 && <label className={`${labelClass} invisible`}>_</label>}
                  <span className="text-xs text-muted-foreground font-mono">{formatCurrency(li.qty * li.rate)}</span>
                  {lineItems.length > 1 && (
                    <button
                      onClick={() => removeLineItem(li.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax, discount, due date */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Pricing & Schedule</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Tax Rate (%)</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className={labelClass}>Discount (%)</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                className={`${inputClass} [color-scheme:dark]`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Notes</h3>
          <textarea
            className={`${inputClass} min-h-[80px] resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, additional info..."
          />
        </div>

        {/* Template & Recurring */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Template & Recurring</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Invoice Template</label>
              <div className="flex gap-2">
                {(['modern', 'classic', 'minimal'] as InvoiceTemplate[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      template === t
                        ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : 'border-border bg-muted text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    {TEMPLATE_NAMES[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Recurring Invoice</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRecurring(!recurring)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    recurring ? 'bg-red-500' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      recurring ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                {recurring && (
                  <select
                    className="rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-foreground focus:border-red-500/50 focus:outline-none"
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(e.target.value as Invoice['recurringInterval'])}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-500 text-white px-6"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isEdit ? 'Update Invoice' : 'Create Invoice'}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">Live Preview</h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {TEMPLATE_NAMES[template]}
          </span>
        </div>
        <InvoicePreview
          invoice={{ clientName, clientEmail, lineItems, taxRate, discount, dueDate, notes, number: invNumber }}
          template={template}
        />
      </div>
    </div>
  );
}

/* ---- Payment Dialog --------------------------------------------- */

function PaymentDialog({
  invoice,
  onClose,
  onSubmit,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}) {
  const total = calcTotal(invoice.lineItems, invoice.taxRate, invoice.discount);
  const remaining = total - invoice.amountPaid;
  const [amount, setAmount] = useState(remaining);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Record Payment</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Invoice Total</span>
            <span className="text-foreground font-medium">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Already Paid</span>
            <span className="text-emerald-400 font-medium">{formatCurrency(invoice.amountPaid)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-2">
            <span className="text-foreground font-medium">Remaining</span>
            <span className="text-red-400 font-bold">{formatCurrency(remaining)}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Payment Amount ($)</label>
          <input
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
            type="number"
            min={0.01}
            max={remaining}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setAmount(remaining)}
            className="text-xs text-red-400 hover:text-red-300 underline transition-colors"
          >
            Pay Full Amount
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={() => setAmount(Math.round(remaining / 2 * 100) / 100)}
            className="text-xs text-red-400 hover:text-red-300 underline transition-colors"
          >
            Pay Half
          </button>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              if (amount > 0 && amount <= remaining) onSubmit(amount);
            }}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function InvoicesPage() {
  /* ---- API Data ---- */
  const { data: apiOrders, isLoading, isError } = useApiQuery<any>(
    ['commerce-invoices'],
    '/api/commerce/orders?perPage=100'
  );
  const isDemo = isError || (!isLoading && !apiOrders);

  const mappedInvoices: Invoice[] = useMemo(() => {
    const raw = (apiOrders as any)?.data ?? (Array.isArray(apiOrders) ? apiOrders : []);
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((o: any, idx: number) => ({
      id: o.id,
      number: `INV-${String(idx + 1).padStart(4, '0')}`,
      clientName: o.contact ? `${o.contact.firstName ?? ''} ${o.contact.lastName ?? ''}`.trim() : 'Guest',
      clientEmail: o.contact?.email ?? '',
      lineItems: (o.items ?? []).map((item: any) => ({
        id: item.id,
        description: item.product?.name ?? 'Item',
        qty: item.quantity ?? 1,
        rate: Number(item.unitPrice ?? 0),
      })),
      taxRate: 0,
      discount: Number(o.discountTotal ?? 0) > 0 ? (Number(o.discountTotal) / Math.max(Number(o.subtotal), 1)) * 100 : 0,
      dueDate: o.createdAt ? new Date(new Date(o.createdAt).getTime() + 30 * 86400000).toISOString().slice(0, 10) : '',
      notes: o.notes ?? '',
      status: (o.status === 'CONFIRMED' || o.status === 'DELIVERED') ? 'paid' as InvoiceStatus : 'sent' as InvoiceStatus,
      amountPaid: o.status === 'CONFIRMED' || o.status === 'DELIVERED' ? Number(o.total ?? 0) : 0,
      template: 'modern' as InvoiceTemplate,
      recurring: false,
      recurringInterval: 'monthly' as const,
      createdAt: o.createdAt ?? new Date().toISOString(),
    }));
  }, [apiOrders]);

  const [invoices, setInvoices] = useState<Invoice[]>(SAMPLE_INVOICES);

  useEffect(() => {
    if (mappedInvoices.length > 0) {
      setInvoices(mappedInvoices);
    }
  }, [mappedInvoices]);

  const [view, setView] = useState<'list' | 'create' | 'edit' | 'preview'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'client'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---- CRUD ------------------------------------------------------- */

  const handleSaveInvoice = useCallback(
    (inv: Invoice) => {
      setInvoices((prev) => {
        const exists = prev.find((i) => i.id === inv.id);
        if (exists) return prev.map((i) => (i.id === inv.id ? inv : i));
        return [inv, ...prev];
      });
      setView('list');
      setSelectedInvoice(null);
      showToast(view === 'edit' ? 'Invoice updated' : 'Invoice created');
    },
    [showToast, view],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      showToast('Invoice deleted');
    },
    [showToast],
  );

  const handleSendInvoice = useCallback(
    (id: string) => {
      setInvoices((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'sent' as InvoiceStatus } : i)),
      );
      showToast('Invoice sent to client', 'info');
    },
    [showToast],
  );

  const handleRecordPayment = useCallback(
    (id: string, amount: number) => {
      setInvoices((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          const newPaid = i.amountPaid + amount;
          const total = calcTotal(i.lineItems, i.taxRate, i.discount);
          const newStatus: InvoiceStatus = newPaid >= total ? 'paid' : 'partial';
          return { ...i, amountPaid: newPaid, status: newStatus };
        }),
      );
      setPaymentTarget(null);
      showToast(`Payment of ${formatCurrency(amount)} recorded`);
    },
    [showToast],
  );

  const handleCopyInvoiceData = useCallback(
    (inv: Invoice) => {
      const subtotal = calcSubtotal(inv.lineItems);
      const taxAmount = subtotal * (inv.taxRate / 100);
      const discountAmount = subtotal * (inv.discount / 100);
      const total = subtotal + taxAmount - discountAmount;

      const text = [
        `INVOICE ${inv.number}`,
        `Date: ${formatDate(inv.createdAt)}`,
        `Due: ${inv.dueDate ? formatDate(inv.dueDate) : 'N/A'}`,
        '',
        `Bill To: ${inv.clientName}`,
        inv.clientEmail ? `Email: ${inv.clientEmail}` : '',
        '',
        'LINE ITEMS:',
        ...inv.lineItems.map(
          (li) => `  ${li.description} - Qty: ${li.qty} x ${formatCurrency(li.rate)} = ${formatCurrency(li.qty * li.rate)}`,
        ),
        '',
        `Subtotal: ${formatCurrency(subtotal)}`,
        inv.taxRate > 0 ? `Tax (${inv.taxRate}%): ${formatCurrency(taxAmount)}` : '',
        inv.discount > 0 ? `Discount (${inv.discount}%): -${formatCurrency(discountAmount)}` : '',
        `TOTAL: ${formatCurrency(total)}`,
        '',
        inv.notes ? `Notes: ${inv.notes}` : '',
        '',
        'Memelli Universe | universe.memelli.com',
      ]
        .filter(Boolean)
        .join('\n');

      navigator.clipboard.writeText(text);
      showToast('Invoice data copied to clipboard (PDF-ready)', 'info');
    },
    [showToast],
  );

  /* ---- Filtering & Sorting ---------------------------------------- */

  const processed = useMemo(() => {
    let list = [...invoices];

    // Auto-mark overdue
    list = list.map((inv) => {
      if (inv.status !== 'paid' && inv.status !== 'draft' && isOverdue(inv.dueDate, inv.status)) {
        return { ...inv, status: 'overdue' as InvoiceStatus };
      }
      return inv;
    });

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.clientName.toLowerCase().includes(q) ||
          i.number.toLowerCase().includes(q) ||
          i.clientEmail.toLowerCase().includes(q),
      );
    }

    // Filter
    if (filterStatus !== 'all') {
      list = list.filter((i) => i.status === filterStatus);
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === 'amount')
        cmp = calcTotal(a.lineItems, a.taxRate, a.discount) - calcTotal(b.lineItems, b.taxRate, b.discount);
      else cmp = a.clientName.localeCompare(b.clientName);
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [invoices, filterStatus, sortField, sortDir, searchQuery]);

  const overdueInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'overdue' || (i.status !== 'paid' && i.status !== 'draft' && isOverdue(i.dueDate, i.status))),
    [invoices],
  );

  /* ---- Sort toggle ------------------------------------------------ */

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      sortDir === 'desc' ? (
        <ChevronDown className="inline h-3 w-3 ml-1" />
      ) : (
        <ChevronUp className="inline h-3 w-3 ml-1" />
      )
    ) : null;

  /* ---- Render ----------------------------------------------------- */

  if (view === 'create') {
    return (
      <div className="flex flex-col gap-8 p-8 min-h-screen bg-card">
        <PageHeader
          title="New Invoice"
          subtitle="Create and preview your invoice"
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'Invoices', href: '/dashboard/commerce/invoices' },
            { label: 'New' },
          ]}
        />
        <InvoiceForm
          invoice={null}
          invoiceCount={invoices.length}
          onSave={handleSaveInvoice}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  if (view === 'edit' && selectedInvoice) {
    return (
      <div className="flex flex-col gap-8 p-8 min-h-screen bg-card">
        <PageHeader
          title={`Edit ${selectedInvoice.number}`}
          subtitle={`Editing invoice for ${selectedInvoice.clientName}`}
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'Invoices', href: '/dashboard/commerce/invoices' },
            { label: 'Edit' },
          ]}
        />
        <InvoiceForm
          invoice={selectedInvoice}
          invoiceCount={invoices.length}
          onSave={handleSaveInvoice}
          onCancel={() => {
            setView('list');
            setSelectedInvoice(null);
          }}
        />
      </div>
    );
  }

  if (view === 'preview' && selectedInvoice) {
    return (
      <div className="flex flex-col gap-8 p-8 min-h-screen bg-card">
        <PageHeader
          title={selectedInvoice.number}
          subtitle={`Invoice for ${selectedInvoice.clientName}`}
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'Invoices', href: '/dashboard/commerce/invoices' },
            { label: selectedInvoice.number },
          ]}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={STATUS_VARIANT[selectedInvoice.status]}>{STATUS_LABELS[selectedInvoice.status]}</Badge>
          {selectedInvoice.recurring && (
            <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
              <Repeat className="h-3 w-3" />
              {selectedInvoice.recurringInterval}
            </span>
          )}
          <div className="flex-1" />
          {selectedInvoice.status === 'draft' && (
            <Button
              onClick={() => handleSendInvoice(selectedInvoice.id)}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Send className="mr-2 h-4 w-4" /> Send Invoice
            </Button>
          )}
          {selectedInvoice.status !== 'paid' && (
            <Button
              onClick={() => setPaymentTarget(selectedInvoice)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <DollarSign className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => handleCopyInvoiceData(selectedInvoice)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setView('edit');
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setView('list');
              setSelectedInvoice(null);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Back
          </Button>
        </div>

        {/* Payment progress for partial */}
        {(selectedInvoice.status === 'partial' || selectedInvoice.amountPaid > 0) && selectedInvoice.status !== 'paid' && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground font-medium">Payment Progress</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(selectedInvoice.amountPaid)} of{' '}
                {formatCurrency(calcTotal(selectedInvoice.lineItems, selectedInvoice.taxRate, selectedInvoice.discount))}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (selectedInvoice.amountPaid /
                      calcTotal(selectedInvoice.lineItems, selectedInvoice.taxRate, selectedInvoice.discount)) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="max-w-2xl">
          <InvoicePreview
            invoice={selectedInvoice}
            template={selectedInvoice.template}
          />
        </div>

        {paymentTarget && (
          <PaymentDialog
            invoice={paymentTarget}
            onClose={() => setPaymentTarget(null)}
            onSubmit={(amount) => handleRecordPayment(paymentTarget.id, amount)}
          />
        )}
      </div>
    );
  }

  /* ---- List View -------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 min-h-screen bg-card">
      {isDemo && <DemoBanner reason="No invoice data from API" />}
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl transition-all duration-300 ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-50 text-emerald-300'
              : toast.type === 'error'
                ? 'border-red-500/30 bg-red-50 text-red-300'
                : 'border-blue-500/30 bg-blue-50 text-blue-300'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {toast.type === 'error' && <AlertTriangle className="h-4 w-4" />}
          {toast.type === 'info' && <FileText className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Invoices"
        subtitle="Create, manage, and track invoice payments"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Invoices' },
        ]}
      />

      {/* Stats */}
      <StatsCards invoices={invoices} />

      {/* Overdue Alert Banner */}
      {overdueInvoices.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">
              {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">
              {overdueInvoices.map((i) => `${i.number} (${i.clientName})`).join(', ')}
            </p>
          </div>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterStatus('overdue')}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            View All
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          className="flex-1 min-w-0 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-colors"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'draft', 'sent', 'paid', 'partial', 'overdue'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                filterStatus === s
                  ? 'border-red-500/50 bg-red-500/10 text-red-400'
                  : 'border-border bg-muted text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setView('create')}
          className="bg-red-600 hover:bg-red-500 text-white whitespace-nowrap"
        >
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* Invoice Table */}
      {processed.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title="No invoices found"
          description="Create your first invoice to get started."
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button onClick={() => toggleSort('client')} className="hover:text-foreground transition-colors">
                      Invoice <SortIcon field="client" />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button onClick={() => toggleSort('amount')} className="hover:text-foreground transition-colors">
                      Amount <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button onClick={() => toggleSort('date')} className="hover:text-foreground transition-colors">
                      Date <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Due</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((inv) => {
                  const total = calcTotal(inv.lineItems, inv.taxRate, inv.discount);
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-border hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setView('preview');
                      }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-red-400">{inv.number}</span>
                          {inv.recurring && <Repeat className="h-3 w-3 text-primary" />}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-foreground font-medium text-sm">{inv.clientName}</p>
                        <p className="text-muted-foreground text-xs">{inv.clientEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                        {inv.amountPaid > 0 && inv.status !== 'paid' && (
                          <p className="text-xs text-emerald-500 mt-0.5">
                            {formatCurrency(inv.amountPaid)} paid
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant={STATUS_VARIANT[inv.status]}>{STATUS_LABELS[inv.status]}</Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(inv.createdAt)}</td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {inv.dueDate ? formatDate(inv.dueDate) : '--'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {inv.status === 'draft' && (
                            <button
                              onClick={() => handleSendInvoice(inv.id)}
                              className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Send Invoice"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {inv.status !== 'paid' && inv.status !== 'draft' && (
                            <button
                              onClick={() => setPaymentTarget(inv)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Record Payment"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyInvoiceData(inv)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setView('edit');
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                            title="Edit"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {paymentTarget && (
        <PaymentDialog
          invoice={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSubmit={(amount) => handleRecordPayment(paymentTarget.id, amount)}
        />
      )}
    </div>
  );
}
