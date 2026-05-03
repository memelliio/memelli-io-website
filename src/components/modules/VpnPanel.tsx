'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Shield, Copy, Download, Trash2,
  ChevronDown, ChevronRight, Plus, Loader2, AlertCircle,
  Key, Check, Server, Activity, Globe,
} from 'lucide-react';

/* =========================================================================== */
/*  Constants                                                                   */
/* =========================================================================== */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_live_token') || localStorage.getItem('memelli_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

/* =========================================================================== */
/*  Types — mirrored from /api/vpn route shapes                                */
/* =========================================================================== */

interface VpnPeer {
  id: string;
  name: string;
  peerType: 'personal' | 'agent';
  publicKey: string;
  assignedIP: string;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
  /* only present on creation response */
  clientConfig?: string;
  clientConfigQR?: string;
}

interface PeersResponse {
  data: VpnPeer[];
  devicePeers: VpnPeer[];
  agentPeers: VpnPeer[];
  total: number;
}

interface VpnStatus {
  connected: boolean;
  region: string;
  endpoint: string;
  protocol: string;
  onlinePeers: number;
}

/* =========================================================================== */
/*  Sub-components                                                              */
/* =========================================================================== */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider border-b pb-1 mb-3"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      {children}
    </div>
  );
}

function StatCard({ value, label, icon }: { value: string | number; label: string; icon?: React.ReactNode }) {
  return (
    <div
      className="flex-1 rounded-xl p-3 flex flex-col gap-1.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {icon && <span className="text-zinc-500">{icon}</span>}
      <span className="text-white font-bold text-lg leading-none">{value}</span>
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: 'personal' | 'agent' }) {
  const isAgent = type === 'agent';
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider"
      style={{
        background: isAgent ? 'rgba(249,115,22,0.15)' : 'rgba(220,38,38,0.15)',
        color: isAgent ? '#f97316' : '#fca5a5',
        border: isAgent ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(220,38,38,0.3)',
      }}
    >
      {type}
    </span>
  );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors"
      style={{
        background: 'rgba(220,38,38,0.15)',
        border: '1px solid rgba(220,38,38,0.3)',
        color: '#fca5a5',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.25)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.15)')}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

/* =========================================================================== */
/*  VPN Peer Card                                                               */
/* =========================================================================== */

interface VpnPeerCardProps {
  peer: VpnPeer;
  onDelete: (id: string) => void;
  onDownloadConfig: (id: string, name: string) => void;
}

function VpnPeerCard({ peer, onDelete, onDownloadConfig }: VpnPeerCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    await onDelete(peer.id);
    setDeleting(false);
  }, [peer.id, onDelete]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    await onDownloadConfig(peer.id, peer.name);
    setDownloading(false);
  }, [peer.id, peer.name, onDownloadConfig]);

  const createdDate = new Date(peer.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const lastSeenText = peer.lastSeen
    ? new Date(peer.lastSeen).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Key size={14} className="text-zinc-500 shrink-0" />
          <span className="text-zinc-100 text-sm font-medium truncate">{peer.name}</span>
          <TypeBadge type={peer.peerType} />
        </div>
        <span
          className="shrink-0 text-[10px] font-mono rounded px-1.5 py-0.5"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#52525b',
          }}
        >
          {peer.assignedIP}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          Created {createdDate}
        </span>
        <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-wider">
          Last seen: {lastSeenText}
        </span>
      </div>

      {/* Public key preview */}
      <div
        className="rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-zinc-600 truncate"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
        title={peer.publicKey}
      >
        {peer.publicKey.slice(0, 32)}...
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.3)',
            color: '#fca5a5',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.15)')}
        >
          {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {downloading ? 'Fetching...' : 'Config'}
        </button>

        <CopyButton text={peer.publicKey} label="Copy Key" />

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ml-auto disabled:opacity-50"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#71717a',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220,38,38,0.1)';
            e.currentTarget.style.color = '#fca5a5';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = '#71717a';
          }}
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Delete
        </button>
      </div>
    </div>
  );
}

/* =========================================================================== */
/*  How It Works (collapsible)                                                  */
/* =========================================================================== */

