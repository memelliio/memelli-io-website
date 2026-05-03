import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, breadcrumb, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            {breadcrumb.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-zinc-700" aria-hidden="true" />}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-zinc-300 transition-all duration-200 rounded-md px-1 -mx-1 hover:bg-white/[0.04]"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className={i === breadcrumb.length - 1 ? "text-zinc-400" : ""}
                    aria-current={i === breadcrumb.length - 1 ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-zinc-500 leading-relaxed">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
