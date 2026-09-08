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
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[.12em] text-on-surface-variant mb-3">
          <span>Chapter {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-px bg-surface-container-high overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step card */}
      <div className="card p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 border border-primary-600 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-600">{String(step).padStart(2, '0')}</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">{title}</h2>
          </div>
          {description && (
            <p className="text-on-surface-variant ml-12 leading-7">{description}</p>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">{children}</div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3 pt-5 border-t border-outline-variant/50">
          {onBack ? (
            <button
              onClick={onBack}
              className="btn-secondary"
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
            className={`inline-flex min-h-11 items-center gap-2 rounded-md px-6 py-2 text-sm font-semibold transition-all ${
              isValid
                ? 'bg-primary-600 text-white hover:bg-primary-700'
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