export interface ProductNavItem {
  label: string;
  href: string;
  icon: string;
  comingSoon?: boolean;
}

export interface Product {
  name: string;
  slug: string;
  icon: string; // lucide icon name
  accentColor: string; // HSL string from tokens
  description: string;
  entitlementKey: string;
  navItems: ProductNavItem[];
}

function nav(
  slug: string,
  items: [label: string, icon: string, comingSoon?: boolean][],
): Product["navItems"] {
  // "master" items live directly under /dashboard (e.g. /dashboard/ai-company)
  // All other products nest under /dashboard/{slug} (e.g. /dashboard/commerce/stores)
  const isMaster = slug === "master";
  return items.map(([label, icon, comingSoon]) => ({
    label,
    href:
      label === "Dashboard"
        ? isMaster
          ? "/dashboard"
          : `/dashboard/${slug}`
        : isMaster
          ? `/dashboard/${label.toLowerCase().replace(/\s+/g, "-")}`
          : `/dashboard/${slug}/${label.toLowerCase().replace(/\s+/g, "-")}`,
    icon,
    ...(comingSoon ? { comingSoon: true } : {}),
  }));
}

export const products: Record<string, Product> = {
  master: {
    name: "Memelli",
    slug: "master",
    icon: "LayoutDashboard",
    accentColor: "271 81% 56%",
    entitlementKey: "master",
    description: "AI Business Operating System",
    navItems: nav("master", [
      ["Dashboard", "LayoutDashboard"],
      ["Workflow", "Workflow"],
      ["AI Company", "Bot", true],
      ["AI Assistant", "Sparkles"],
      ["Doctrines", "BookOpen", true],
      ["Cockpit", "Gauge"],
      ["System Manager", "Server"],
      ["Contacts", "Users"],
      ["Tasks", "CheckSquare", true],
      ["Activities", "Activity", true],
      ["Conversations", "MessagesSquare", true],
      ["Notifications", "Bell", true],
      ["Analytics", "BarChart3", true],
      ["Brand Engine", "Palette", true],
      ["Organizations", "Building2", true],
      ["Portal", "DoorOpen", true],
      ["Onboarding", "Rocket", true],
      ["Settings", "Settings"],
    ]),
  },

  commerce: {
    name: "Commerce",
    slug: "commerce",
    icon: "ShoppingBag",
    accentColor: "160 84% 39%",
    entitlementKey: "commerce",
    description: "AI Commerce Operator",
    navItems: nav("commerce", [
      ["Dashboard", "LayoutDashboard"],
      ["Stores", "Store"],
      ["Products", "Package"],
      ["Orders", "ClipboardList"],
      ["Payments", "CreditCard"],
      ["Affiliates", "UserPlus", true],
      ["Analytics", "BarChart3", true],
    ]),
  },

  crm: {
    name: "CRM",
    slug: "crm",
    icon: "Users",
    accentColor: "220 70% 50%",
    entitlementKey: "crm",
    description: "AI Relationship Manager",
    navItems: nav("crm", [
      ["Dashboard", "LayoutDashboard"],
      ["Pipeline", "GitBranch"],
      ["Deals", "Handshake"],
      ["Contacts", "Contact"],
      ["Segments", "Filter", true],
      ["Analytics", "BarChart3", true],
    ]),
  },

  coaching: {
    name: "Coaching",
    slug: "coaching",
    icon: "GraduationCap",
    accentColor: "38 92% 50%",
    entitlementKey: "coaching",
    description: "AI Coaching Platform",
    navItems: nav("coaching", [
      ["Dashboard", "LayoutDashboard"],
      ["Programs", "BookOpen"],
      ["Lessons", "FileText", true],
      ["Enrollments", "UserPlus"],
      ["Certificates", "Award", true],
      ["Analytics", "BarChart3", true],
    ]),
  },

  seo: {
    name: "Forum SEO",
    slug: "seo",
    icon: "Search",
    accentColor: "175 80% 40%",
    entitlementKey: "seo_forum",
    description: "AI Forum Traffic Engine",
    navItems: nav("seo", [
      ["Dashboard", "LayoutDashboard"],
      ["Questions", "HelpCircle"],
      ["Threads", "MessagesSquare"],
      ["Clusters", "Network"],
      ["Rankings", "TrendingUp", true],
      ["Indexing", "Search", true],
      ["Analytics", "BarChart3", true],
    ]),
  },

  leads: {
    name: "LeadPulse",
    slug: "leads",
    icon: "Target",
    accentColor: "350 80% 55%",
    entitlementKey: "leads",
    description: "AI Lead Hunter",
    navItems: nav("leads", [
      ["Dashboard", "LayoutDashboard"],
      ["Signals", "Radio", true],
      ["Pipeline", "GitBranch"],
      ["Outreach", "Send", true],
      ["Video", "Video", true],
      ["Analytics", "BarChart3", true],
    ]),
  },

  communications: {
    name: "Communications",
    slug: "communications",
    icon: "Phone",
    accentColor: "245 58% 51%",
    entitlementKey: "communications",
    description: "AI Phone/SMS/Chat",
    navItems: nav("communications", [
      ["Dashboard", "LayoutDashboard"],
      ["Calls", "PhoneCall"],
      ["SMS", "Smartphone"],
      ["Email", "Mail"],
      ["Chat", "MessageCircle"],
      ["Call Scripts", "ScrollText", true],
      ["IVR Builder", "Workflow", true],
      ["Messaging Center", "Inbox", true],
      ["Tickets", "Ticket", true],
      ["Analytics", "BarChart3", true],
    ]),
  },

  credit: {
    name: "Credit",
    slug: "credit",
    icon: "CreditCard",
    accentColor: "25 95% 53%",
    entitlementKey: "credit",
    description: "Credit Engine",
    navItems: nav("credit", [
      ["Dashboard", "LayoutDashboard"],
      ["Reports", "FileBarChart"],
      ["Documents", "FolderOpen"],
      ["Disputes", "Gavel", true],
      ["Funding Application", "Landmark", true],
      ["Intake", "ClipboardCheck", true],
      ["Decisions", "Scale", true],
    ]),
  },

  approval: {
    name: "Approval",
    slug: "approval",
    icon: "CheckCircle",
    accentColor: "142 71% 45%",
    entitlementKey: "approval",
    description: "Soft Pull Approvals",
    navItems: nav("approval", [
      ["Dashboard", "LayoutDashboard"],
      ["Pulls", "Download"],
      ["Approvals", "CheckSquare"],
      ["Sharing", "Share2", true],
    ]),
  },

  partners: {
    name: "Partners",
    slug: "partners",
    icon: "Handshake",
    accentColor: "280 70% 50%",
    entitlementKey: "partners",
    description: "Partner & Affiliate Management",
    navItems: nav("partners", [
      ["Dashboard", "Handshake"],
      ["Packages", "Package"],
      ["Commissions", "CreditCard", true],
      ["Payouts", "BarChart3", true],
      ["Analytics", "TrendingUp", true],
    ]),
  },

  websiteBuilder: {
    name: "Website Builder",
    slug: "website-builder",
    icon: "Globe",
    accentColor: "190 80% 45%",
    entitlementKey: "website_builder",
    description: "AI Site Generator",
    navItems: nav("website-builder", [
      ["Dashboard", "LayoutDashboard"],
      ["Sites", "Globe"],
      ["Pages", "FileText"],
      ["Themes", "Palette"],
      ["Forum", "MessagesSquare"],
      ["Analytics", "BarChart3"],
    ]),
  },

  content: {
    name: "Content",
    slug: "content",
    icon: "FileEdit",
    accentColor: "330 70% 50%",
    entitlementKey: "content",
    description: "AI Content & Media Engine",
    navItems: nav("content", [
      ["Dashboard", "FileEdit"],
      ["Media Studio", "Film", true],
      ["Voice Profiles", "Mic"],
      ["Video Templates", "Clapperboard", true],
      ["Music Library", "Music", true],
      ["UGC Studio", "Camera", true],
      ["Social Manager", "Share2", true],
      ["QR Generator", "QrCode"],
      ["Form Builder", "FileText"],
      ["Reviews", "Star", true],
      ["Knowledge Base", "BookOpen"],
    ]),
  },

  insights: {
    name: "Insights",
    slug: "insights",
    icon: "BarChart3",
    accentColor: "271 81% 56%",
    entitlementKey: "master",
    description: "Reports, Views & Comparisons",
    navItems: nav("insights", [
      ["Reports", "FileBarChart"],
      ["Views", "Eye", true],
      ["Compare", "GitCompare", true],
    ]),
  },

  admin: {
    name: "Admin",
    slug: "admin",
    icon: "Shield",
    accentColor: "0 72% 51%",
    entitlementKey: "master",
    description: "Admin Control & Dev Tools",
    navItems: [
      { label: "Admin Control", href: "/dashboard/admin", icon: "Shield" },
      { label: "Dev Console", href: "/dashboard/admin/dev", icon: "Terminal" },
      { label: "Live Monitor", href: "/dashboard/admin/live", icon: "Radio" },
      { label: "Lanes", href: "/dashboard/admin/lanes", icon: "Rows3" },
      { label: "Speed Lanes", href: "/dashboard/speed-lanes", icon: "Zap" },
      { label: "Live Deploy", href: "/dashboard/live-deploy", icon: "Rocket" },
      { label: "Dev Terminal", href: "/dashboard/dev-terminal", icon: "Terminal" },
      { label: "Mobile Command", href: "/dashboard/mobile-command", icon: "Smartphone" },
    ],
  },

  tools: {
    name: "Tools",
    slug: "tools",
    icon: "Wrench",
    accentColor: "200 70% 50%",
    entitlementKey: "master",
    description: "Documents, Library & Utilities",
    navItems: nav("master", [
      ["Documents", "FileText"],
      ["Library", "BookOpen", true],
      ["Upload", "Upload"],
      ["Workflows", "Workflow"],
      ["Help", "HelpCircle", true],
      ["AI", "Brain"],
      ["Activity", "Clock", true],
    ]),
  },

  iptv: {
    name: "IPTV",
    slug: "iptv",
    icon: "Tv2",
    accentColor: "262 80% 50%",
    entitlementKey: "iptv",
    description: "Live TV & Streaming",
    navItems: nav("iptv", [
      ["Dashboard", "LayoutDashboard"],
      ["Channels", "Tv2"],
      ["Guide", "Calendar"],
      ["Recordings", "Video"],
      ["Favorites", "Heart"],
      ["Settings", "Settings"],
    ]),
  },
};

/** Look up a product by its slug (e.g. "credit", "website-builder"). */
export function getProductBySlug(slug: string): Product | undefined {
  return Object.values(products).find((p) => p.slug === slug);
}

/** Return only products the tenant is entitled to. */
export function getProductsByEntitlements(enabledKeys: string[]): Product[] {
  const keySet = new Set(enabledKeys);
  return Object.values(products).filter((p) => keySet.has(p.entitlementKey));
}
