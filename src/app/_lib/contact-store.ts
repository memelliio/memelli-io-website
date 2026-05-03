"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ContactStage =
  | "new"
  | "qualified"
  | "prequal"
  | "credit-pulled"
  | "decision"
  | "funded"
  | "credit-repair"
  | "won"
  | "lost";

export type ContactRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  stage: ContactStage;
  score?: number;
  hot?: boolean;
};

// ModuleId is a free-form string so parent + sub modules share the type.
// Parent module: "tasks", "email", etc.
// Sub-module:    "tasks.overdue", "email.inbox", etc.  (parent + "." + sub)
export type ModuleId = string;

export type SubModule = { id: string; label: string };
export type ModuleDef = {
  id: string; // parent id e.g. "tasks"
  label: string;
  iconName: string; // lucide icon key resolved by consumer
  subs: SubModule[]; // [] = no sub-tabs (just the module itself)
};

// Canonical catalog of parent modules + their sub-modules.
// Consumers (BusinessCenter / ContactWorkspace) import this list.
export const MODULE_CATALOG: ModuleDef[] = [
  {
    id: "profile",
    label: "Profile",
    iconName: "User",
    subs: [
      { id: "overview", label: "Overview" },
      { id: "contact-info", label: "Contact Info" },
      { id: "company", label: "Company" },
      { id: "tags", label: "Tags & Segments" },
    ],
  },
  {
    id: "credit-score",
    label: "Credit Score",
    iconName: "Activity",
    subs: [
      { id: "current", label: "Current 3-Bureau" },
      { id: "history", label: "Score History" },
    ],
  },
  {
    id: "credit-report",
    label: "Credit Report",
    iconName: "FileText",
    subs: [
      { id: "personal", label: "Personal Info" },
      { id: "accounts", label: "Accounts" },
      { id: "negatives", label: "Negatives" },
      { id: "inquiries", label: "Inquiries" },
      { id: "public", label: "Public Records" },
    ],
  },
  {
    id: "prequal",
    label: "Pre-Qual",
    iconName: "Workflow",
    subs: [
      { id: "soft-pull", label: "Soft Pull" },
      { id: "decision", label: "Decision" },
      { id: "match", label: "Lender Match" },
    ],
  },
  {
    id: "decision",
    label: "Decision",
    iconName: "Briefcase",
    subs: [
      { id: "summary", label: "Summary" },
      { id: "recommendations", label: "Recommendations" },
      { id: "next-steps", label: "Next Steps" },
    ],
  },
  {
    id: "funding",
    label: "Funding",
    iconName: "PiggyBank",
    subs: [
      { id: "applications", label: "Applications" },
      { id: "approved", label: "Approved Offers" },
      { id: "funded", label: "Funded" },
      { id: "new", label: "Start New" },
    ],
  },
  {
    id: "credit-repair",
    label: "Credit Repair",
    iconName: "Wrench",
    subs: [
      { id: "round", label: "Active Round" },
      { id: "letters", label: "Letters" },
      { id: "history", label: "Round History" },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    iconName: "ListChecks",
    subs: [
      { id: "all", label: "All Tasks" },
      { id: "due", label: "Due Today" },
      { id: "overdue", label: "Overdue" },
      { id: "add", label: "Add Task" },
    ],
  },
  {
    id: "email",
    label: "Email",
    iconName: "Mail",
    subs: [
      { id: "inbox", label: "Inbox" },
      { id: "sent", label: "Sent" },
      { id: "compose", label: "Compose" },
      { id: "templates", label: "Templates" },
    ],
  },
  {
    id: "sms",
    label: "SMS",
    iconName: "MessageSquare",
    subs: [
      { id: "thread", label: "Thread" },
      { id: "compose", label: "Compose" },
      { id: "templates", label: "Templates" },
    ],
  },
  {
    id: "calls",
    label: "Calls",
    iconName: "Phone",
    subs: [
      { id: "history", label: "History" },
      { id: "schedule", label: "Schedule" },
      { id: "dialer", label: "Live Dialer" },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    iconName: "Activity",
    subs: [
      { id: "all", label: "All Activity" },
      { id: "today", label: "Today" },
      { id: "by-team", label: "By Team Member" },
    ],
  },
  {
    id: "files",
    label: "Files",
    iconName: "Folder",
    subs: [
      { id: "all", label: "All Files" },
      { id: "id", label: "Identity" },
      { id: "income", label: "Income & Bank" },
      { id: "upload", label: "Upload" },
    ],
  },
  {
    id: "notes",
    label: "Notes",
    iconName: "ListChecks",
    subs: [
      { id: "pinned", label: "Pinned" },
      { id: "all", label: "All Notes" },
      { id: "add", label: "Add Note" },
    ],
  },
  {
    id: "deals",
    label: "Deals",
    iconName: "Briefcase",
    subs: [
      { id: "open", label: "Open" },
      { id: "won", label: "Won" },
      { id: "lost", label: "Lost" },
      { id: "new", label: "New Deal" },
    ],
  },
];

export function parentOf(id: ModuleId): string {
  return id.includes(".") ? id.split(".")[0] : id;
}
export function subOf(id: ModuleId): string | null {
  return id.includes(".") ? id.split(".")[1] : null;
}
export function moduleLabel(id: ModuleId): string {
  const parent = MODULE_CATALOG.find((m) => m.id === parentOf(id));
  if (!parent) return id;
  const subId = subOf(id);
  if (!subId) return parent.label;
  const sub = parent.subs.find((s) => s.id === subId);
  return sub ? `${parent.label} · ${sub.label}` : parent.label;
}

// Default modules to auto-load per stage. Operator can edit later.
export const DEFAULT_MODULES_BY_STAGE: Record<ContactStage, ModuleId[]> = {
  new: ["profile", "tasks", "activity"],
  qualified: ["profile", "prequal", "tasks", "activity"],
  prequal: ["profile", "prequal", "credit-score", "tasks"],
  "credit-pulled": ["profile", "credit-report", "credit-score", "decision"],
  decision: ["profile", "decision", "funding", "credit-score"],
  funded: ["profile", "funding", "tasks", "activity"],
  "credit-repair": ["profile", "credit-repair", "credit-report", "tasks"],
  won: ["profile", "deals", "activity", "tasks"],
  lost: ["profile", "activity", "notes"],
};

// Demo seed contacts — replace with API fetch when wired.
export const DEMO_CONTACTS: ContactRecord[] = [
  { id: "c-001", firstName: "Maria", lastName: "Santos", email: "maria@santos.co", phone: "+15125550118", company: "Santos Auto Group", stage: "decision", score: 692, hot: true },
  { id: "c-002", firstName: "Brian", lastName: "Cole", email: "brian@colelog.com", phone: "+18325550142", company: "Cole Logistics", stage: "qualified", score: 678 },
  { id: "c-003", firstName: "Aisha", lastName: "Patel", email: "aisha@patelco.com", phone: "+17135550193", company: "Patel & Co Realty", stage: "prequal", score: 705, hot: true },
  { id: "c-004", firstName: "Diego", lastName: "Ramirez", email: "diego@ramirez.build", phone: "+14695550134", company: "Ramirez Construction", stage: "won", score: 740 },
  { id: "c-005", firstName: "Olivia", lastName: "Brooks", email: "olivia@brooks.bake", phone: "+19565550155", company: "Brooks Bakery", stage: "credit-repair", score: 562 },
  { id: "c-006", firstName: "Noah", lastName: "Reed", email: "noah@reedwell.co", phone: "+18325550177", company: "Reed Wellness", stage: "credit-pulled", score: 631 },
  { id: "c-007", firstName: "Yui", lastName: "Tanaka", email: "yui@tanaka.studio", phone: "+12035550199", company: "Tanaka Studio", stage: "funded", score: 712, hot: true },
  { id: "c-008", firstName: "Marcus", lastName: "Webb", email: "marcus@webbind.com", phone: "+12145550101", company: "Webb Industrial", stage: "qualified", score: 658 },
];

type Store = {
  activeContactId: string | null;
  /** Per-contact workspace module list (ordered, persists). */
  workspaces: Record<string, ModuleId[]>;
  setActive: (id: string | null) => void;
  /** Open a contact + auto-load default modules for their stage if first time. */
  openContact: (id: string, stage: ContactStage) => void;
  addModule: (contactId: string, moduleId: ModuleId) => void;
  removeModule: (contactId: string, moduleId: ModuleId) => void;
  reorderModule: (
    contactId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
};

export const useContactStore = create<Store>()(
  persist(
    (set, get) => ({
      activeContactId: null,
      workspaces: {},
      setActive: (id) => set({ activeContactId: id }),
      openContact: (id, stage) => {
        const existing = get().workspaces[id];
        if (existing && existing.length > 0) {
          set({ activeContactId: id });
          return;
        }
        const defaults = DEFAULT_MODULES_BY_STAGE[stage] ?? [
          "profile",
          "tasks",
          "activity",
        ];
        set((s) => ({
          activeContactId: id,
          workspaces: { ...s.workspaces, [id]: [...defaults] },
        }));
      },
      addModule: (contactId, moduleId) =>
        set((s) => {
          const list = s.workspaces[contactId] ?? [];
          if (list.includes(moduleId)) return s;
          return {
            workspaces: { ...s.workspaces, [contactId]: [...list, moduleId] },
          };
        }),
      removeModule: (contactId, moduleId) =>
        set((s) => ({
          workspaces: {
            ...s.workspaces,
            [contactId]: (s.workspaces[contactId] ?? []).filter(
              (m) => m !== moduleId,
            ),
          },
        })),
      reorderModule: (contactId, fromIndex, toIndex) =>
        set((s) => {
          const list = [...(s.workspaces[contactId] ?? [])];
          if (fromIndex < 0 || fromIndex >= list.length) return s;
          const [moved] = list.splice(fromIndex, 1);
          list.splice(Math.max(0, Math.min(list.length, toIndex)), 0, moved);
          return {
            workspaces: { ...s.workspaces, [contactId]: list },
          };
        }),
    }),
    {
      name: "memelli_contact_workspaces",
      partialize: (s) => ({
        activeContactId: s.activeContactId,
        workspaces: s.workspaces,
      }),
    },
  ),
);
