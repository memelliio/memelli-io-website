"use client";

import { useWorkspaceStore } from "@/stores/workspace-store";
import { Layout, Users, Briefcase, ListTodo } from "lucide-react";

const quickActions = [
  {
    label: "Open Pipeline",
    icon: Briefcase,
    tab: {
      type: "pipeline" as const,
      title: "Pipeline",
      icon: "git-branch",
      route: "/dashboard/crm/deals",
    },
  },
  {
    label: "Open Contacts",
    icon: Users,
    tab: {
      type: "contacts" as const,
      title: "Contacts",
      icon: "users",
      route: "/dashboard/crm/contacts",
    },
  },
  {
    label: "Open Tasks",
    icon: ListTodo,
    tab: {
      type: "task_board" as const,
      title: "Tasks",
      icon: "check-square",
      route: "/dashboard/activities",
    },
  },
];

export function TabContent() {
  const getActiveTab = useWorkspaceStore((s) => s.getActiveTab);
  const openTab = useWorkspaceStore((s) => s.openTab);
  const activeTab = getActiveTab();

  if (!activeTab) {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden">
        {/* Subtle radial gradient background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(59,130,246,0.04) 0%, rgba(24,24,27,0) 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          {/* Icon container with pulse ring */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            {/* Animated pulse ring */}
            <span
              className="absolute inset-0 rounded-2xl border border-zinc-700/30"
              style={{
                animation: "uniscreen-ring-pulse 3s ease-in-out infinite",
              }}
            />
            <span
              className="absolute inset-[-4px] rounded-2xl border border-zinc-700/15"
              style={{
                animation:
                  "uniscreen-ring-pulse 3s ease-in-out 0.5s infinite",
              }}
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
              <Layout className="h-8 w-8 text-zinc-500" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-zinc-300">
              No tabs open
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Open a tab to get started
            </p>
          </div>

          <div className="flex gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => openTab(action.tab)}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white hover:bg-zinc-800/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all duration-200 ease-out"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pulse ring keyframes */}
        <style jsx global>{`
          @keyframes uniscreen-ring-pulse {
            0%,
            100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.06);
            }
          }
        `}</style>
      </div>
    );
  }

  // Route-based tabs render through children passed to UniScreen.
  // Entity-specific tabs (client_profile, deal, etc.) can be extended here
  // to render inline content without navigation.
  return null;
}
