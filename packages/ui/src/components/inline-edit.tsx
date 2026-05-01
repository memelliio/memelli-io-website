"use client";

import * as React from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { cn } from "../lib/cn";

export interface InlineEditProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  type?: "text" | "select" | "date";
  options?: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export function InlineEdit({
  value,
  onSave,
  type = "text",
  options = [],
  placeholder = "Click to edit...",
  className,
}: InlineEditProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | HTMLSelectElement>(null);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const save = async () => {
    if (saving) return;
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      // Stay in edit mode on error
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't save on blur if clicking the save/cancel buttons
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest("[data-inline-edit-actions]")) return;
    save();
  };

  const displayValue = React.useMemo(() => {
    if (type === "select") {
      const match = options.find((o) => o.value === value);
      return match?.label ?? value;
    }
    return value;
  }, [type, value, options]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100",
          "hover:bg-white/[0.04] transition-all duration-200",
          className,
        )}
      >
        <span className={cn(!value && "text-zinc-500")}>
          {displayValue || placeholder}
        </span>
        <Pencil className="h-3 w-3 text-zinc-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </button>
    );
  }

  const sharedInputClass =
    "h-8 rounded-xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur-xl px-2.5 text-sm text-zinc-100 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 transition-all duration-200";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {type === "select" ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={saving}
          className={cn(sharedInputClass, "min-w-[120px]")}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type === "date" ? "date" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={saving}
          placeholder={placeholder}
          className={cn(sharedInputClass, "min-w-[140px]")}
        />
      )}
      <div data-inline-edit-actions className="flex items-center gap-0.5">
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
        ) : (
          <>
            <button
              type="button"
              onClick={save}
              className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10 focus:outline-none transition-all duration-200"
              aria-label="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.04] focus:outline-none transition-all duration-200"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
