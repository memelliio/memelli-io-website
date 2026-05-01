import * as React from "react";
import { cn } from "../lib/cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-red-700",
    "bg-indigo-700",
    "bg-sky-700",
    "bg-emerald-700",
    "bg-amber-700",
    "bg-rose-700",
    "bg-teal-700",
    "bg-violet-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const showFallback = !src || imgError;
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        sizeStyles[size],
        showFallback && bgColor,
        className,
      )}
      title={name}
      aria-label={name}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-semibold text-white select-none">{initials}</span>
      )}
    </span>
  );
}
