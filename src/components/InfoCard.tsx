import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: {
    bg: 'bg-primary-50', iconBg: 'bg-primary-100', iconColor: 'text-primary-600',
    titleColor: 'text-gray-900 dark:text-white',
    descColor: 'text-gray-600 dark:text-gray-400',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-gray-900 dark:text-white',
    descColor: 'text-gray-600 dark:text-gray-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-gray-900 dark:text-white',
    descColor: 'text-gray-600 dark:text-gray-400',
  },
  info: {
    bg: 'bg-surface-container-low', iconBg: 'bg-surface-container', iconColor: 'text-primary-600',
    titleColor: 'text-gray-900 dark:text-white',
    descColor: 'text-gray-600 dark:text-gray-400',
  },
};

export const InfoCard = ({ icon: Icon, title, description, variant = 'default' }: InfoCardProps) => {
  const styles = variantStyles[variant];

  return (
    <div className={`p-5 rounded-md ${styles.bg} border border-outline-variant/40`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 ${styles.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
        <div>
          <h3 className={`font-semibold ${styles.titleColor} mb-1`}>{title}</h3>
          <p className={`text-sm ${styles.descColor}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}