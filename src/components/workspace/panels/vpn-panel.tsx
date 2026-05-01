'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { IDockviewPanelProps } from 'dockview';
import { useApi } from '@/hooks/useApi';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface VpnStatus {
  connected: boolean;
  region: string;
  endpoint: string;
  protocol: string;
}

interface VpnPeer {
  id: string;
  name: string;
  ip: string;
  createdAt: string;
  config?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Icons (inline SVG, no external deps)                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ShieldIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function PlusIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function DownloadIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function QrIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <line x1="17" y1="20" x2="20" y2="20" />
      <line x1="20" y1="17" x2="20" y2="20" />
    </svg>
  );
}

function TrashIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'vpn-spin 0.75s linear infinite' }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="15 45" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  QR display sub-component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function QrDisplay({ config }: { config: string }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] text-zinc-500 mb-1.5 uppercase tracking-widest">WireGuard Config</p>
      <pre
        className="text-emerald-700 text-[10px] font-mono leading-relaxed overflow-auto rounded-lg p-3 max-h-48 whitespace-pre-wrap break-all select-all bg-[hsl(var(--muted))]"
        style={{ border: '1px solid rgba(16,185,129,0.3)' }}
      >
        {config}
      </pre>
      <p className="text-[10px] text-zinc-600 mt-1.5">Copy this into your WireGuard app or download the .conf file below.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Device card                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DeviceCard({
  peer,
  onRemove,
  onDownload,
}: {
  peer: VpnPeer;
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
}) {
  const [showQr, setShowQr] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [config, setConfig] = useState<string | null>(peer.config ?? null);
  const api = useApi();

  const formattedDate = new Date(peer.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const fetchConfig = useCallback(async () => {
    if (config) return config;
    setLoadingConfig(true);
    const res = await api.get<{ config: string }>(`/api/vpn/peers/${peer.id}/config`);
    setLoadingConfig(false);
    if (res.data?.config) {
      setConfig(res.data.config);
      return res.data.config;
    }
    return null;
  }, [api, peer.id, config]);

  const handleShowQr = async () => {
    if (!showQr) {
      await fetchConfig();
    }
    setShowQr((v) => !v);
  };

  const handleDownload = async () => {
    onDownload(peer.id);
    const cfg = await fetchConfig();
    if (!cfg) return;
    const blob = new Blob([cfg], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${peer.name.replace(/\s+/g, '-')}.conf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-100 text-sm truncate">{peer.name}</p>
          <p
            className="text-zinc-400 text-xs font-mono mt-0.5 truncate"
            style={{ letterSpacing: '0.03em' }}
          >
            {peer.ip}
          </p>
          <p className="text-zinc-600 text-xs mt-1">{formattedDate}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Download .conf */}
          <button
            onClick={handleDownload}
            disabled={loadingConfig}
            title="Download .conf"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-300 transition-colors focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.11)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
          >
            {loadingConfig ? <SpinnerIcon /> : <DownloadIcon />}
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Show QR */}
          <button
            onClick={handleShowQr}
            title={showQr ? 'Hide QR' : 'Show QR'}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none"
            style={{
              background: showQr ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
              color: showQr ? '#22c55e' : '#a1a1aa',
              boxShadow: showQr ? 'inset 0 0 0 1px rgba(34,197,94,0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!showQr) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.11)';
            }}
            onMouseLeave={(e) => {
              if (!showQr) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            <QrIcon />
            <span className="hidden sm:inline">{showQr ? 'Hide QR' : 'Show QR'}</span>
          </button>

          {/* Remove */}
          {confirmRemove ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRemove(peer.id)}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors focus:outline-none"
                style={{ background: '#ef4444' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#dc2626')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ef4444')}
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-400 transition-colors focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.11)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRemove(true)}
              title="Remove device"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-red-500 transition-colors focus:outline-none"
              style={{ background: 'rgba(239,68,68,0.08)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)')}
            >
              <TrashIcon />
              <span className="hidden sm:inline">Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* QR / config display */}
      {showQr && config && <QrDisplay config={config} />}
      {showQr && !config && (
        <p className="text-zinc-500 text-xs mt-3">Loading config…</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Add Device form                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AddDeviceForm({
  onAdd,
  onCancel,
}: {
  onAdd: (peer: VpnPeer) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Device name is required.');
      return;
    }
    setLoading(true);
    setError(null);

    const res = await api.post<VpnPeer>('/api/vpn/peers', { name: trimmed });

    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to create device.');
      return;
    }

    onAdd(res.data);
  };

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: '#1a1a1a', border: '1px solid rgba(239,68,68,0.25)' }}
    >
      <p className="text-zinc-100 font-semibold text-sm mb-3">Add New Device</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Device name (e.g. MacBook Pro)"
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
            style={{
              background: '#0f0f0f',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.5)')}
            onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#ef4444' }}
            onMouseEnter={(e) => {
              if (!loading && name.trim()) (e.currentTarget as HTMLElement).style.background = '#dc2626';
            }}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ef4444')}
          >
            {loading ? <SpinnerIcon /> : null}
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        <div>
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Server info chips                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-zinc-200 text-xs font-medium">{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main VPN Panel                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function VpnPanel(_props: IDockviewPanelProps) {
  const api = useApi();

  const [status, setStatus] = useState<VpnStatus | null>(null);
  const [peers, setPeers] = useState<VpnPeer[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingPeers, setLoadingPeers] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  /* Fetch status + peers on mount */
  useEffect(() => {
    let alive = true;

    api.get<VpnStatus>('/api/vpn/status').then((res) => {
      if (!alive) return;
      setLoadingStatus(false);
      if (res.data) setStatus(res.data);
    });

    api.get<VpnPeer[]>('/api/vpn/peers').then((res) => {
      if (!alive) return;
      setLoadingPeers(false);
      if (res.data) setPeers(res.data);
    });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = useCallback((peer: VpnPeer) => {
    setPeers((prev) => [peer, ...prev]);
    setNewlyAddedId(peer.id);
    setShowAddForm(false);
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    // Optimistic removal
    setPeers((prev) => prev.filter((p) => p.id !== id));
    await api.del(`/api/vpn/peers/${id}`);
  }, [api]);

  const handleDownload = useCallback((_id: string) => {
    // Download is handled inside DeviceCard; this is a no-op pass-through
  }, []);

  const connected = status?.connected ?? false;
  const region = status?.region ?? 'US East';
  const endpoint = status?.endpoint ?? 'vpn.memelli.io:51820';
  const protocol = status?.protocol ?? 'WireGuard';

  const isLoading = loadingStatus || loadingPeers;

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] text-zinc-100 overflow-hidden">

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Left: icon + title + status */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <ShieldIcon size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight tracking-wide">Melli VPN</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {/* Status dot */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: connected ? '#22c55e' : '#ef4444',
                  boxShadow: connected
                    ? '0 0 6px 1px rgba(34,197,94,0.6)'
                    : '0 0 6px 1px rgba(239,68,68,0.5)',
                }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: connected ? '#22c55e' : '#ef4444' }}
              >
                {loadingStatus ? 'Checking…' : connected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Add Device button */}
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all focus:outline-none"
          style={{
            background: showAddForm ? '#dc2626' : '#ef4444',
            boxShadow: '0 2px 8px rgba(239,68,68,0.35)',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#dc2626')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = showAddForm ? '#dc2626' : '#ef4444')}
        >
          <PlusIcon />
          Add Device
        </button>
      </div>

      {/* ── Server info row ──────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-5 py-3 flex-shrink-0 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <InfoChip label="Region" value={region} />
        <InfoChip label="Endpoint" value={endpoint} />
        <InfoChip label="Protocol" value={protocol} />
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">

        {/* Add device form */}
        {showAddForm && (
          <AddDeviceForm
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Loading skeleton */}
        {isLoading && peers.length === 0 && (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl"
                style={{
                  background: '#1a1a1a',
                  animation: 'vpn-pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && peers.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <span style={{ opacity: 0.7 }}><ShieldIcon size={28} className="text-red-500" /></span>
            </div>
            <div>
              <p className="font-semibold text-zinc-300 text-base">No VPN devices</p>
              <p className="text-zinc-600 text-sm mt-1">Add your first device to get started</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all focus:outline-none mt-1"
              style={{ background: '#ef4444', boxShadow: '0 2px 12px rgba(239,68,68,0.3)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#dc2626')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ef4444')}
            >
              <PlusIcon size={15} />
              Add Device
            </button>
          </div>
        )}

        {/* Devices list */}
        {peers.length > 0 && (
          <div className="flex flex-col gap-3">
            {peers.map((peer) => (
              <div
                key={peer.id}
                style={
                  newlyAddedId === peer.id
                    ? { animation: 'vpn-slide-in 0.3s ease forwards' }
                    : undefined
                }
              >
                <DeviceCard
                  peer={peer}
                  onRemove={handleRemove}
                  onDownload={handleDownload}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes vpn-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vpn-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes vpn-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
