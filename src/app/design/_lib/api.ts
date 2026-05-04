"use client";

import type {
  AssetStatus,
  WarehouseAsset,
  WarehouseCategory,
} from "./types";

type RawAsset = {
  id: string;
  asset_type: string;
  url: string;
  thumb_url: string | null;
  name: string | null;
  category: string | null;
  source: string | null;
  source_url: string | null;
  license: string | null;
  status: string | null;
  notes: string | null;
  tags: string[] | null;
  prompt: string | null;
  engine: string | null;
  created_at: string;
  reviewed_at: string | null;
  meta: { slug?: string; ingestedAt?: string } | null;
};

export type WarehouseRow = WarehouseAsset & {
  status: AssetStatus;
  notes: string | null;
};

function normalize(r: RawAsset): WarehouseRow {
  return {
    id: r.id,
    name: r.name ?? r.meta?.slug ?? r.id,
    category: (r.category ?? r.asset_type ?? "icon-set") as WarehouseCategory,
    source: r.source ?? r.engine ?? "",
    sourceUrl: r.source_url ?? "",
    thumbUrl: r.thumb_url ?? r.url ?? "",
    license: r.license ?? "",
    tags: r.tags ?? [],
    ingestedAt:
      r.meta?.ingestedAt ?? r.created_at?.slice(0, 10) ?? "2026-05-01",
    signupRequired: false,
    status: ((r.status ?? "raw") as AssetStatus),
    notes: r.notes,
  };
}

export type CategoryRow = {
  category: string;
  count: number;
  rawCount: number;
  approvedCount: number;
  rejectedCount: number;
  usableCount: number;
};

export async function fetchAssets(): Promise<WarehouseRow[]> {
  // 8s timeout — when the upstream design.memelli.io is unreachable from this
  // egress (Thailand IP block), the fetch hangs forever and freezes the
  // dashboard's loading state. Treat timeout as "no assets — show empty list."
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch("/api/design/assets?limit=500", { cache: "no-store", signal: ac.signal });
    if (!r.ok) throw new Error(`assets fetch ${r.status}`);
    const j = (await r.json()) as { ok: boolean; assets: RawAsset[] };
    return (j.assets ?? []).map(normalize);
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return [];
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchCategories(): Promise<CategoryRow[]> {
  const r = await fetch("/api/design/assets/categories", { cache: "no-store" });
  if (!r.ok) throw new Error(`categories fetch ${r.status}`);
  const j = (await r.json()) as { ok: boolean; categories: CategoryRow[] };
  return j.categories ?? [];
}

export async function setAssetStatus(
  id: string,
  status: AssetStatus,
  notes?: string,
): Promise<void> {
  const r = await fetch(`/api/design/assets/${id}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status, notes }),
  });
  if (!r.ok) throw new Error(`status PATCH ${r.status}`);
}
