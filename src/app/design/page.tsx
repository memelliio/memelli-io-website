"use client";

/**
 * /design — Memelli Design Warehouse (operator's single window).
 *
 * One page, every asset, real interaction:
 *   • Websites — Open Live in /preview/<slug>/index.html iframe
 *   • Print + Mockups — full-image modal + Download Original ZIP
 *   • Music — inline <audio controls>
 *   • Motion — inline <video controls>
 *   • Pro Partner — folded-in marketing strip + curated 1-per-category grid
 *
 * Brand: editorial Memelli skin (white paper, red #C41E3A, ink, Inter).
 * No paid services. No emojis. Lucide stroke SVGs only via Hero.tsx etc.
 *
 * Data: GET /api/design/assets?limit=500 (forwards upstream design.memelli.io)
 *       + /preview/_manifest.json (slug → preview_url, requires_build)
 *
 * Single source of truth: localhost:3000/design.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchAssets,
  setAssetStatus,
  type WarehouseRow,
} from "./_lib/api";
import { type AssetStatus } from "./_lib/types";
import ProPartnerTab from "./_components/ProPartnerTab";
import LogoLabTab from "./_components/LogoLabTab";
import WedSnapTab from "./_components/WedSnapTab";
import SitesTab from "./_components/SitesTab";
import BrandSitesTab from "./_components/BrandSitesTab";

const RED = "#C41E3A";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const SOFT = "#FAFAFA";
const LINE = "#E5E7EB";
const LINE_SOFT = "#F0F0F2";
const MUTED = "#6B7280";
const MUTED_2 = "#9CA3AF";
const GREEN = "#10B981";
const INDIGO = "#6366F1";
const FONT = "Inter, system-ui, -apple-system, sans-serif";
const SHADOW = "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08)";

type StatusFilter = "all" | AssetStatus;
type SortKey = "newest" | "oldest" | "name-az";

type TabId =
  | "all"
  | "brand-sites"
  | "sites"
  | "websites"
  | "print"
  | "mockups"
  | "music"
  | "motion"
  | "icons"
  | "pro-partner"
  | "logo-lab"
  | "wedsnap";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "raw", label: "Raw" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "usable", label: "Usable" },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "name-az", label: "Name A→Z" },
];

/**
 * Tab → category match. Categories are loose strings from the upstream DB
 * (asset_type / category column), so each tab predicate accepts a small set.
 */
const TAB_DEFS: { id: TabId; label: string; matches: (a: WarehouseRow) => boolean }[] =
  [
    { id: "all", label: "All", matches: () => true },
    { id: "brand-sites", label: "Brand Sites", matches: () => false },
    { id: "sites", label: "Sites", matches: () => false },
    {
      id: "websites",
      label: "Websites",
      matches: (a) =>
        a.category === "landing-page" ||
        (a.category as string) === "mobile-template" ||
        (a.category as string) === "admin-dashboard",
    },
    {
      id: "print",
      label: "Print",
      matches: (a) =>
        (a.category as string) === "print" ||
        (a.category as string) === "banner-set" ||
        (a.category as string) === "brochure" ||
        (a.category as string) === "flyer" ||
        (a.category as string) === "infographic",
    },
    {
      id: "mockups",
      label: "Mockups",
      matches: (a) => (a.category as string) === "mockup",
    },
    {
      id: "music",
      label: "Music",
      matches: (a) => (a.category as string) === "music",
    },
    {
      id: "motion",
      label: "Motion",
      matches: (a) =>
        (a.category as string) === "motion" ||
        (a.category as string) === "video",
    },
    {
      id: "icons",
      label: "Icons",
      matches: (a) =>
        (a.category as string) === "icon-set" ||
        (a.category as string) === "lottie" ||
        (a.category as string) === "animated-svg",
    },
    { id: "pro-partner", label: "Pro Partner", matches: () => false },
    { id: "logo-lab", label: "Logo Lab", matches: () => false },
    { id: "wedsnap", label: "WedSnap", matches: () => false },
  ];

type PreviewManifest = {
  generated_at?: string;
  slugs?: Record<
    string,
    {
      preview_url: string | null;
      requires_build: boolean;
      source_root?: string;
      html_relative?: string | null;
    }
  >;
};

