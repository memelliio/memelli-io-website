"use client";

import * as React from "react";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { cn } from "../lib/cn";
import { Modal } from "./modal";
import { Button } from "./button";

export type ConfirmDialogVariant = "danger" | "warning" | "default" | "destructive" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  /** @deprecated Use onCancel instead */
  onClose?: () => void;
  onCancel?: () => void;
  title: string;
  description?: string;
  /** @deprecated Use confirmLabel instead */
  confirmText?: string;
  confirmLabel?: string;
  /** @deprecated Use cancelLabel instead */
  cancelText?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
}

// Normalize variant aliases
function resolveVariant(v: ConfirmDialogVariant): "danger" | "warning" | "default" {
  if (v === "destructive") return "danger";
  if (v === "info") return "default";
  return v as "danger" | "warning" | "default";
}

const variantConfig: Record<
  "danger" | "warning" | "default",
  { icon: React.ReactNode; buttonVariant: "destructive" | "primary" }
> = {
  danger: {
    icon: <Trash2 className="h-5 w-5 text-red-400" />,
    buttonVariant: "destructive",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    buttonVariant: "destructive",
  },
  default: {
    icon: <Info className="h-5 w-5 text-sky-400" />,
    buttonVariant: "primary",
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const resolved = resolveVariant(variant);
  const config = variantConfig[resolved];
  const handleCancel = onCancel ?? onClose ?? (() => {});
  const confirmBtnText = confirmLabel ?? confirmText ?? (resolved === "danger" ? "Delete" : "Confirm");
  const cancelBtnText = cancelLabel ?? cancelText ?? "Cancel";

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && open && !loading) {
        e.preventDefault();
        onConfirm();
      }
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, loading, onConfirm]);

  return (
    <Modal isOpen={open} onClose={handleCancel} className="max-w-md">
      <div className="flex gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl backdrop-blur-sm border transition-all duration-200",
            resolved === "danger" && "bg-red-500/[0.08] border-red-500/20",
            resolved === "warning" && "bg-amber-500/[0.08] border-amber-500/20",
            resolved === "default" && "bg-sky-500/[0.08] border-sky-500/20",
          )}
        >
          {config.icon}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-zinc-100 tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
        >
          {cancelBtnText}
        </Button>
        <Button
          variant={config.buttonVariant}
          size="sm"
          onClick={onConfirm}
          isLoading={loading}
        >
          {confirmBtnText}
        </Button>
      </div>
    </Modal>
  );
}
