import { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface WizardStepProps {
  title: string;
  description?: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isValid?: boolean;
  children: ReactNode;
}

export const WizardStep = ({
  title,
  description,
  step,
  totalSteps,
  onNext,
  onBack,
  nextLabel = 'Next',
  backLabel = 'Back',
  isValid = true,
  children,
}: WizardStepProps) => {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{step}</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 ml-11">{description}</p>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">{children}</div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onNext}
            disabled={!isValid}
            className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {nextLabel}
            {step === totalSteps ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};