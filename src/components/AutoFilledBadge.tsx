import { Sparkles } from 'lucide-react';

interface AutoFilledBadgeProps {
  isDirty: boolean;
  wasAutoFilled: boolean;
}

export function AutoFilledBadge({ isDirty, wasAutoFilled }: AutoFilledBadgeProps) {
  if (!wasAutoFilled || isDirty) return null;

  return (
    <span
      className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded"
      title="Auto-filled from your saved details"
    >
      <Sparkles className="w-3 h-3" />
      auto-filled
    </span>
  );
}