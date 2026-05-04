export type AssetStatus = "raw" | "approved" | "rejected" | "usable";

export type WarehouseCategory =
  | "landing-page"
  | "admin-dashboard"
  | "component-library"
  | "icon-set"
  | "illustration"
  | "photo"
  | "pattern-background"
  | "mockup"
  | "font-specimen"
  | "public-domain-art"
  | "ui-kit"
  | "video";

export type WarehouseAsset = {
  id: string;
  name: string;
  category: WarehouseCategory;
  source: string;
  sourceUrl: string;
  thumbUrl: string;
  license: string;
  tags: string[];
  ingestedAt: string;
  signupRequired: false;
};

export const CATEGORY_LABELS: Record<WarehouseCategory, string> = {
  "landing-page": "Landing Pages",
  "admin-dashboard": "Admin Dashboards",
  "component-library": "Component Libraries",
  "icon-set": "Icon Sets",
  illustration: "Illustrations",
  photo: "Photos",
  "pattern-background": "Patterns + Backgrounds",
  mockup: "Mockups",
  "font-specimen": "Font Specimens",
  "public-domain-art": "Public Domain Art",
  "ui-kit": "UI Kits",
  video: "Video",
};

export const CATEGORY_ORDER: WarehouseCategory[] = [
  "landing-page",
  "admin-dashboard",
  "component-library",
  "ui-kit",
  "icon-set",
  "illustration",
  "photo",
  "public-domain-art",
  "pattern-background",
  "mockup",
  "font-specimen",
  "video",
];
