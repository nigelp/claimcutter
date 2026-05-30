import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
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
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
    titleColor: 'text-gray-900 dark:text-white',
    descColor: 'text-gray-600 dark:text-gray-400',
  },
};

export const InfoCard = ({ icon: Icon, title, description, variant = 'default' }: InfoCardProps) => {
  const styles = variantStyles[variant];

  return (
    <div className={`p-4 rounded-xl ${styles.bg} border border-transparent dark:border-gray-700/50`}>
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