import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

export type BadgeVariant = 'default' | 'success' | 'destructive' | 'warning' | 'muted' | 'primary' | 'primary' | 'error' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted text-foreground border border-border',
  primary: 'bg-accent text-primary border border-primary/30',
  success: 'bg-green-950 text-green-400 border border-green-800',
  destructive: 'bg-red-950 text-red-400 border border-red-800',
  warning: 'bg-yellow-950 text-yellow-400 border border-yellow-800',
  muted: 'bg-muted text-muted-foreground border border-border',
  error: 'bg-red-950 text-red-400 border border-red-800',
  info: 'bg-sky-950 text-sky-400 border border-sky-800',
};

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
