import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { claimantSchema, defendantSchema } from '../schemas';
import { UserProfile } from '../types';
import { AutoFilledBadge } from '../components/AutoFilledBadge';
import { calculateInterest, formatInterestAmount } from '../utils/interestCalculator';
import { calculateCourtFee } from '../utils/feeCalculator';

const STEPS = [
  { id: 1, title: 'Claimant Details', description: 'Your information' },
  { id: 2, title: 'Defendant Details', description: 'Who you are claiming against' },
  { id: 3, title: 'Claim Amount', description: 'How much you are claiming' },
  { id: 4, title: 'Interest', description: 'Calculate interest owed' },
  { id: 5, title: 'Particulars of Claim', description: 'What happened' },
  { id: 6, title: 'Review & Submit', description: 'Check everything' },
];

type ClaimantFormData = z.infer<typeof claimantSchema>;
type DefendantFormData = z.infer<typeof defendantSchema>;

function emptyClaimantDefaults(): ClaimantFormData {
  return {
    fullName: '',
    address: { line1: '', city: '', postcode: '', country: 'England' },
    phone: '',
    email: '',
  };
}

function emptyDefendantDefaults(): DefendantFormData {
  return {
    type: 'individual' as const,
    fullName: '',
    companyName: '',
    address: { line1: '', city: '', postcode: '', country: 'England' },
    email: '',
  };
}

function claimantToUserProfile(data: ClaimantFormData): UserProfile {
  return {
    fullName: data.fullName,
    address: data.address,
    phone: data.phone,
    email: data.email,
    lastUpdated: new Date().toISOString(),
  };
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {show && (
        <div className="absolute z-10 w-64 p-3 mt-2 text-sm text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg -left-24">
          {text}
        </div>
      )}
    </div>
  );
}

