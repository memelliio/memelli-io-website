"use client";

import * as React from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
  RefreshCw,
  FileEdit,
  Zap,
  Send,
  Trash2,
  Search,
  Mail,
} from "lucide-react";
import { cn } from "../lib/cn";

export interface AiActionCardProps {
  actionType: string;
  entity?: string;
  status: "pending" | "executing" | "completed" | "failed";
  message: string;
  followUp?: string;
  onFollowUp?: () => void;
  className?: string;
}

const statusConfig: Record<
  AiActionCardProps["status"],
  { icon: React.ComponentType<{className?: string}>; color: string; borderColor: string; bgColor: string; label: string }
> = {
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-500/10",
    label: "Completed",
  },
  pending: {
    icon: Clock,
    color: "text-amber-400",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Pending",
  },
  executing: {
    icon: Zap,
    color: "text-red-400",
    borderColor: "border-l-red-500",
    bgColor: "bg-red-500/10",
    label: "Executing",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-400",
    borderColor: "border-l-red-500",
    bgColor: "bg-red-500/10",
    label: "Failed",
  },
};

const actionIcons: Record<string, React.ComponentType<{className?: string}>> = {
  create: UserPlus,
  update: FileEdit,
  sync: RefreshCw,
  automate: Zap,
  send: Send,
  delete: Trash2,
  search: Search,
  email: Mail,
};

export function AiActionCard({
  actionType,
  entity,
  status,
  message,
  followUp,
  onFollowUp,
  className,
}: AiActionCardProps) {
  const statusCfg = statusConfig[status];
  const StatusIcon = statusCfg.icon;
  const ActionIcon = actionIcons[actionType] ?? Bot;

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 border-l-4 bg-zinc-900 p-4 transition-shadow",
        statusCfg.borderColor,
        status === "executing" && "shadow-[0_0_16px_rgba(239,68,68,0.25)]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800">
            <ActionIcon className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium capitalize text-zinc-100">
              {actionType}
            </p>
            {entity && (
              <p className="text-xs text-zinc-400">{entity}</p>
            )}
          </div>
        </div>

        <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5", statusCfg.bgColor)}>
          <StatusIcon className={cn("h-3.5 w-3.5", statusCfg.color)} />
          <span className={cn("text-xs font-medium", statusCfg.color)}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Message */}
      <p className="mt-3 text-sm text-zinc-400">{message}</p>

      {/* Follow-up action */}
      {followUp && onFollowUp && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <button
            type="button"
            onClick={onFollowUp}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/50 hover:bg-zinc-700 hover:text-zinc-100"
          >
            {followUp}
          </button>
        </div>
      )}
    </div>
  );
}
