'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Globe,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  History,
  Network,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DnsStatus = 'verified' | 'pending' | 'failed';
type SslStatus = 'active' | 'provisioning' | 'expired' | 'none';

interface Domain {
  id: string;
  domain: string;
  isPrimary: boolean;
  dnsStatus: DnsStatus;
  sslStatus: SslStatus;
  addedAt: string;
  lastChecked: string | null;
  routingRule: string;
  subdomains: Subdomain[];
}

interface Subdomain {
  id: string;
  name: string;
  target: string;
  dnsStatus: DnsStatus;
}

interface DomainHistoryEntry {
  id: string;
  action: string;
  domain: string;
  timestamp: string;
  detail: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_DOMAINS: Domain[] = [
  {
    id: '1',
    domain: 'memelli.com',
    isPrimary: true,
    dnsStatus: 'verified',
    sslStatus: 'active',
    addedAt: '2025-08-15T10:00:00Z',
    lastChecked: '2026-03-15T08:30:00Z',
    routingRule: 'default',
    subdomains: [
      { id: 's1', name: 'universe', target: 'dashboard', dnsStatus: 'verified' },
      { id: 's2', name: 'api', target: 'api-gateway', dnsStatus: 'verified' },
      { id: 's3', name: 'phone', target: 'twilio-webhook', dnsStatus: 'verified' },
    ],
  },
  {
    id: '2',
    domain: 'prequalhub.com',
    isPrimary: false,
    dnsStatus: 'verified',
    sslStatus: 'active',
    addedAt: '2025-10-01T14:00:00Z',
    lastChecked: '2026-03-15T08:30:00Z',
    routingRule: 'portal',
    subdomains: [
      { id: 's4', name: 'app', target: 'dashboard', dnsStatus: 'verified' },
    ],
  },
  {
    id: '3',
    domain: 'approvalstandard.com',
    isPrimary: false,
    dnsStatus: 'pending',
    sslStatus: 'provisioning',
    addedAt: '2026-03-14T16:00:00Z',
    lastChecked: null,
    routingRule: 'portal',
    subdomains: [],
  },
];

const INITIAL_HISTORY: DomainHistoryEntry[] = [
  { id: 'h1', action: 'DNS Verified', domain: 'memelli.com', timestamp: '2025-08-15T12:00:00Z', detail: 'A record verified successfully' },
  { id: 'h2', action: 'SSL Issued', domain: 'memelli.com', timestamp: '2025-08-15T12:05:00Z', detail: 'Let\'s Encrypt certificate provisioned' },
  { id: 'h3', action: 'Domain Added', domain: 'prequalhub.com', timestamp: '2025-10-01T14:00:00Z', detail: 'Custom domain registered' },
  { id: 'h4', action: 'DNS Verified', domain: 'prequalhub.com', timestamp: '2025-10-01T15:30:00Z', detail: 'CNAME record verified' },
  { id: 'h5', action: 'Domain Added', domain: 'approvalstandard.com', timestamp: '2026-03-14T16:00:00Z', detail: 'Awaiting DNS configuration' },
];

const ROUTING_RULES = [
  { value: 'default', label: 'Default -- Main application' },
  { value: 'portal', label: 'Portal -- Partner/affiliate portal' },
  { value: 'landing', label: 'Landing -- Marketing landing page' },
  { value: 'redirect', label: 'Redirect -- 301 redirect to primary' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Status badge components                                            */
/* ------------------------------------------------------------------ */

function DnsBadge({ status }: { status: DnsStatus }) {
  const config = {
    verified: { icon: CheckCircle2, label: 'Verified', classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    pending: { icon: Clock, label: 'Pending', classes: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    failed: { icon: XCircle, label: 'Failed', classes: 'text-red-400 bg-red-500/10 border-red-500/20' },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${config.classes}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function SslBadge({ status }: { status: SslStatus }) {
  const config = {
    active: { icon: ShieldCheck, label: 'SSL Active', classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    provisioning: { icon: Shield, label: 'Provisioning', classes: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    expired: { icon: ShieldAlert, label: 'Expired', classes: 'text-red-400 bg-red-500/10 border-red-500/20' },
    none: { icon: Shield, label: 'No SSL', classes: 'text-white/30 bg-white/5 border-white/10' },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${config.classes}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DomainsSettingsPage() {
  const [domains, setDomains] = useState<Domain[]>(INITIAL_DOMAINS);
  const [history] = useState<DomainHistoryEntry[]>(INITIAL_HISTORY);

  /* Add domain form */
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newRouting, setNewRouting] = useState('default');
  const [addingDomain, setAddingDomain] = useState(false);

  /* Add subdomain form */
  const [addSubdomainForId, setAddSubdomainForId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubTarget, setNewSubTarget] = useState('dashboard');

  /* Expanded domain cards */
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['1']));

  /* Checking DNS state */
  const [checkingDns, setCheckingDns] = useState<Set<string>>(new Set());

  /* Show history */
  const [showHistory, setShowHistory] = useState(false);

  /* ---- Actions ---- */

  function toggleExpanded(id: string) {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setAddingDomain(true);
    setTimeout(() => {
      const domain: Domain = {
        id: `d-${Date.now()}`,
        domain: newDomain.trim().toLowerCase(),
        isPrimary: false,
        dnsStatus: 'pending',
        sslStatus: 'none',
        addedAt: new Date().toISOString(),
        lastChecked: null,
        routingRule: newRouting,
        subdomains: [],
      };
      setDomains((prev) => [...prev, domain]);
      setNewDomain('');
      setNewRouting('default');
      setShowAddForm(false);
      setAddingDomain(false);
      toast.success(`Domain "${domain.domain}" added. Configure DNS to verify.`);
    }, 800);
  }

  function handleCheckDns(id: string) {
    setCheckingDns((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setDomains((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          const verified = d.dnsStatus === 'verified' || Math.random() > 0.4;
          return {
            ...d,
            dnsStatus: verified ? 'verified' : 'pending',
            sslStatus: verified ? 'active' : d.sslStatus,
            lastChecked: new Date().toISOString(),
          };
        }),
      );
      setCheckingDns((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('DNS check complete');
    }, 2000);
  }

  function handleSetPrimary(id: string) {
    setDomains((prev) =>
      prev.map((d) => ({ ...d, isPrimary: d.id === id })),
    );
    toast.success('Primary domain updated');
  }

  function handleDeleteDomain(id: string) {
    const domain = domains.find((d) => d.id === id);
    if (domain?.isPrimary) {
      toast.error('Cannot delete the primary domain');
      return;
    }
    setDomains((prev) => prev.filter((d) => d.id !== id));
    toast.success('Domain removed');
  }

  function handleUpdateRouting(id: string, rule: string) {
    setDomains((prev) =>
      prev.map((d) => (d.id === id ? { ...d, routingRule: rule } : d)),
    );
    toast.success('Routing rule updated');
  }

  function handleAddSubdomain(domainId: string) {
    if (!newSubName.trim()) return;
    setDomains((prev) =>
      prev.map((d) => {
        if (d.id !== domainId) return d;
        return {
          ...d,
          subdomains: [
            ...d.subdomains,
            {
              id: `sub-${Date.now()}`,
              name: newSubName.trim().toLowerCase(),
              target: newSubTarget,
              dnsStatus: 'pending',
            },
          ],
        };
      }),
    );
    setNewSubName('');
    setNewSubTarget('dashboard');
    setAddSubdomainForId(null);
    toast.success('Subdomain added');
  }

  function handleDeleteSubdomain(domainId: string, subId: string) {
    setDomains((prev) =>
      prev.map((d) => {
        if (d.id !== domainId) return d;
        return { ...d, subdomains: d.subdomains.filter((s) => s.id !== subId) };
      }),
    );
    toast.success('Subdomain removed');
  }

  /* ---- Render ---- */

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/30 mb-3">
            <a href="/dashboard/settings" className="hover:text-white/50 transition-colors">Settings</a>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/50">Domains</span>
          </div>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight flex items-center gap-3">
            <Globe className="h-6 w-6 text-red-400" />
            Domain Management
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Manage custom domains, DNS verification, SSL certificates, and routing rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/40 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl transition-all duration-200"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-200 shadow-lg shadow-red-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Domain
          </button>
        </div>
      </div>

      {/* Add Domain Form */}
      {showAddForm && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.03] backdrop-blur-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <h2 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-red-400" />
            Add Custom Domain
          </h2>
          <form onSubmit={handleAddDomain} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Domain</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  required
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Routing Rule</label>
                <select
                  value={newRouting}
                  onChange={(e) => setNewRouting(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all duration-200 [&>option]:bg-card [&>option]:text-white"
                >
                  {ROUTING_RULES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* DNS Instructions */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs font-medium text-white/50 mb-2">DNS Configuration Required</p>
              <div className="space-y-1.5">
                <p className="text-[11px] text-white/30 font-mono">
                  Type: CNAME &nbsp;&nbsp; Name: {newDomain || 'yourdomain.com'} &nbsp;&nbsp; Value: cname.memelli.com
                </p>
                <p className="text-[11px] text-white/30 font-mono">
                  Type: TXT &nbsp;&nbsp;&nbsp; Name: _memelli &nbsp;&nbsp; Value: memelli-verify=&lt;token&gt;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={addingDomain || !newDomain.trim()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200"
              >
                {addingDomain ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {addingDomain ? 'Adding...' : 'Add Domain'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewDomain(''); }}
                className="px-4 py-2 text-xs font-medium text-white/40 hover:text-white/60 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Domain List */}
      <div className="space-y-4">
        {domains.map((domain) => {
          const isExpanded = expandedDomains.has(domain.id);
          const isChecking = checkingDns.has(domain.id);

          return (
            <div
              key={domain.id}
              className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              {/* Domain header row */}
              <div
                className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-all duration-200"
                onClick={() => toggleExpanded(domain.id)}
              >
                <div className="flex items-center gap-2 text-white/30">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>

                {/* Domain name + primary badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-white/30 shrink-0" />
                    <span className="text-sm font-semibold text-white/85 truncate">{domain.domain}</span>
                    {domain.isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
                        <Star className="h-2.5 w-2.5" />
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-white/25">Added {formatDate(domain.addedAt)}</span>
                    {domain.lastChecked && (
                      <span className="text-[11px] text-white/20">
                        Last checked {relativeTime(domain.lastChecked)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <DnsBadge status={domain.dnsStatus} />
                  <SslBadge status={domain.sslStatus} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleCheckDns(domain.id)}
                    disabled={isChecking}
                    title="Check DNS"
                    className="p-2 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    <Search className={`h-3.5 w-3.5 ${isChecking ? 'animate-pulse' : ''}`} />
                  </button>
                  {!domain.isPrimary && (
                    <>
                      <button
                        onClick={() => handleSetPrimary(domain.id)}
                        title="Set as primary"
                        className="p-2 text-white/25 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all duration-200"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDomain(domain.id)}
                        title="Remove domain"
                        className="p-2 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-white/[0.04] bg-white/[0.01]">
                  {/* Routing rule */}
                  <div className="px-5 py-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-white/40">
                        <Network className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Routing Rule</span>
                      </div>
                      <select
                        value={domain.routingRule}
                        onChange={(e) => handleUpdateRouting(domain.id, e.target.value)}
                        className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white/70 focus:outline-none focus:border-red-500/40 transition-all duration-200 [&>option]:bg-card [&>option]:text-white"
                      >
                        {ROUTING_RULES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <a
                        href={`https://${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1.5 text-[11px] text-white/25 hover:text-red-400 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit
                      </a>
                    </div>
                  </div>

                  {/* DNS records info */}
                  {domain.dnsStatus !== 'verified' && (
                    <div className="px-5 py-4 border-b border-white/[0.04]">
                      <p className="text-xs font-medium text-amber-400/80 mb-2">DNS records required:</p>
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-1">
                        <p className="text-[11px] text-white/40 font-mono">
                          CNAME &nbsp; {domain.domain} &nbsp; <ArrowRight className="inline h-3 w-3" /> &nbsp; cname.memelli.com
                        </p>
                        <p className="text-[11px] text-white/40 font-mono">
                          TXT &nbsp;&nbsp;&nbsp; _memelli.{domain.domain} &nbsp; <ArrowRight className="inline h-3 w-3" /> &nbsp; memelli-verify={domain.id}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCheckDns(domain.id)}
                        disabled={isChecking}
                        className="mt-3 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
                        {isChecking ? 'Checking...' : 'Check DNS'}
                      </button>
                    </div>
                  )}

                  {/* Subdomains */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                        Subdomains ({domain.subdomains.length})
                      </h3>
                      <button
                        onClick={() => {
                          setAddSubdomainForId(addSubdomainForId === domain.id ? null : domain.id);
                          setNewSubName('');
                        }}
                        className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add Subdomain
                      </button>
                    </div>

                    {/* Add subdomain form */}
                    {addSubdomainForId === domain.id && (
                      <div className="mb-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-[11px] text-white/40 mb-1">Subdomain</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newSubName}
                              onChange={(e) => setNewSubName(e.target.value)}
                              placeholder="app"
                              className="w-24 px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-red-500/40 transition-all duration-200"
                            />
                            <span className="text-[11px] text-white/25">.{domain.domain}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[11px] text-white/40 mb-1">Target</label>
                          <select
                            value={newSubTarget}
                            onChange={(e) => setNewSubTarget(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white/70 focus:outline-none focus:border-red-500/40 transition-all duration-200 [&>option]:bg-card [&>option]:text-white"
                          >
                            <option value="dashboard">Dashboard</option>
                            <option value="api-gateway">API Gateway</option>
                            <option value="twilio-webhook">Twilio Webhook</option>
                            <option value="portal">Portal</option>
                            <option value="landing">Landing Page</option>
                          </select>
                        </div>
                        <button
                          onClick={() => handleAddSubdomain(domain.id)}
                          disabled={!newSubName.trim()}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-all duration-200"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddSubdomainForId(null)}
                          className="px-3 py-1.5 text-xs text-white/40 hover:text-white/60 bg-white/[0.04] hover:bg-white/[0.06] rounded-lg transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Subdomain list */}
                    {domain.subdomains.length > 0 ? (
                      <div className="space-y-1.5">
                        {domain.subdomains.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-xl group"
                          >
                            <span className="text-xs font-mono text-white/50">
                              {sub.name}.{domain.domain}
                            </span>
                            <ArrowRight className="h-3 w-3 text-white/15" />
                            <span className="text-[11px] text-white/30">{sub.target}</span>
                            <div className="ml-auto flex items-center gap-2">
                              <DnsBadge status={sub.dnsStatus} />
                              <button
                                onClick={() => handleDeleteSubdomain(domain.id, sub.id)}
                                className="p-1 text-white/15 hover:text-red-400 opacity-0 group-hover:opacity-100 rounded transition-all duration-200"
                                title="Remove subdomain"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-white/20 py-2">No subdomains configured</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {domains.length === 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-12 text-center">
          <Globe className="h-10 w-10 text-white/15 mx-auto mb-4" />
          <p className="text-sm text-white/40 mb-1">No domains configured</p>
          <p className="text-xs text-white/20 mb-5">Add a custom domain to start routing traffic.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Domain
          </button>
        </div>
      )}

      {/* Domain History */}
      {showHistory && (
        <div className="mt-6 rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <History className="h-4 w-4 text-white/40" />
              Domain History
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {history.map((entry) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-red-500/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/60">{entry.action}</span>
                    <span className="text-[11px] text-white/25 font-mono">{entry.domain}</span>
                  </div>
                  <p className="text-[11px] text-white/20 mt-0.5">{entry.detail}</p>
                </div>
                <span className="text-[11px] text-white/20 shrink-0">{formatDate(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="mt-6 p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl backdrop-blur-xl">
        <p className="text-xs text-white/30">
          <span className="text-white/50 font-medium">DNS Propagation:</span>{' '}
          Changes to DNS records can take up to 48 hours to propagate globally.
          SSL certificates are automatically provisioned once DNS verification succeeds.
        </p>
      </div>
    </div>
  );
}