export default function ClaimBuilderPage() {
  const navigate = useNavigate();
  const { currentClaimId, claims, saveCurrentClaim, createNewClaim, userProfile, updateUserProfile } = useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [claimAmount, setClaimAmount] = useState('');
  const [interestEnabled, setInterestEnabled] = useState(false);
  const [interestRate, setInterestRate] = useState(8);
  const [interestStartDate, setInterestStartDate] = useState('');
  const [interestEndDate, setInterestEndDate] = useState('');
  const [interestAmount, setInterestAmount] = useState(0);
  const [particulars, setParticulars] = useState('');
  const [statementOfTruth, setStatementOfTruth] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const claimantForm = useForm<ClaimantFormData>({
    resolver: zodResolver(claimantSchema),
    defaultValues: emptyClaimantDefaults(),
  });

  const defendantForm = useForm<DefendantFormData>({
    resolver: zodResolver(defendantSchema),
    defaultValues: emptyDefendantDefaults(),
  });

  const { dirtyFields: claimantDirty } = claimantForm.formState;
  const { dirtyFields: defendantDirty } = defendantForm.formState;
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  const currentClaim = claims.find((c) => c.id === currentClaimId);

  useEffect(() => {
    if (currentClaim) {
      const hasClaimant = !!currentClaim.claimant.fullName;
      const hasDefendant = !!(currentClaim.defendant.fullName || currentClaim.defendant.companyName);

      claimantForm.reset({
        fullName: currentClaim.claimant.fullName,
        address: currentClaim.claimant.address,
        phone: currentClaim.claimant.phone,
        email: currentClaim.claimant.email,
      });
      defendantForm.reset({
        type: currentClaim.defendant.type,
        fullName: currentClaim.defendant.fullName,
        companyName: currentClaim.defendant.companyName || '',
        address: currentClaim.defendant.address,
        email: currentClaim.defendant.email || '',
      });
      setClaimAmount(currentClaim.claimAmount.toString());
      setInterestEnabled(currentClaim.interest.claimInterest);
      setInterestRate(currentClaim.interest.rate);
      setInterestStartDate(currentClaim.interest.startDate);
      setInterestEndDate(currentClaim.interest.endDate);
      setInterestAmount(currentClaim.interest.calculatedAmount);
      setParticulars(currentClaim.particularsOfClaim);

      const autoFilled = new Set<string>();
      if (!hasClaimant && userProfile) {
        claimantForm.reset({
          fullName: userProfile.fullName,
          address: userProfile.address,
          phone: userProfile.phone,
          email: userProfile.email,
        });
        ['fullName', 'address.line1', 'address.line2', 'address.city', 'address.county', 'address.postcode', 'phone', 'email'].forEach((f) => autoFilled.add(f));
      } else if (hasClaimant) {
        ['fullName', 'address.line1', 'address.line2', 'address.city', 'address.county', 'address.postcode', 'phone', 'email'].forEach((f) => autoFilled.add(`claimant.${f}`));
      }
      if (hasDefendant) {
        ['type', 'fullName', 'companyName', 'address.line1', 'address.line2', 'address.city', 'address.county', 'address.postcode', 'email'].forEach((f) => autoFilled.add(`defendant.${f}`));
      }
      setAutoFilledFields(autoFilled);
    } else if (!currentClaimId) {
      const newClaim = createNewClaim();
      saveCurrentClaim(newClaim);
      if (userProfile) {
        claimantForm.reset({
          fullName: userProfile.fullName,
          address: userProfile.address,
          phone: userProfile.phone,
          email: userProfile.email,
        });
        setAutoFilledFields(new Set(['fullName', 'address.line1', 'address.line2', 'address.city', 'address.county', 'address.postcode', 'phone', 'email']));
      }
    }
  }, [currentClaim?.id, userProfile]);

  const claimantValues = claimantForm.watch();
  const defendantValues = defendantForm.watch();

  const autoSave = useCallback(async () => {
    if (!currentClaimId) return;
    setIsSaving(true);
    const claimantData = claimantForm.getValues();
    const defendantData = defendantForm.getValues();
    const claim = {
      ...(currentClaim || createNewClaim()),
      claimant: claimantData,
      defendant: {
        ...defendantData,
        phone: defendantData.phone || '',
        email: defendantData.email || '',
      },
      claimAmount: parseFloat(claimAmount) || 0,
      interest: {
        claimInterest: interestEnabled,
        rate: interestRate,
        startDate: interestStartDate,
        endDate: interestEndDate,
        calculatedAmount: interestAmount,
      },
      particularsOfClaim: particulars,
      courtFee: calculateCourtFee(parseFloat(claimAmount) || 0, 'online'),
    };
    await saveCurrentClaim(claim);
    setIsSaving(false);
  }, [claimantForm, defendantForm, claimAmount, interestEnabled, interestRate, interestStartDate, interestEndDate, interestAmount, particulars, currentClaimId, currentClaim]);

  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 1000);
    return () => clearTimeout(timer);
  }, [claimantValues, defendantValues, claimAmount, interestEnabled, interestRate, interestStartDate, interestEndDate, interestAmount, particulars, autoSave]);

  useEffect(() => {
    if (interestEnabled && interestStartDate && interestEndDate && claimAmount) {
      const result = calculateInterest(parseFloat(claimAmount), interestStartDate, interestEndDate, interestRate);
      setInterestAmount(result.interestAmount);
    } else {
      setInterestAmount(0);
    }
  }, [interestEnabled, interestStartDate, interestEndDate, claimAmount, interestRate]);

  const persistClaimantToProfile = () => {
    const claimantData = claimantForm.getValues();
    if (claimantData.fullName || claimantData.phone || claimantData.email) {
      updateUserProfile(claimantToUserProfile(claimantData));
    }
  };

  const handlePopulateFromProfile = () => {
    if (!userProfile) return;
    const isDirty = Object.keys(claimantForm.formState.dirtyFields).length > 0;
    if (isDirty && !confirm('This will overwrite your current entries with your saved profile. Continue?')) {
      return;
    }
    claimantForm.reset({
      fullName: userProfile.fullName,
      address: userProfile.address,
      phone: userProfile.phone,
      email: userProfile.email,
    });
    setAutoFilledFields(new Set(['fullName', 'address.line1', 'address.line2', 'address.city', 'address.county', 'address.postcode', 'phone', 'email']));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: {
        const result = claimantSchema.safeParse(claimantForm.getValues());
        if (!result.success) {
          result.error.errors.forEach((err) => {
            const path = err.path.join('.');
            newErrors[path] = err.message;
          });
        }
        break;
      }
      case 2: {
        const result = defendantSchema.safeParse(defendantForm.getValues());
        if (!result.success) {
          result.error.errors.forEach((err) => {
            const path = err.path.join('.');
            newErrors[path] = err.message;
          });
        }
        break;
      }
      case 3: {
        const amount = parseFloat(claimAmount);
        if (!claimAmount || isNaN(amount) || amount <= 0) {
          newErrors.claimAmount = 'Please enter a valid claim amount greater than 0';
        }
        if (amount > 10000) {
          newErrors.claimAmount = 'Small claims track is for claims up to £10,000';
        }
        break;
      }
      case 4:
        if (interestEnabled) {
          if (!interestStartDate) newErrors.interestStart = 'Start date is required for interest calculation';
          if (!interestEndDate) newErrors.interestEnd = 'End date is required for interest calculation';
          if (interestStartDate && interestEndDate && new Date(interestStartDate) >= new Date(interestEndDate)) {
            newErrors.interestDates = 'End date must be after start date';
          }
        }
        break;
      case 5:
        if (!particulars.trim()) {
          newErrors.particulars = 'Particulars of claim are required';
        } else if (particulars.length < 50) {
          newErrors.particulars = `Please provide at least 50 characters (currently ${particulars.length})`;
        }
        break;
      case 6:
        if (!statementOfTruth) {
          newErrors.statementOfTruth = 'You must confirm the statement of truth to proceed';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        persistClaimantToProfile();
      }
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const totalClaim = (parseFloat(claimAmount) || 0) + interestAmount;
  const courtFee = calculateCourtFee(totalClaim, 'online');

  const isClaimantFieldDirty = (field: string): boolean => {
    if (field === 'fullName') return !!claimantDirty.fullName;
    if (field === 'phone') return !!claimantDirty.phone;
    if (field === 'email') return !!claimantDirty.email;
    if (field.startsWith('address.')) {
      const addrKey = field.split('.')[1] as keyof typeof claimantDirty.address;
      return !!(claimantDirty.address && claimantDirty.address[addrKey]);
    }
    return false;
  };

  const isDefendantFieldDirty = (field: string): boolean => {
    if (field === 'fullName') return !!defendantDirty.fullName;
    if (field === 'phone') return !!defendantDirty.phone;
    if (field === 'email') return !!defendantDirty.email;
    if (field.startsWith('address.')) {
      const addrKey = field.split('.')[1] as keyof typeof defendantDirty.address;
      return !!(defendantDirty.address && defendantDirty.address[addrKey]);
    }
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Claim Builder</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          We will guide you through creating your N1 claim form step by step.
        </p>
      </div>

      {isSaving && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Saving...
        </div>
      )}

      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {STEPS.map((step) => (
              <li key={step.id} className="flex flex-col items-center">
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                    step.id < currentStep
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : step.id === currentStep
                      ? 'border-primary-600 text-primary-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-400'
                  } ${step.id > currentStep ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {step.id < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </button>
                <span className="mt-2 text-xs text-center text-gray-600 dark:text-gray-400 max-w-20">
                  {step.title}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Claimant Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This is your information. The court needs to know who is making the claim and how to contact you.
            </p>

            {userProfile && (
              <button
                type="button"
                onClick={handlePopulateFromProfile}
                className="mb-6 px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Populate from Saved Profile
              </button>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                  <AutoFilledBadge isDirty={isClaimantFieldDirty('fullName')} wasAutoFilled={autoFilledFields.has('fullName')} />
                </label>
                <input
                  type="text"
                  {...claimantForm.register('fullName')}
                  className={`input-field ${errors.fullName ? 'input-error' : ''}`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 1
                  <AutoFilledBadge isDirty={isClaimantFieldDirty('address.line1')} wasAutoFilled={autoFilledFields.has('address.line1')} />
                </label>
                <input
                  type="text"
                  {...claimantForm.register('address.line1')}
                  className={`input-field ${errors['address.line1'] ? 'input-error' : ''}`}
                  placeholder="Enter your address"
                />
                {errors['address.line1'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['address.line1']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 2 (Optional)
                  <AutoFilledBadge isDirty={isClaimantFieldDirty('address.line2')} wasAutoFilled={autoFilledFields.has('address.line2')} />
                </label>
                <input
                  type="text"
                  {...claimantForm.register('address.line2')}
                  className="input-field"
                  placeholder="Enter address line 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                    <AutoFilledBadge isDirty={isClaimantFieldDirty('address.city')} wasAutoFilled={autoFilledFields.has('address.city')} />
                  </label>
                  <input
                    type="text"
                    {...claimantForm.register('address.city')}
                    className={`input-field ${errors['address.city'] ? 'input-error' : ''}`}
                    placeholder="City"
                  />
                  {errors['address.city'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postcode
                    <AutoFilledBadge isDirty={isClaimantFieldDirty('address.postcode')} wasAutoFilled={autoFilledFields.has('address.postcode')} />
                  </label>
                  <input
                    type="text"
                    {...claimantForm.register('address.postcode')}
                    className={`input-field ${errors['address.postcode'] ? 'input-error' : ''}`}
                    placeholder="Postcode"
                  />
                  {errors['address.postcode'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.postcode']}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  County (Optional)
                  <AutoFilledBadge isDirty={isClaimantFieldDirty('address.county')} wasAutoFilled={autoFilledFields.has('address.county')} />
                </label>
                <input
                  type="text"
                  {...claimantForm.register('address.county')}
                  className="input-field"
                  placeholder="County"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                  <AutoFilledBadge isDirty={isClaimantFieldDirty('phone')} wasAutoFilled={autoFilledFields.has('phone')} />
                </label>
                <input
                  type="tel"
                  {...claimantForm.register('phone')}
                  className={`input-field ${errors.phone ? 'input-error' : ''}`}
                  placeholder="Phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                  <AutoFilledBadge isDirty={isClaimantFieldDirty('email')} wasAutoFilled={autoFilledFields.has('email')} />
                </label>
                <input
                  type="email"
                  {...claimantForm.register('email')}
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Defendant Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Who are you claiming against? The court needs their correct details to serve the claim.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Defendant Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="defendantType"
                    checked={defendantForm.watch('type') === 'individual'}
                    onChange={() => defendantForm.setValue('type', 'individual')}
                    className="mr-2"
                  />
                  Individual
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="defendantType"
                    checked={defendantForm.watch('type') === 'company'}
                    onChange={() => defendantForm.setValue('type', 'company')}
                    className="mr-2"
                  />
                  Company
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {defendantForm.watch('type') === 'company' ? 'Company Name' : 'Full Name'}
                  <AutoFilledBadge isDirty={isDefendantFieldDirty('fullName')} wasAutoFilled={autoFilledFields.has('defendant.fullName')} />
                </label>
                <input
                  type="text"
                  {...defendantForm.register('fullName')}
                  className={`input-field ${errors['defendant.fullName'] ? 'input-error' : ''}`}
                  placeholder={defendantForm.watch('type') === 'company' ? 'Company name' : 'Person name'}
                />
                {errors['defendant.fullName'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['defendant.fullName']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 1
                  <AutoFilledBadge isDirty={isDefendantFieldDirty('address.line1')} wasAutoFilled={autoFilledFields.has('defendant.address.line1')} />
                </label>
                <input
                  type="text"
                  {...defendantForm.register('address.line1')}
                  className={`input-field ${errors['defendant.address.line1'] ? 'input-error' : ''}`}
                  placeholder="Enter defendant address"
                />
                {errors['defendant.address.line1'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['defendant.address.line1']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 2 (Optional)
                  <AutoFilledBadge isDirty={isDefendantFieldDirty('address.line2')} wasAutoFilled={autoFilledFields.has('defendant.address.line2')} />
                </label>
                <input
                  type="text"
                  {...defendantForm.register('address.line2')}
                  className="input-field"
                  placeholder="Enter address line 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                    <AutoFilledBadge isDirty={isDefendantFieldDirty('address.city')} wasAutoFilled={autoFilledFields.has('defendant.address.city')} />
                  </label>
                  <input
                    type="text"
                    {...defendantForm.register('address.city')}
                    className={`input-field ${errors['defendant.address.city'] ? 'input-error' : ''}`}
                    placeholder="City"
                  />
                  {errors['defendant.address.city'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['defendant.address.city']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postcode
                    <AutoFilledBadge isDirty={isDefendantFieldDirty('address.postcode')} wasAutoFilled={autoFilledFields.has('defendant.address.postcode')} />
                  </label>
                  <input
                    type="text"
                    {...defendantForm.register('address.postcode')}
                    className={`input-field ${errors['defendant.address.postcode'] ? 'input-error' : ''}`}
                    placeholder="Postcode"
                  />
                  {errors['defendant.address.postcode'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['defendant.address.postcode']}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  County (Optional)
                  <AutoFilledBadge isDirty={isDefendantFieldDirty('address.county')} wasAutoFilled={autoFilledFields.has('defendant.address.county')} />
                </label>
                <input
                  type="text"
                  {...defendantForm.register('address.county')}
                  className="input-field"
                  placeholder="County"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone (optional)
                  <AutoFilledBadge isDirty={isDefendantFieldDirty('phone')} wasAutoFilled={autoFilledFields.has('defendant.phone')} />
                </label>
                <input
                  type="tel"
                  {...defendantForm.register('phone')}
                  className="input-field"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (optional)
                  <AutoFilledBadge isDirty={isDefendantFieldDirty('email')} wasAutoFilled={autoFilledFields.has('defendant.email')} />
                </label>
                <input
                  type="email"
                  {...defendantForm.register('email')}
                  className="input-field"
                  placeholder="Email address"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Claim Amount
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              How much money are you claiming? This should be the amount you are owed, not including interest or court fees.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Claim Amount (£)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className={`input-field pl-8 ${errors.claimAmount ? 'input-error' : ''}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.claimAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.claimAmount}</p>
              )}
              {claimAmount && !errors.claimAmount && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Court fee: £{courtFee.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Interest Calculation
              <Tooltip text="You may be entitled to interest on the money owed to you. The statutory rate is 8% per year for most small claims." />
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If someone owes you money, you can claim interest from the date it was due until today.
            </p>

            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={interestEnabled}
                    onChange={(e) => setInterestEnabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`block w-14 h-8 rounded-full transition-colors duration-200 ${
                      interestEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${
                      interestEnabled ? 'translate-x-6' : ''
                    }`}
                  ></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Claim interest on this debt
                </span>
              </label>
            </div>

            {interestEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interest Rate (% per year)
                  </label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value) || 8)}
                    className="input-field"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={interestStartDate}
                      onChange={(e) => setInterestStartDate(e.target.value)}
                      className={`input-field ${errors.interestStart ? 'input-error' : ''}`}
                    />
                    {errors.interestStart && (
                      <p className="mt-1 text-sm text-red-600">{errors.interestStart}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={interestEndDate}
                      onChange={(e) => setInterestEndDate(e.target.value)}
                      className={`input-field ${errors.interestEnd ? 'input-error' : ''}`}
                    />
                    {errors.interestEnd && (
                      <p className="mt-1 text-sm text-red-600">{errors.interestEnd}</p>
                    )}
                  </div>
                </div>
                {errors.interestDates && (
                  <p className="text-sm text-red-600">{errors.interestDates}</p>
                )}

                {interestAmount > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Calculated interest: <strong>{formatInterestAmount(interestAmount)}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Particulars of Claim
              <Tooltip text="This is the core of your claim. Explain what happened, when it happened, and why the money is owed. Be clear and factual." />
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Describe what happened and why you are owed money. Be specific about dates, amounts, and what went wrong.
            </p>

            <div>
              <textarea
                value={particulars}
                onChange={(e) => setParticulars(e.target.value)}
                className={`input-field h-48 resize-y ${errors.particulars ? 'input-error' : ''}`}
                placeholder="Example: On 15th January 2024, I agreed to pay the defendant £500 for website design services. I paid the full amount on 16th January 2024. The defendant failed to deliver the website by the agreed deadline of 15th February 2024 and has not responded to my requests for a refund."
              />
              {errors.particulars && (
                <p className="mt-1 text-sm text-red-600">{errors.particulars}</p>
              )}
              <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Minimum 50 characters</span>
                <span>{particulars.length} characters</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Review & Preview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Check all your details are correct before submitting your claim.
            </p>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="mb-6 btn-secondary"
            >
              {showPreview ? 'Hide Preview' : 'Preview Claim Form'}
            </button>

            {showPreview && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Claim Summary</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Claimant:</span>
                    <p className="text-gray-900 dark:text-white">{claimantValues.fullName}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {claimantValues.address.line1}, {claimantValues.address.city}, {claimantValues.address.postcode}
                    </p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Defendant:</span>
                    <p className="text-gray-900 dark:text-white">{defendantValues.fullName}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {defendantValues.address.line1}, {defendantValues.address.city}, {defendantValues.address.postcode}
                    </p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Claim Amount:</span>
                    <p className="text-gray-900 dark:text-white">£{(parseFloat(claimAmount) || 0).toFixed(2)}</p>
                  </div>
                  {interestEnabled && interestAmount > 0 && (
                    <>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Interest:</span>
                        <p className="text-gray-900 dark:text-white">{formatInterestAmount(interestAmount)}</p>
                      </div>
                    </>
                  )}
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Court Fee:</span>
                    <p className="text-gray-900 dark:text-white">£{courtFee.toFixed(2)}</p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total:</span>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      £{(totalClaim + courtFee).toFixed(2)}
                    </p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Particulars of Claim:</span>
                    <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{particulars}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={statementOfTruth}
                  onChange={(e) => setStatementOfTruth(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statement of Truth
                    <Tooltip text="By confirming this, you declare that the facts stated in your claim are true. Making a false statement can have legal consequences." />
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    I believe that the facts stated in this claim are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.
                  </p>
                </div>
              </label>
              {errors.statementOfTruth && (
                <p className="mt-1 text-sm text-red-600">{errors.statementOfTruth}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="btn-secondary"
          >
            Back
          </button>
          {currentStep < STEPS.length ? (
            <button type="button" onClick={handleNext} className="btn-primary">
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (validateStep(currentStep)) {
                  persistClaimantToProfile();
                  navigate('/submission');
                }
              }}
              className="btn-primary"
            >
              Continue to Submission Guide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}