function statusColor(s: AssetStatus): string {
  switch (s) {
    case "approved":
      return GREEN;
    case "rejected":
      return RED;
    case "usable":
      return INDIGO;
    default:
      return MUTED_2;
  }
}

/** Pull slug out of meta when available, else a stable derivative of the id. */
function getSlug(a: WarehouseRow): string | null {
  const meta = (a as unknown as { meta?: { slug?: string } }).meta;
  return meta?.slug ?? null;
}

/**
 * Augment a row with preview info from /preview/_manifest.json.
 * Returns { previewUrl, requiresBuild }.
 */
function getPreviewInfo(
  a: WarehouseRow,
  manifest: PreviewManifest | null,
): { previewUrl: string | null; requiresBuild: boolean } {
  const slug = getSlug(a);
  if (!slug || !manifest?.slugs?.[slug]) {
    return { previewUrl: null, requiresBuild: false };
  }
  const m = manifest.slugs[slug];
  return {
    previewUrl: m.preview_url,
    requiresBuild: !!m.requires_build,
  };
}

/** Translate a Windows-style zip path stored in meta to a clickable file:// URL. */
function getZipPath(a: WarehouseRow): string | null {
  const meta = (a as unknown as { meta?: { zipPath?: string } }).meta;
  return meta?.zipPath ?? null;
}

