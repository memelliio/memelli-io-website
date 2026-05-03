import "server-only";
import { pool } from "./db";

export type RegistryAppBody =
  | { kind: "node"; nodeName: string }
  | { kind: "stub"; title?: string; blurb?: string; ctaHref?: string; ctaLabel?: string }
  | { kind: "iframe"; src: string };

export type RegistryApp = {
  id: string;
  label: string;
  icon: string;
  category: "business" | "communications" | "productivity" | "system" | "hidden";
  modes: ("personal" | "business")[];
  singleton: boolean;
  badge: number | null;
  defaultSize: { w: number; h: number };
  body: RegistryAppBody;
};

export type Registry = {
  apps: RegistryApp[];
  generatedAt: string;
};

export async function loadOsRegistry(): Promise<Registry> {
  try {
    const r = await pool.query<{ code_text: string }>(
      "SELECT code_text FROM memelli_io_website.nodes WHERE active=true AND name='os-registry' ORDER BY version DESC LIMIT 1",
    );
    if (!r.rows[0]) return { apps: [], generatedAt: new Date().toISOString() };
    return JSON.parse(r.rows[0].code_text) as Registry;
  } catch (e) {
    console.error("[os-registry] load failed:", (e as Error).message);
    return { apps: [], generatedAt: new Date().toISOString() };
  }
}

export async function loadAppNodeCode(name: string): Promise<string | null> {
  try {
    const r = await pool.query<{ code_text: string }>(
      "SELECT code_text FROM memelli_io_website.nodes WHERE active=true AND name=$1 ORDER BY version DESC LIMIT 1",
      [name],
    );
    return r.rows[0]?.code_text ?? null;
  } catch (e) {
    console.error("[os-registry] load node failed:", name, (e as Error).message);
    return null;
  }
}

export async function loadIcon(name: string): Promise<{ buf: Buffer; mime: string } | null> {
  try {
    const r = await pool.query<{ code_text: string }>(
      "SELECT code_text FROM memelli_io_website.nodes WHERE active=true AND name=$1 ORDER BY version DESC LIMIT 1",
      [name],
    );
    if (!r.rows[0]) return null;
    const j = JSON.parse(r.rows[0].code_text) as { mime: string; base64: string };
    return { buf: Buffer.from(j.base64, "base64"), mime: j.mime };
  } catch (e) {
    console.error("[os-registry] load icon failed:", name, (e as Error).message);
    return null;
  }
}
