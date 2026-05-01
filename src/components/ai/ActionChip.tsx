'use client';

interface ActionChipProps {
  action: { type: string; label?: string; payload: Record<string, unknown> };
  onExecute: (action: { type: string; label?: string; payload: Record<string, unknown> }) => void;
}

export default function ActionChip({ action, onExecute }: ActionChipProps) {
  return (
    <button
      type="button"
      onClick={() => onExecute(action)}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-red-500/60 text-red-400 hover:bg-red-900/30 hover:border-red-400 hover:text-red-300 transition-colors"
    >
      {action.label || action.type}
    </button>
  );
}