function HowItWorks() {
  const [open, setOpen] = useState(false);

  const steps = [
    {
      color: '#dc2626',
      heading: 'WireGuard protocol',
      body: 'Industry-leading speed and modern cryptography. Your key pair is generated server-side on creation and the private key is returned exactly once — store it safely or download the .conf file immediately.',
    },
    {
      color: '#dc2626',
      heading: 'Personal peers',
      body: 'Install the downloaded .conf on any WireGuard client (iOS, Android, macOS, Windows, Linux). All traffic from that device exits through the Melli VPN server.',
    },
    {
      color: '#f97316',
      heading: 'Agent peers',
      body: 'Agent-type peers are used by Melli automation infrastructure. All autonomous task traffic exits through your dedicated tunnel, so every action appears from your assigned IP — not a shared data-center range.',
    },
    {
      color: '#22c55e',
      heading: 'IP pool — 10.8.0.0/24',
      body: 'Each peer receives a unique tunnel IP from the 10.8.0.x range. The server acts as the gateway at 10.8.0.1. Up to 253 peers are supported per server.',
    },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">How It Works</span>
        {open ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: step.color, marginTop: '6px' }}
              />
              <p className="text-zinc-400 text-sm leading-relaxed">
                <span className="text-zinc-200 font-medium">{step.heading}</span>{' '}
                — {step.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================== */
/*  Main Panel                                                                  */
/* =========================================================================== */

export function VpnPanel() {
  /* ── State ── */
  const [peers, setPeers] = useState<VpnPeer[]>([]);
  const [devicePeers, setDevicePeers] = useState<VpnPeer[]>([]);
  const [agentPeers, setAgentPeers] = useState<VpnPeer[]>([]);
  const [peersLoading, setPeersLoading] = useState(true);
  const [peersError, setPeersError] = useState<string | null>(null);

  const [status, setStatus] = useState<VpnStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  /* Generate form */
  const [genName, setGenName] = useState('');
  const [genType, setGenType] = useState<'personal' | 'agent'>('personal');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [newPeerConfig, setNewPeerConfig] = useState<{ name: string; config: string } | null>(null);

  /* ── Fetch server status (public endpoint) ── */
  const fetchStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const res = await fetch(`${API}/api/vpn/status`);
      if (res.ok) {
        const data: VpnStatus = await res.json();
        setStatus(data);
      }
    } catch {
      /* non-critical — swallow */
    } finally {
      setStatusLoading(false);
    }
  }, []);

  /* ── Fetch peers (authenticated) ── */
  const fetchPeers = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setPeersError('Not authenticated. Please sign in.');
      setPeersLoading(false);
      return;
    }
    try {
      setPeersLoading(true);
      setPeersError(null);
      const res = await fetch(`${API}/api/vpn/peers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server returned ${res.status}`);
      }
      const data: PeersResponse = await res.json();
      setPeers(data.data ?? []);
      setDevicePeers(data.devicePeers ?? []);
      setAgentPeers(data.agentPeers ?? []);
    } catch (err) {
      setPeersError(err instanceof Error ? err.message : 'Failed to load VPN peers');
    } finally {
      setPeersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchPeers();
  }, [fetchStatus, fetchPeers]);

  /* ── Create peer — POST /api/vpn/peers ── */
  const handleGenerate = useCallback(async () => {
    const name = genName.trim();
    if (!name) return;
    const token = getToken();
    if (!token) { setGenError('Not authenticated'); return; }

    setGenerating(true);
    setGenError(null);
    setNewPeerConfig(null);
    try {
      const res = await fetch(`${API}/api/vpn/peers`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name, type: genType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server returned ${res.status}`);
      }
      const json = await res.json();
      /* Response: { data: { ...peer, clientConfig, clientConfigQR } } */
      const created: VpnPeer = json.data ?? json;

      setPeers(prev => [created, ...prev]);
      if (created.peerType === 'personal') {
        setDevicePeers(prev => [created, ...prev]);
      } else {
        setAgentPeers(prev => [created, ...prev]);
      }

      /* Offer immediate config download if clientConfig was returned */
      if (created.clientConfig) {
        setNewPeerConfig({ name: created.name, config: created.clientConfig });
      }

      setGenName('');
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate peer');
    } finally {
      setGenerating(false);
    }
  }, [genName, genType]);

  /* ── Download config — GET /api/vpn/peers/:peerId/config ── */
  const handleDownloadConfig = useCallback(async (peerId: string, peerName: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/vpn/peers/${peerId}/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${peerName.replace(/\s+/g, '_')}.conf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      /* Surface error inline — could add toast here */
      console.error('[VPN] config download failed', err);
    }
  }, []);

  /* ── Delete peer — DELETE /api/vpn/peers/:peerId ── */
  const handleDelete = useCallback(async (peerId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/vpn/peers/${peerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setPeers(prev => prev.filter(p => p.id !== peerId));
      setDevicePeers(prev => prev.filter(p => p.id !== peerId));
      setAgentPeers(prev => prev.filter(p => p.id !== peerId));
    } catch (err) {
      console.error('[VPN] delete failed', err);
    }
  }, []);

  /* ── Download newly created config banner ── */
  const handleBannerDownload = useCallback(() => {
    if (!newPeerConfig) return;
    const blob = new Blob([newPeerConfig.config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newPeerConfig.name.replace(/\s+/g, '_')}.conf`;
    a.click();
    URL.revokeObjectURL(url);
    setNewPeerConfig(null);
  }, [newPeerConfig]);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  Render                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">

      {/* ── 1. Status banner ── */}
      <div
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="shrink-0 w-2.5 h-2.5 rounded-full"
            style={{
              background: status?.connected ? '#22c55e' : '#dc2626',
              boxShadow: status?.connected ? '0 0 6px #22c55e' : '0 0 6px #dc2626',
            }}
          />
          <Shield size={15} className="shrink-0 text-zinc-400" />
          <span className="text-zinc-100 font-semibold text-sm truncate">Melli VPN</span>

          {!statusLoading && status && (
            <>
              <span
                className="shrink-0 rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: '#a1a1aa',
                }}
              >
                {status.region}
              </span>
              <span
                className="shrink-0 rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#52525b',
                }}
              >
                {status.protocol}
              </span>
            </>
          )}
        </div>

        {!statusLoading && status && (
          <span
            className="shrink-0 text-[11px] font-mono"
            style={{ color: status.connected ? '#22c55e' : '#dc2626' }}
          >
            {status.connected ? 'Server Online' : 'Server Offline'}
          </span>
        )}
        {statusLoading && (
          <Loader2 size={14} className="animate-spin text-zinc-600 shrink-0" />
        )}
      </div>

      {/* ── 2. Stats row ── */}
      <div className="flex gap-3">
        <StatCard
          value={statusLoading ? '...' : (status?.onlinePeers ?? 0)}
          label="Total Peers"
          icon={<Activity size={13} />}
        />
        <StatCard
          value={devicePeers.length}
          label="Personal"
          icon={<Key size={13} />}
        />
        <StatCard
          value={agentPeers.length}
          label="Agent"
          icon={<Globe size={13} />}
        />
        <StatCard
          value={statusLoading ? '...' : (status?.endpoint ?? 'vpn.memelli.io')}
          label="Endpoint"
          icon={<Server size={13} />}
        />
      </div>

      {/* ── 3a. New peer config download banner ── */}
      {newPeerConfig && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.25)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Check size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
            <span className="text-sm text-zinc-200 truncate">
              <span className="font-medium" style={{ color: '#22c55e' }}>{newPeerConfig.name}</span>
              {' '}created — download the config now. It will not be shown again.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBannerDownload}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.35)',
                color: '#22c55e',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.15)')}
            >
              <Download size={13} />
              Download .conf
            </button>
            <button
              onClick={() => setNewPeerConfig(null)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs font-mono"
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── 3b. Peers list ── */}
      <div>
        <SectionHeader>Your Peers ({peers.length})</SectionHeader>

        {peersLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-zinc-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading peers...</span>
          </div>
        )}

        {!peersLoading && peersError && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              color: '#fca5a5',
            }}
          >
            <AlertCircle size={14} className="shrink-0" />
            {peersError}
          </div>
        )}

        {!peersLoading && !peersError && peers.length === 0 && (
          <div
            className="flex flex-col items-center gap-2 rounded-xl py-8"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Key size={22} className="text-zinc-600" />
            <span className="text-zinc-500 text-sm">No VPN peers yet. Generate one below.</span>
          </div>
        )}

        {!peersLoading && !peersError && peers.length > 0 && (
          <div className="flex flex-col gap-2">
            {peers.map(peer => (
              <VpnPeerCard
                key={peer.id}
                peer={peer}
                onDelete={handleDelete}
                onDownloadConfig={handleDownloadConfig}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Generate peer ── */}
      <div>
        <SectionHeader>Generate Peer</SectionHeader>

        <div
          className="rounded-xl p-3 flex flex-col gap-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Peer name (e.g. MacBook Pro, iPhone)"
              value={genName}
              onChange={e => setGenName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !generating && handleGenerate()}
              className="flex-1 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            />

            <select
              value={genType}
              onChange={e => setGenType(e.target.value as 'personal' | 'agent')}
              className="rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <option value="personal">Personal</option>
              <option value="agent">Agent</option>
            </select>
          </div>

          <p className="text-[11px] font-mono text-zinc-600">
            {genType === 'personal'
              ? 'Personal — install on your device for private browsing through the Melli VPN tunnel.'
              : 'Agent — routes autonomous task traffic through your dedicated tunnel IP.'}
          </p>

          {genError && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#fca5a5' }}>
              <AlertCircle size={13} className="shrink-0" />
              {genError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !genName.trim()}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
          >
            {generating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {generating ? 'Generating...' : 'Generate Peer'}
          </button>
        </div>
      </div>

      {/* ── 5. How it works ── */}
      <HowItWorks />
    </div>
  );
}
