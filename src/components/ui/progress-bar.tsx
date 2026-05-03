import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showLabel?: boolean;
  color?: 'primary' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses: Record<NonNullable<ProgressBarProps['color']>, string> = {
  primary: 'bg-red-500',
  green: 'bg-emerald-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

const trackColorClasses: Record<NonNullable<ProgressBarProps['color']>, string> = {
  primary: 'bg-red-500/20',
  green: 'bg-emerald-500/20',
  yellow: 'bg-yellow-500/20',
  red: 'bg-red-500/20',
};

const sizeClasses: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  label,
  showLabel = false,
  color = 'primary',
  size = 'md',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || showLabel) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-xs text-zinc-400">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium text-zinc-300">{clamped}%</span>
          )}
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full', trackColorClasses[color], sizeClasses[size])}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorClasses[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
