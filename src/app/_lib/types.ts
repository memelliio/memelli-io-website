import type { ComponentType } from "react";

export type AppId = string;

export type AppCategory = "business" | "communications" | "productivity" | "system" | "hidden";

export type AppMode = "personal" | "business";

export type AppDef = {
  id: AppId;
  label: string;
  icon: string;
  category?: AppCategory;
  badge?: number;
  /** Which OS modes show this app on the desktop. Default = both. */
  modes?: AppMode[];
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  singleton?: boolean;
  body:
    | { kind: "component"; Component: ComponentType<{ windowId: string }> }
    | { kind: "iframe"; src: string }
    | { kind: "stub"; title: string; blurb: string; ctaHref?: string; ctaLabel?: string };
};

export type WindowState = {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  prev?: { x: number; y: number; w: number; h: number };
};