export default function DesignWarehousePage() {
  const [assets, setAssets] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("brand-sites");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [manifest, setManifest] = useState<PreviewManifest | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const rows = await fetchAssets();
      setAssets(rows);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Load preview manifest (file under public/preview/_manifest.json — written
  // by .scratch/sync-previews.mjs after each ingest).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/preview/_manifest.json", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as PreviewManifest;
        if (!cancelled) setManifest(j);
      } catch {
        // No manifest yet — page still works (Open Live just stays disabled)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tabCounts = useMemo(() => {
    const map: Partial<Record<TabId, number>> = {};
    for (const t of TAB_DEFS) {
      if (t.id === "all") map[t.id] = assets.length;
      else if (t.id === "pro-partner" || t.id === "logo-lab" || t.id === "wedsnap" || t.id === "sites" || t.id === "brand-sites") map[t.id] = 0;
      else map[t.id] = assets.filter(t.matches).length;
    }
    return map;
  }, [assets]);

  const visible = useMemo(() => {
    if (activeTab === "pro-partner" || activeTab === "logo-lab" || activeTab === "wedsnap" || activeTab === "sites" || activeTab === "brand-sites") return [];
    let list = assets.slice();
    const tab = TAB_DEFS.find((t) => t.id === activeTab);
    if (tab && tab.id !== "all") list = list.filter(tab.matches);
    if (statusFilter !== "all")
      list = list.filter((a) => a.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (sort === "name-az")
      list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "oldest")
      list.sort((a, b) => a.ingestedAt.localeCompare(b.ingestedAt));
    else list.sort((a, b) => b.ingestedAt.localeCompare(a.ingestedAt));
    return list;
  }, [assets, activeTab, statusFilter, query, sort]);

  const opened = useMemo(
    () => (openId ? assets.find((a) => a.id === openId) ?? null : null),
    [openId, assets],
  );

  const apply = useCallback(
    async (id: string, status: AssetStatus) => {
      setPending((p) => ({ ...p, [id]: true }));
      // Optimistic
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      try {
        await setAssetStatus(id, status);
      } catch {
        // Revert on failure
        await reload();
      } finally {
        setPending((p) => {
          const n = { ...p };
          delete n[id];
          return n;
        });
      }
    },
    [reload],
  );

  return (
    <div
      style={{
        height: "100vh",
        background: PAPER,
        color: INK,
        fontFamily: FONT,
        display: "grid",
        gridTemplateRows: "60px auto 1fr",
        overflow: "hidden",
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr auto auto auto",
          alignItems: "center",
          gap: 16,
          padding: "0 20px",
          borderBottom: `1px solid ${LINE}`,
          background: PAPER,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              background: RED,
              borderRadius: 2,
              transform: "skewX(-12deg)",
            }}
          />
          <strong style={{ fontSize: 14, letterSpacing: "-0.2px" }}>
            Design Warehouse
          </strong>
          <span
            style={{
              fontSize: 10,
              color: MUTED,
              letterSpacing: "0.32em",
              marginLeft: 6,
              textTransform: "uppercase",
            }}
          >
            live · DB-shared
          </span>
        </div>

        <div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, tag, source…"
            style={{
              width: "100%",
              maxWidth: 540,
              height: 36,
              padding: "0 14px",
              border: `1px solid ${LINE}`,
              borderRadius: 10,
              outline: "none",
              fontSize: 13,
              background: SOFT,
              fontFamily: FONT,
              color: INK,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  height: 30,
                  padding: "0 12px",
                  fontSize: 12,
                  fontFamily: FONT,
                  background: active ? INK : "transparent",
                  color: active ? PAPER : INK,
                  border: `1px solid ${active ? INK : LINE}`,
                  borderRadius: 9999,
                  cursor: "pointer",
                  letterSpacing: "-0.1px",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          style={{
            height: 30,
            padding: "0 10px",
            fontSize: 12,
            border: `1px solid ${LINE}`,
            borderRadius: 8,
            background: PAPER,
            fontFamily: FONT,
            color: INK,
            cursor: "pointer",
          }}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <span
          style={{
            fontSize: 12,
            color: MUTED,
            fontVariantNumeric: "tabular-nums",
            paddingLeft: 6,
          }}
        >
          {visible.length} / {assets.length}
        </span>
      </header>

      {/* ── Tabs strip ──────────────────────────────────────────── */}
      <nav
        style={{
          display: "flex",
          gap: 4,
          padding: "0 20px",
          borderBottom: `1px solid ${LINE}`,
          background: PAPER,
          overflowX: "auto",
          overflowY: "hidden",
          height: 44,
          alignItems: "stretch",
        }}
        aria-label="Asset categories"
      >
        {TAB_DEFS.map((t) => {
          const active = activeTab === t.id;
          const count = tabCounts[t.id] ?? 0;
          const proPartner =
            t.id === "pro-partner" ||
            t.id === "wedsnap" ||
            t.id === "sites" ||
            t.id === "brand-sites" ||
            t.id === "logo-lab";
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                position: "relative",
                padding: "0 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: 13,
                color: active ? INK : MUTED,
                fontWeight: active ? 600 : 500,
                letterSpacing: "-0.1px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <span>{t.label}</span>
              {!proPartner && (
                <span
                  style={{
                    fontSize: 11,
                    color: active ? RED : MUTED_2,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ({count})
                </span>
              )}
              {proPartner && (
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    background: RED,
                    borderRadius: 9999,
                  }}
                />
              )}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  bottom: 0,
                  height: 2,
                  background: active ? RED : "transparent",
                  borderRadius: 2,
                }}
              />
            </button>
          );
        })}
      </nav>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ minHeight: 0, overflow: "hidden" }}>
        {activeTab === "pro-partner" ? (
          <ProPartnerTab assets={assets} manifest={manifest} />
        ) : activeTab === "logo-lab" ? (
          <LogoLabTab />
        ) : activeTab === "wedsnap" ? (
          <WedSnapTab />
        ) : activeTab === "sites" ? (
          <SitesTab />
        ) : activeTab === "brand-sites" ? (
          <BrandSitesTab />
        ) : (
          <main
            style={{
              padding: 20,
              overflowY: "auto",
              overflowX: "hidden",
              background: PAPER,
              minHeight: 0,
              height: "100%",
            }}
          >
            {loading ? (
              <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
                Loading…
              </div>
            ) : err ? (
              <div
                style={{
                  padding: 24,
                  border: `1px solid ${RED}33`,
                  background: `${RED}08`,
                  borderRadius: 10,
                  color: RED,
                  fontSize: 13,
                }}
              >
                Load failed: {err}
                <button
                  onClick={() => void reload()}
                  style={{
                    marginLeft: 12,
                    height: 26,
                    padding: "0 12px",
                    background: RED,
                    color: PAPER,
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Retry
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div
                style={{
                  padding: 60,
                  textAlign: "center",
                  color: MUTED,
                  fontSize: 13,
                }}
              >
                No assets match.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 14,
                  paddingBottom: 24,
                }}
              >
                {visible.map((a) => (
                  <AssetCard
                    key={a.id}
                    asset={a}
                    manifest={manifest}
                    pending={!!pending[a.id]}
                    onApprove={() => void apply(a.id, "approved")}
                    onReject={() => void apply(a.id, "rejected")}
                    onReset={() => void apply(a.id, "raw")}
                    onOpen={() => setOpenId(a.id)}
                  />
                ))}
              </div>
            )}
          </main>
        )}
      </div>

      {/* ── Detail modal ────────────────────────────────────────── */}
      {opened && (
        <DetailModal
          asset={opened}
          manifest={manifest}
          onClose={() => setOpenId(null)}
          onApprove={() => void apply(opened.id, "approved")}
          onReject={() => void apply(opened.id, "rejected")}
          onUsable={() => void apply(opened.id, "usable")}
          onReset={() => void apply(opened.id, "raw")}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  manifest,
  pending,
  onApprove,
  onReject,
  onReset,
  onOpen,
}: {
  asset: WarehouseRow;
  manifest: PreviewManifest | null;
  pending: boolean;
  onApprove: () => void;
  onReject: () => void;
  onReset: () => void;
  onOpen: () => void;
}) {
  const dim = asset.status === "rejected";
  const cat = asset.category as string;
  const isWebsite =
    cat === "landing-page" ||
    cat === "mobile-template" ||
    cat === "admin-dashboard";
  const isMusic = cat === "music";
  const isMotion = cat === "motion" || cat === "video";

  const { previewUrl, requiresBuild } = getPreviewInfo(asset, manifest);

  return (
    <div
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: SHADOW,
        display: "grid",
        gridTemplateRows: "auto auto",
        opacity: dim ? 0.45 : pending ? 0.7 : 1,
        transition: "opacity 0.18s ease",
      }}
    >
      <button
        onClick={onOpen}
        style={{
          aspectRatio: "16 / 10",
          background: LINE_SOFT,
          border: "none",
          padding: 0,
          cursor: "zoom-in",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={asset.thumbUrl}
          alt={asset.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
            (e.currentTarget as HTMLImageElement).style.objectFit = "contain";
          }}
        />
        {isWebsite && previewUrl && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              padding: "2px 8px",
              background: RED,
              color: PAPER,
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              borderRadius: 9999,
              fontWeight: 600,
            }}
          >
            Live
          </span>
        )}
        {isWebsite && !previewUrl && requiresBuild && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              padding: "2px 8px",
              background: INDIGO,
              color: PAPER,
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              borderRadius: 9999,
              fontWeight: 600,
            }}
          >
            Needs build
          </span>
        )}
      </button>

      {/* Inline media preview by category */}
      {isMusic && asset.thumbUrl && (
        <div style={{ padding: "8px 12px 0" }}>
          <audio
            controls
            preload="metadata"
            style={{ width: "100%", height: 32 }}
            src={
              (asset as unknown as { meta?: { audio_url?: string } }).meta
                ?.audio_url ??
              (asset as unknown as { url?: string }).url ??
              asset.thumbUrl
            }
          />
        </div>
      )}
      {isMotion && (
        <div style={{ padding: "8px 12px 0" }}>
          <video
            controls
            preload="metadata"
            playsInline
            style={{
              width: "100%",
              borderRadius: 6,
              background: "#000",
            }}
            poster={asset.thumbUrl}
            src={
              (asset as unknown as { url?: string }).url ?? asset.thumbUrl
            }
          />
        </div>
      )}

      <div
        style={{
          padding: "10px 12px 12px",
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            title={asset.name}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: INK,
              letterSpacing: "-0.1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {asset.name}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: MUTED,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "0.04em",
            }}
          >
            {asset.source} · {asset.license}
          </div>
          <div style={{ marginTop: 6 }}>
            <StatusPill status={asset.status} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {isWebsite ? (
            previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  padding: "0 11px",
                  background: PAPER,
                  color: RED,
                  border: `1px solid ${RED}`,
                  borderRadius: 8,
                  fontSize: 11.5,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontFamily: FONT,
                }}
              >
                <ExternalLinkIcon />
                Open Live
              </a>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 28,
                  padding: "0 11px",
                  background: SOFT,
                  color: MUTED,
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: FONT,
                }}
              >
                {requiresBuild ? "Needs build" : "No preview"}
              </span>
            )
          ) : (
            <span style={{ minWidth: 0 }} />
          )}

          <div style={{ display: "flex", gap: 4 }}>
            <IconBtn
              label="Approve"
              color={GREEN}
              active={asset.status === "approved"}
              onClick={onApprove}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </IconBtn>
            <IconBtn
              label="Reject"
              color={RED}
              active={asset.status === "rejected"}
              onClick={onReject}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </IconBtn>
            {asset.status !== "raw" && (
              <IconBtn
                label="Reset"
                color={MUTED}
                active={false}
                onClick={onReset}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <polyline points="3 3 3 8 8 8" />
                </svg>
              </IconBtn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function IconBtn({
  label,
  color,
  active,
  onClick,
  children,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        width: 28,
        height: 28,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${active ? color : LINE}`,
        background: active ? color : PAPER,
        color: active ? PAPER : color,
        borderRadius: 8,
        cursor: "pointer",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: AssetStatus }) {
  const c = statusColor(status);
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        color: c,
        background: status === "raw" ? "transparent" : `${c}14`,
        border: `1px solid ${status === "raw" ? LINE : c}33`,
        padding: "3px 8px",
        borderRadius: 9999,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────

function DetailModal({
  asset,
  manifest,
  onClose,
  onApprove,
  onReject,
  onUsable,
  onReset,
}: {
  asset: WarehouseRow;
  manifest: PreviewManifest | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onUsable: () => void;
  onReset: () => void;
}) {
  const cat = asset.category as string;
  const isWebsite =
    cat === "landing-page" ||
    cat === "mobile-template" ||
    cat === "admin-dashboard";
  const isMusic = cat === "music";
  const isMotion = cat === "motion" || cat === "video";

  const { previewUrl, requiresBuild } = getPreviewInfo(asset, manifest);
  const zipPath = getZipPath(asset);
  const audioUrl =
    (asset as unknown as { meta?: { audio_url?: string } }).meta?.audio_url ??
    (asset as unknown as { url?: string }).url ??
    asset.thumbUrl;
  const videoUrl =
    (asset as unknown as { url?: string }).url ?? asset.thumbUrl;

  const [notes, setNotes] = useState(asset.notes ?? "");
  const notesInitial = useRef(asset.notes ?? "");

  const onNotesBlur = useCallback(async () => {
    if (notes === notesInitial.current) return;
    try {
      await fetch(`/api/design/assets/${asset.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: asset.status, notes }),
      });
      notesInitial.current = notes;
    } catch {
      // Ignore — non-blocking
    }
  }, [asset.id, asset.status, notes]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,11,15,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1100px, 100%)",
          maxHeight: "92vh",
          background: PAPER,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.35)",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
        }}
      >
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{asset.name}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
              {asset.source} ·{" "}
              <a
                href={asset.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: RED, textDecoration: "none" }}
              >
                source
              </a>{" "}
              · {asset.license}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              border: `1px solid ${LINE}`,
              background: PAPER,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              color: INK,
              fontFamily: FONT,
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            padding: 18,
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 18,
          }}
        >
          {/* Stage — adapts to category */}
          <div
            style={{
              background: LINE_SOFT,
              borderRadius: 10,
              overflow: "hidden",
              minHeight: 360,
              display: "grid",
              placeItems: isWebsite && previewUrl ? "stretch" : "center",
            }}
          >
            {isWebsite && previewUrl ? (
              <iframe
                src={previewUrl}
                title={asset.name}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                style={{
                  width: "100%",
                  height: "min(70vh, 720px)",
                  border: "none",
                  background: PAPER,
                }}
              />
            ) : isMusic ? (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  width: "100%",
                  padding: 24,
                  placeItems: "center",
                }}
              >
                <img
                  src={asset.thumbUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    maxWidth: 380,
                    maxHeight: 220,
                    objectFit: "contain",
                    opacity: 0.9,
                  }}
                />
                <audio
                  controls
                  preload="metadata"
                  src={audioUrl}
                  style={{ width: "100%", maxWidth: 540 }}
                />
              </div>
            ) : isMotion ? (
              <video
                controls
                preload="metadata"
                playsInline
                src={videoUrl}
                poster={asset.thumbUrl}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  background: "#000",
                  display: "block",
                }}
              />
            ) : (
              <img
                src={asset.thumbUrl}
                alt={asset.name}
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  display: "block",
                }}
              />
            )}
          </div>

          {/* Meta panel */}
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <KV label="Category">{asset.category}</KV>
            <KV label="Status">
              <StatusPill status={asset.status} />
            </KV>
            <KV label="Ingested">{asset.ingestedAt}</KV>
            <KV label="License">{asset.license}</KV>
            <KV label="Tags">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {asset.tags.length === 0 ? (
                  <span style={{ color: MUTED }}>—</span>
                ) : (
                  asset.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        border: `1px solid ${LINE}`,
                        borderRadius: 9999,
                        color: INK,
                      }}
                    >
                      {t}
                    </span>
                  ))
                )}
              </div>
            </KV>
            {getSlug(asset) && (
              <KV label="Slug">
                <code
                  style={{
                    fontSize: 11,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: INK,
                    wordBreak: "break-all",
                  }}
                >
                  {getSlug(asset)}
                </code>
              </KV>
            )}
            {zipPath && (
              <KV label="Original ZIP">
                <a
                  href={`file:///${zipPath.replace(/\\/g, "/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 11,
                    color: RED,
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  Download
                </a>
              </KV>
            )}
            <KV label="Source URL">
              <a
                href={asset.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  color: RED,
                  textDecoration: "none",
                  wordBreak: "break-all",
                }}
              >
                {asset.sourceUrl}
              </a>
            </KV>

            <div>
              <div
                style={{
                  fontSize: 9,
                  color: MUTED,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Notes
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => void onNotesBlur()}
                placeholder="Operator notes…"
                rows={3}
                style={{
                  width: "100%",
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 12,
                  fontFamily: FONT,
                  color: INK,
                  background: PAPER,
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </div>

        <footer
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 18px",
            borderTop: `1px solid ${LINE}`,
            background: SOFT,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {isWebsite && previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  height: 32,
                  padding: "0 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: PAPER,
                  color: RED,
                  border: `1px solid ${RED}`,
                  borderRadius: 8,
                  fontSize: 12.5,
                  textDecoration: "none",
                  fontFamily: FONT,
                  fontWeight: 600,
                }}
              >
                <ExternalLinkIcon />
                Open Live
              </a>
            )}
            {isWebsite && !previewUrl && requiresBuild && (
              <span
                style={{
                  fontSize: 11,
                  color: MUTED,
                  fontStyle: "italic",
                }}
              >
                Source-only pack — needs build before live preview
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <FooterBtn onClick={onReset} variant="ghost">
              Reset
            </FooterBtn>
            <FooterBtn onClick={onReject} variant="reject">
              Reject
            </FooterBtn>
            <FooterBtn onClick={onUsable} variant="usable">
              Mark Usable
            </FooterBtn>
            <FooterBtn onClick={onApprove} variant="approve">
              Approve
            </FooterBtn>
          </div>
        </footer>
      </div>
    </div>
  );
}

function KV({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          color: MUTED,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: INK }}>{children}</div>
    </div>
  );
}

function FooterBtn({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "ghost" | "approve" | "reject" | "usable";
  children: React.ReactNode;
}) {
  const map: Record<typeof variant, { bg: string; fg: string; border: string }> = {
    ghost: { bg: PAPER, fg: INK, border: LINE },
    approve: { bg: GREEN, fg: PAPER, border: GREEN },
    reject: { bg: RED, fg: PAPER, border: RED },
    usable: { bg: INDIGO, fg: PAPER, border: INDIGO },
  };
  const s = map[variant];
  return (
    <button
      onClick={onClick}
      style={{
        height: 32,
        padding: "0 14px",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        fontSize: 12.5,
        fontFamily: FONT,
        cursor: "pointer",
        letterSpacing: "-0.1px",
      }}
    >
      {children}
    </button>
  );
}

