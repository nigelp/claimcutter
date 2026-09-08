import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '../store';
import { checkEligibility, getDisputeTypeLabel } from '../utils/eligibilityChecker';
import { WizardStep } from '../components/WizardStep';
import { AlertCircle, CheckCircle, XCircle, ArrowRight, Info, ExternalLink } from 'lucide-react';

const jurisdictionSchema = z.object({
  jurisdiction: z.enum(['england_wales', 'scotland', 'northern_ireland'], {
    required_error: 'Please select your jurisdiction',
  }),
  isClaimantOver18: z.boolean().refine(val => val === true, 'You must be over 18'),
  isDefendantOver18: z.boolean(),
  isDefendantInEnglandWales: z.boolean().refine(val => val === true, 'Defendant must reside in England & Wales'),
});

const claimTypeSchema = z.object({
  claimType: z.string().min(1, 'Please select a claim type'),
});

const amountSchema = z.object({
  claimAmount: z.coerce.number().min(0.01, 'Claim amount must be greater than 0'),
});

const claimQualifiersSchema = z.object({
  isPersonalInjury: z.boolean(),
  personalInjuryAmount: z.coerce.number().optional(),
  isRoadTrafficAccident: z.boolean(),
  isHousingDisrepair: z.boolean(),
  housingDisrepairAmount: z.coerce.number().optional(),
});

const timeLimitsSchema = z.object({
  breachDate: z.string().optional(),
});

type JurisdictionForm = z.infer<typeof jurisdictionSchema>;
type ClaimTypeForm = z.infer<typeof claimTypeSchema>;
type AmountForm = z.infer<typeof amountSchema>;
type ClaimQualifiersForm = z.infer<typeof claimQualifiersSchema>;
type TimeLimitsForm = z.infer<typeof timeLimitsSchema>;

const DISPUTE_TYPES = [
  { value: 'unpaid_invoice', label: 'Unpaid Invoice' },
  { value: 'defective_product', label: 'Defective Product' },
  { value: 'service_not_provided', label: 'Service Not Provided' },
  { value: 'tenancy_deposit', label: 'Tenancy Deposit Dispute' },
  { value: 'contract_breach', label: 'Contract Breach' },
  { value: 'faulty_goods', label: 'Faulty Goods' },
  { value: 'other', label: 'Other' },
];

