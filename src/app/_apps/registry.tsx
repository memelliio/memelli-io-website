import type { AppDef } from "../_lib/types";
import { Welcome } from "./Welcome";
import { Notes } from "./Notes";
import { Files } from "./Files";
import { Settings } from "./Settings";
import { Browser } from "./Browser";
import { Calculator } from "./Calculator";
import { Terminal } from "./Terminal";
import { Clock } from "./Clock";
import { MelliBarSettings } from "./MelliBarSettings";
import { MemelliTerminal } from "./MemelliTerminal";
import { SignUp } from "./SignUp";
import { CreditRepair } from "./CreditRepair";
import { CreditReports } from "./CreditReports";
import { DocuVault } from "./DocuVault";
import { CRM } from "./CRM";
import { Ecommerce } from "./Ecommerce";
import { CommerceAdmin } from "./CommerceAdmin";
import { CRMAdmin } from "./CRMAdmin";
import { PreQual } from "./PreQual";
import { Credit } from "./Credit";
import { ClientWorkspace } from "./ClientWorkspace";
import { PartnersHub } from "./PartnersHub";

const I = "/api/os-icon";

export const APPS: AppDef[] = [
  // ── PRIMARY ENTRY ──────────────────────────────────────────────
  { id: "memelli-terminal", label: "Memelli Terminal", icon: `${I}/memelli-chat.png`, category: "business", modes: ["personal", "business"], singleton: true, defaultSize: { w: 1100, h: 720 }, body: { kind: "iframe", src: "/memelli-terminal" } },

  // ── BUSINESS ───────────────────────────────────────────────────
  { id: "pre-qualification", label: "Pre-Qualification", icon: `${I}/pre-qualification.png`, category: "business", modes: ["personal", "business"], singleton: true, defaultSize: { w: 980, h: 700 }, body: { kind: "node", nodeName: "os-app-prequal" } },
  { id: "funding", label: "Funding", icon: `${I}/funding.png`, category: "business", modes: ["personal", "business"], badge: 3, defaultSize: { w: 760, h: 500 }, body: { kind: "stub", title: "Funding", blurb: "Funding requests in flight.", ctaHref: "/dashboard/funding", ctaLabel: "Open Funding" } },
  { id: "credit-repair", label: "Credit Repair", icon: `${I}/credit-reports.png`, category: "business", modes: ["personal", "business"], badge: 2, singleton: true, defaultSize: { w: 920, h: 700 }, body: { kind: "node", nodeName: "os-app-creditrepair" } },
  { id: "credit-reports", label: "Credit Reports", icon: `${I}/credit-reports.png`, category: "business", modes: ["business"], singleton: true, defaultSize: { w: 1000, h: 720 }, body: { kind: "node", nodeName: "os-app-creditreports" } },
  { id: "credit", label: "Credit", icon: `${I}/credit-reports.png`, category: "business", modes: ["personal", "business"], singleton: true, defaultSize: { w: 880, h: 640 }, body: { kind: "node", nodeName: "os-app-credit" } },
  { id: "crm", label: "CRM", icon: `${I}/relationships.png`, category: "business", modes: ["business"], badge: 28, singleton: true, defaultSize: { w: 1280, h: 760 }, body: { kind: "node", nodeName: "os-app-crmadmin" } },
  { id: "companies", label: "Companies", icon: `${I}/companies.png`, category: "business", modes: ["business"], defaultSize: { w: 720, h: 480 }, body: { kind: "stub", title: "Companies", blurb: "Org records.", ctaHref: "/dashboard/companies", ctaLabel: "Open" } },
  { id: "deals", label: "Deals", icon: `${I}/deals.png`, category: "business", modes: ["business"], defaultSize: { w: 720, h: 480 }, body: { kind: "stub", title: "Deals", blurb: "Active deals.", ctaHref: "/dashboard/deals", ctaLabel: "Open" } },
  { id: "pipelines", label: "Pipelines", icon: `${I}/pipelines.png`, category: "business", modes: ["business"], defaultSize: { w: 720, h: 480 }, body: { kind: "stub", title: "Pipelines", blurb: "Stage boards.", ctaHref: "/dashboard/pipelines", ctaLabel: "Open" } },
  { id: "storefront", label: "Storefront", icon: `${I}/storefront.png`, category: "business", modes: ["business"], singleton: true, defaultSize: { w: 1280, h: 760 }, body: { kind: "node", nodeName: "os-app-commerceadmin" } },
  { id: "revenue-builder", label: "Revenue Builder", icon: `${I}/revenue-builder.png`, category: "business", modes: ["business"], defaultSize: { w: 760, h: 500 }, body: { kind: "stub", title: "Revenue Builder", blurb: "Spin up new sites and offers.", ctaHref: "/dashboard/revenue-builder", ctaLabel: "Open" } },
  { id: "docuvault", label: "DocuVault", icon: `${I}/files.png`, category: "business", modes: ["business"], singleton: true, defaultSize: { w: 1000, h: 700 }, body: { kind: "node", nodeName: "os-app-docuvault" } },
  { id: "billing", label: "Billing", icon: `${I}/billing.png`, category: "business", modes: ["business"], defaultSize: { w: 720, h: 480 }, body: { kind: "stub", title: "Billing", blurb: "Invoices and payments.", ctaHref: "/dashboard/billing", ctaLabel: "Open" } },
  { id: "partners", label: "Partners", icon: `${I}/relationships.png`, category: "business", modes: ["business"], singleton: true, defaultSize: { w: 1100, h: 760 }, body: { kind: "node", nodeName: "os-app-partnershub" } },

  // ── COMMUNICATIONS (6) ─────────────────────────────────────────
  { id: "phone", label: "Phone", icon: `${I}/phone.png`, category: "communications", modes: ["business"], defaultSize: { w: 420, h: 600 }, body: { kind: "stub", title: "Phone", blurb: "Outbound + inbound." } },
  { id: "video-conference", label: "Video Conference", icon: `${I}/video-conference.png`, category: "communications", modes: ["business"], defaultSize: { w: 880, h: 560 }, body: { kind: "stub", title: "Video Conference", blurb: "Multi-party meet." } },
  { id: "messages", label: "Messages", icon: `${I}/messages.png`, category: "communications", modes: ["business"], badge: 7, defaultSize: { w: 720, h: 500 }, body: { kind: "stub", title: "Messages", blurb: "SMS + chat threads." } },
  { id: "voicemail", label: "Voicemail", icon: `${I}/voicemail.png`, category: "communications", modes: ["business"], defaultSize: { w: 560, h: 420 }, body: { kind: "stub", title: "Voicemail", blurb: "Transcribed voicemails." } },
  { id: "social", label: "Social", icon: `${I}/social.png`, category: "communications", modes: ["business"], defaultSize: { w: 720, h: 500 }, body: { kind: "stub", title: "Social", blurb: "Inbound mentions." } },

  // ── PRODUCTIVITY & MEDIA (10) ──────────────────────────────────
  { id: "workflow-builder", label: "Workflow Builder", icon: `${I}/workflow-builder.png`, category: "productivity", modes: ["business"], defaultSize: { w: 880, h: 580 }, body: { kind: "stub", title: "Workflow Builder", blurb: "Automations + triggers." } },
  { id: "calendar", label: "Calendar", icon: `${I}/calendar.png`, category: "productivity", modes: ["business"], defaultSize: { w: 760, h: 540 }, body: { kind: "stub", title: "Calendar", blurb: "Month / week / day." } },
  { id: "bookings", label: "Bookings", icon: `${I}/bookings.png`, category: "productivity", modes: ["business"], defaultSize: { w: 720, h: 480 }, body: { kind: "stub", title: "Bookings", blurb: "Scheduling links." } },
  { id: "notes", label: "Notes", icon: `${I}/notes.png`, category: "productivity", modes: ["business"], defaultSize: { w: 560, h: 440 }, body: { kind: "node", nodeName: "os-app-notes" } },
  { id: "reports", label: "Reports", icon: `${I}/reports.png`, category: "productivity", modes: ["business"], defaultSize: { w: 760, h: 500 }, body: { kind: "stub", title: "Reports", blurb: "Saved analytics views." } },
  { id: "seo", label: "SEO", icon: `${I}/seo.png`, category: "productivity", modes: ["business"], defaultSize: { w: 760, h: 500 }, body: { kind: "stub", title: "SEO", blurb: "Keywords + ranks." } },
  { id: "photos", label: "Photos", icon: `${I}/photos.png`, category: "productivity", modes: ["business"], defaultSize: { w: 720, h: 500 }, body: { kind: "stub", title: "Photos", blurb: "Image library." } },
  { id: "tv", label: "TV", icon: `${I}/tv.png`, category: "productivity", modes: ["personal", "business"], defaultSize: { w: 880, h: 540 }, body: { kind: "stub", title: "TV", blurb: "Memelli TV channel." } },
  { id: "music", label: "Music", icon: `${I}/radio.png`, category: "productivity", modes: ["personal", "business"], defaultSize: { w: 480, h: 320 }, body: { kind: "stub", title: "Music", blurb: "Memelli music." } },
  { id: "radio", label: "Radio", icon: `${I}/radio.png`, category: "productivity", modes: ["personal", "business"], defaultSize: { w: 480, h: 320 }, body: { kind: "stub", title: "Radio", blurb: "Memelli radio." } },

  // ── SYSTEM (5) ─────────────────────────────────────────────────
  { id: "wallet", label: "Wallet", icon: `${I}/wallet.png`, category: "system", modes: ["business"], defaultSize: { w: 560, h: 420 }, body: { kind: "stub", title: "Wallet", blurb: "Cards + payouts." } },
  { id: "trading", label: "Trading", icon: `${I}/trading.png`, category: "system", modes: ["business"], defaultSize: { w: 880, h: 540 }, body: { kind: "stub", title: "Trading", blurb: "Memelli trading desk." } },
  { id: "lockmail", label: "Lockmail", icon: `${I}/lockmail.png`, category: "system", modes: ["business"], defaultSize: { w: 720, h: 480 }, body: { kind: "stub", title: "Lockmail", blurb: "Encrypted mail." } },
  { id: "vpn", label: "VPN", icon: `${I}/vpn.png`, category: "system", modes: ["business"], defaultSize: { w: 480, h: 360 }, body: { kind: "stub", title: "VPN", blurb: "Network tunnel." } },
  { id: "ugc-factory", label: "UGC Factory", icon: `${I}/ugc-factory.png`, category: "system", modes: ["business"], defaultSize: { w: 880, h: 540 }, body: { kind: "stub", title: "UGC Factory", blurb: "Generate ads + posts." } },

  // ── HIDDEN (built-in but not on desktop grid) ─────────────────
  { id: "welcome", label: "Welcome", icon: `${I}/memelli-chat.png`, category: "hidden", singleton: true, defaultSize: { w: 720, h: 500 }, body: { kind: "node", nodeName: "os-app-welcome" } },
  { id: "settings", label: "Settings", icon: `${I}/workflow-builder.png`, category: "hidden", singleton: true, defaultSize: { w: 720, h: 480 }, body: { kind: "node", nodeName: "os-app-settings" } },
  { id: "browser", label: "Browser", icon: `${I}/seo.png`, category: "hidden", defaultSize: { w: 980, h: 640 }, body: { kind: "node", nodeName: "os-app-browser" } },
  { id: "calculator", label: "Calculator", icon: `${I}/billing.png`, category: "hidden", defaultSize: { w: 320, h: 460 }, body: { kind: "node", nodeName: "os-app-calculator" } },
  { id: "terminal", label: "Terminal", icon: `${I}/code.png`, category: "hidden", defaultSize: { w: 680, h: 420 }, body: { kind: "node", nodeName: "os-app-terminal" } },
  { id: "clock", label: "Clock", icon: `${I}/calendar.png`, category: "hidden", singleton: true, defaultSize: { w: 480, h: 280 }, body: { kind: "node", nodeName: "os-app-clock" } },
  { id: "files", label: "Files", icon: `${I}/files.png`, category: "hidden", defaultSize: { w: 640, h: 460 }, body: { kind: "node", nodeName: "os-app-files" } },
  { id: "memelli-bar-settings", label: "Bar Settings", icon: `${I}/workflow-builder.png`, category: "hidden", singleton: true, defaultSize: { w: 520, h: 640 }, body: { kind: "node", nodeName: "os-app-mellibarsettings" } },
  { id: "signup", label: "Sign Up", icon: `${I}/sign-up.png`, category: "hidden", singleton: true, defaultSize: { w: 760, h: 640 }, body: { kind: "node", nodeName: "os-app-signup" } },
  { id: "client-workspace", label: "CRM Workspace", icon: `${I}/relationships.png`, category: "hidden", defaultSize: { w: 980, h: 660 }, body: { kind: "node", nodeName: "os-app-clientworkspace" } },
];

export const CATEGORIES: { id: "business" | "communications" | "productivity" | "system"; label: string }[] = [
  { id: "business", label: "Business" },
  { id: "communications", label: "Communications" },
  { id: "productivity", label: "Productivity & Media" },
  { id: "system", label: "System" },
];
