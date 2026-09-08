import { ReactNode, useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  label?: string;
}

export const Tooltip = ({ content, children }: TooltipProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      {children}
      <span
        className="inline-flex items-center ml-1 cursor-pointer"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        role="tooltip"
        aria-label={content}
        tabIndex={0}
      >
        <Info className="w-4 h-4 text-primary-600" />
      </span>
      {visible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 border border-outline-variant bg-surface-container-lowest p-3 text-on-surface text-xs rounded-md shadow-lg">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-surface-container-lowest border-b border-r border-outline-variant rotate-45" />
          </div>
        </div>
      )}
    </span>
  );
}