export const EligibilityPage = () => {
  const navigate = useNavigate();
  const { eligibilityAnswers, setEligibilityAnswers } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [result, setResult] = useState<ReturnType<typeof checkEligibility> | null>(null);
  const totalSteps = 5;

  const jurisdictionForm = useForm<JurisdictionForm>({
    resolver: zodResolver(jurisdictionSchema),
    defaultValues: {
      jurisdiction: eligibilityAnswers.jurisdiction || undefined,
      isClaimantOver18: eligibilityAnswers.isClaimantOver18 || false,
      isDefendantOver18: eligibilityAnswers.isDefendantOver18 || false,
      isDefendantInEnglandWales: eligibilityAnswers.isDefendantInEnglandWales || false,
    },
  });
    const jurisdictionValue = jurisdictionForm.watch('jurisdiction');
  
  
  const claimTypeForm = useForm<ClaimTypeForm>({
    resolver: zodResolver(claimTypeSchema),
    defaultValues: { claimType: eligibilityAnswers.claimType || '' },
  });

  const amountForm = useForm<AmountForm>({
    resolver: zodResolver(amountSchema),
    defaultValues: { claimAmount: eligibilityAnswers.claimAmount || undefined },
  });

  const claimQualifiersForm = useForm<ClaimQualifiersForm>({
    resolver: zodResolver(claimQualifiersSchema),
    defaultValues: {
      isPersonalInjury: eligibilityAnswers.isPersonalInjury || false,
      personalInjuryAmount: eligibilityAnswers.personalInjuryAmount || undefined,
      isRoadTrafficAccident: eligibilityAnswers.isRoadTrafficAccident || false,
      isHousingDisrepair: eligibilityAnswers.isHousingDisrepair || false,
      housingDisrepairAmount: eligibilityAnswers.housingDisrepairAmount || undefined,
    },
  });

  const timeLimitsForm = useForm<TimeLimitsForm>({
    resolver: zodResolver(timeLimitsSchema),
    defaultValues: {
      breachDate: eligibilityAnswers.breachDate || '',
    },
  });

  const handleJurisdictionNext = useCallback(
    (data: JurisdictionForm) => {
      setEligibilityAnswers({
        jurisdiction: data.jurisdiction,
        isClaimantOver18: data.isClaimantOver18,
        isDefendantOver18: data.isDefendantOver18,
        isDefendantInEnglandWales: data.isDefendantInEnglandWales,
      });
      setCurrentStep(2);
    },
    [setEligibilityAnswers]
  );

  const handleClaimTypeNext = useCallback(
    (data: ClaimTypeForm) => {
      setEligibilityAnswers({ claimType: data.claimType });
      setCurrentStep(3);
    },
    [setEligibilityAnswers]
  );

  const handleAmountNext = useCallback(
    (data: AmountForm) => {
      setEligibilityAnswers({ claimAmount: data.claimAmount });
      setCurrentStep(4);
    },
    [setEligibilityAnswers]
  );

  const handleClaimQualifiersNext = useCallback(
    (data: ClaimQualifiersForm) => {
      setEligibilityAnswers({
        isPersonalInjury: data.isPersonalInjury,
        personalInjuryAmount: data.personalInjuryAmount,
        isRoadTrafficAccident: data.isRoadTrafficAccident,
        isHousingDisrepair: data.isHousingDisrepair,
        housingDisrepairAmount: data.housingDisrepairAmount,
      });
      setCurrentStep(5);
    },
    [setEligibilityAnswers]
  );

  const handleTimeLimitsNext = useCallback(
    (data: TimeLimitsForm) => {
      setEligibilityAnswers({
        breachDate: data.breachDate,
      });

      const answers = {
        ...eligibilityAnswers,
        breachDate: data.breachDate,
      };
      const eligibilityResult = checkEligibility(answers);
      setResult(eligibilityResult);
    },
    [setEligibilityAnswers, eligibilityAnswers]
  );

  const handleStartPreClaim = useCallback(() => {
    navigate('/pre-claim');
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const renderJurisdictionStep = () => (
    <WizardStep
      title="Jurisdiction"
      description="Where are you based? Small claims track applies to England and Wales."
      step={1}
      totalSteps={totalSteps}
      onNext={jurisdictionForm.handleSubmit(handleJurisdictionNext)}
      isValid={jurisdictionForm.formState.isValid}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select your jurisdiction
          </label>
          <select
            {...jurisdictionForm.register('jurisdiction')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select --</option>
            <option value="england_wales">England & Wales</option>
            <option value="scotland">Scotland</option>
            <option value="northern_ireland">Northern Ireland</option>
          </select>
          {jurisdictionForm.formState.errors.jurisdiction && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {jurisdictionForm.formState.errors.jurisdiction.message}
            </p>
          )}
        </div>
        {jurisdictionValue === 'scotland' && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <a
              href="https://www.scotcourts.gov.uk/taking-action/simple-procedure/guide-to-simple-procedure/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 underline"
            >
              <ExternalLink className="w-4 h-4" />
              Guidance on Simple Procedure in Scotland
            </a>
          </div>
        )}
        {jurisdictionValue === 'northern_ireland' && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-2">
            <a
              href="https://www.justice-ni.gov.uk/publications/small-claims-forms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 underline"
            >
              <ExternalLink className="w-4 h-4" />
              Small Claims Forms (Justice NI)
            </a>
            <a
              href="https://onlineservices.justice-ni.gov.uk/loginportal/Account/Login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 underline block"
            >
              <ExternalLink className="w-4 h-4" />
              Online Services Login (Justice NI)
            </a>
          </div>
        )}
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...jurisdictionForm.register('isClaimantOver18')}
                className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Are you over 18?</span>
            </label>
            {jurisdictionForm.formState.errors.isClaimantOver18 && (
              <p className="mt-1 ml-7 text-sm text-red-400">{jurisdictionForm.formState.errors.isClaimantOver18.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...jurisdictionForm.register('isDefendantOver18')}
                className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">
                Is the person you are claiming against over 18 as far as you know? <span className="text-gray-500">(N/A if a business)</span>
              </span>
            </label>
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...jurisdictionForm.register('isDefendantInEnglandWales')}
                className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Does the person or business reside in England & Wales?</span>
            </label>
            {jurisdictionForm.formState.errors.isDefendantInEnglandWales && (
              <p className="mt-1 ml-7 text-sm text-red-400">{jurisdictionForm.formState.errors.isDefendantInEnglandWales.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This tool is designed for the England & Wales small claims track. If you are in Scotland or Northern Ireland, we will direct you to the appropriate service.
          </p>
        </div>
      </div>
    </WizardStep>
  );

  const renderClaimTypeStep = () => (
    <WizardStep
      title="Claim Type"
      description="What type of claim are you making?"
      step={2}
      totalSteps={totalSteps}
      onNext={claimTypeForm.handleSubmit(handleClaimTypeNext)}
      onBack={handleBack}
      isValid={claimTypeForm.formState.isValid}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select your claim type
          </label>
          <select
            {...claimTypeForm.register('claimType')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select --</option>
            {DISPUTE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {claimTypeForm.formState.errors.claimType && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {claimTypeForm.formState.errors.claimType.message}
            </p>
          )}
        </div>
      </div>
    </WizardStep>
  );

  const renderAmountStep = () => (
    <WizardStep
      title="Claim Amount"
      description="How much are you claiming for?"
      step={3}
      totalSteps={totalSteps}
      onNext={amountForm.handleSubmit(handleAmountNext)}
      onBack={handleBack}
      isValid={amountForm.formState.isValid}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Claim amount (£)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...amountForm.register('claimAmount', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter amount"
          />
          {amountForm.formState.errors.claimAmount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {amountForm.formState.errors.claimAmount.message}
            </p>
          )}
        </div>
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            The small claims track is for claims up to £10,000. Claims over this amount may need to go through a different court track.
          </p>
        </div>
      </div>
    </WizardStep>
  );

  const renderClaimQualifiersStep = () => {
    const isPI = claimQualifiersForm.watch('isPersonalInjury');
    const isHD = claimQualifiersForm.watch('isHousingDisrepair');

    return (
    <WizardStep
      title="Claim Qualifiers"
      description="Select any that apply to your claim"
      step={4}
      totalSteps={totalSteps}
      onNext={claimQualifiersForm.handleSubmit(handleClaimQualifiersNext)}
      onBack={handleBack}
      isValid={true}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPersonalInjury"
            {...claimQualifiersForm.register('isPersonalInjury')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPersonalInjury" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Personal Injury
          </label>
        </div>

        {isPI && (
          <>
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal injury amount (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...claimQualifiersForm.register('personalInjuryAmount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex items-center gap-3 ml-7">
              <input
                type="checkbox"
                id="isRoadTrafficAccident"
                {...claimQualifiersForm.register('isRoadTrafficAccident')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isRoadTrafficAccident" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Road Traffic Accident
              </label>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                For road traffic accident claims the PI limit is £5,000. For other personal injury claims the limit is £1,000.
              </p>
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isHousingDisrepair"
            {...claimQualifiersForm.register('isHousingDisrepair')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isHousingDisrepair" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Housing Disrepair Claim
          </label>
        </div>

        {isHD && (
          <div className="ml-7">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated repair cost (£)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...claimQualifiersForm.register('housingDisrepairAmount', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount"
            />
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Select all claim types that apply. Multiple qualifiers can be combined. Defamation claims are not handled by this tool.
          </p>
        </div>
      </div>
    </WizardStep>
    );
  };

  const renderTimeLimitsStep = () => (
    <WizardStep
      title="Time Limits"
      description="When did the breach occur? Personal injury claims must be within 3 years, other claims within 6 years."
      step={5}
      totalSteps={totalSteps}
      onNext={timeLimitsForm.handleSubmit(handleTimeLimitsNext)}
      onBack={handleBack}
      nextLabel="Check Eligibility"
      isValid={true}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date of breach (optional)
          </label>
          <input
            type="date"
            {...timeLimitsForm.register('breachDate')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Personal injury claims must be made within 3 years. Most other claims must be made within 6 years of the breach.
          </p>
        </div>
      </div>
    </WizardStep>
  );

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {result.eligible ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  You appear to be eligible for small claims
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Based on your answers, your claim appears to qualify for the small claims track. You can now proceed with preparing your pre-claim documentation.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Your claim summary:</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li><strong>Jurisdiction:</strong> {eligibilityAnswers.jurisdiction === 'england_wales' ? 'England & Wales' : eligibilityAnswers.jurisdiction}</li>
                  <li><strong>Claim type:</strong> {getDisputeTypeLabel(eligibilityAnswers.claimType)}</li>
                  <li><strong>Claim amount:</strong> £{eligibilityAnswers.claimAmount?.toLocaleString()}</li>
                </ul>
              </div>
              <button
                onClick={handleStartPreClaim}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Pre-Claim Process
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Not eligible for small claims
                </h2>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 dark:text-red-300">
                  <strong>Reason:</strong> {result.reason}
                </p>
              </div>
              {result.alternative && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Alternative:</strong> {result.alternative}
                  </p>
                </div>
              )}
              <button
                onClick={() => navigate('/')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="page-folio">Chapter one · Initial assessment</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-on-surface mb-3">
            Check Your Eligibility
          </h1>
          <p className="text-on-surface-variant">
            Answer a few questions to see if your claim qualifies for the small claims track.
          </p>
        </div>

        {result ? renderResult() : (
          <>
            {currentStep === 1 && renderJurisdictionStep()}
            {currentStep === 2 && renderClaimTypeStep()}
            {currentStep === 3 && renderAmountStep()}
            {currentStep === 4 && renderClaimQualifiersStep()}
            {currentStep === 5 && renderTimeLimitsStep()}
          </>
        )}
      </div>
    </div>
  );
}