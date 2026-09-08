import { Sparkles } from 'lucide-react';

interface AutoFilledBadgeProps {
  isDirty: boolean;
  wasAutoFilled: boolean;
}

export function AutoFilledBadge({ isDirty, wasAutoFilled }: AutoFilledBadgeProps) {
  if (!wasAutoFilled || isDirty) return null;

  return (
    <span
      className="inline-flex items-center gap-1 ml-2 border border-primary-600/20 bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-600"
      title="Auto-filled from your saved details"
    >
      <Sparkles className="w-3 h-3" />
      auto-filled
    </span>
  );
}