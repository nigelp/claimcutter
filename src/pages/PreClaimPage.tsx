import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '../store';
import { claimantSchema, defendantSchema } from '../schemas';
import { UserProfile } from '../types';
import { AutoFilledBadge } from '../components/AutoFilledBadge';
import {
  ChevronRight,
  ChevronLeft,
  User,
  FileText,
  Send,
  Printer,
  Download,
  Copy,
  CheckSquare,
  Square,
  Calendar,
  AlertTriangle,
  Building2,
  PoundSterling,
  Eye,
  Upload,
  X,
  Image,
  File,
  Paperclip,
} from 'lucide-react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

const claimantResolver = zodResolver(claimantSchema);
const defendantResolver = zodResolver(defendantSchema);

type ClaimantFormData = z.infer<typeof claimantSchema>;
type DefendantFormData = z.infer<typeof defendantSchema>;

const claimDetailsSchema = z.object({
  whatHappened: z.string().min(50, 'Description must be at least 50 characters'),
  amountOwed: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(20, 'Additional details must be at least 20 characters'),
  breachDate: z.string().min(1, 'Date of breach is required'),
});

type ClaimDetailsFormData = z.infer<typeof claimDetailsSchema>;
const claimDetailsResolver = zodResolver(claimDetailsSchema);

interface EvidenceFile {
  id: string;
  name: string;
  type: string;
  category: 'evidence' | 'photo' | 'correspondence' | 'contract' | 'invoice' | 'receipt' | 'other';
  data: string;
  size: number;
  addedAt: string;
}

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

export default function PreClaimPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [letterSent, setLetterSent] = useState(false);
  const [letterSentDate, setLetterSentDate] = useState('');
  const [checklist, setChecklist] = useState({
    letterBeforeClaimSent: false,
    evidenceGathered: false,
    adrConsidered: false,
    informationExchanged: false,
  });
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { saveCurrentClaim, ensureCurrentClaim, userProfile, updateUserProfile, eligibilityAnswers } = useAppStore();

  const claimantForm = useForm<ClaimantFormData>({
    resolver: claimantResolver,
    defaultValues: emptyClaimantDefaults(),
  });

  const defendantForm = useForm<DefendantFormData>({
    resolver: defendantResolver,
    defaultValues: emptyDefendantDefaults(),
  });

  const claimDetailsForm = useForm<ClaimDetailsFormData>({
    resolver: claimDetailsResolver,
    defaultValues: {
      whatHappened: '',
      amountOwed: 0,
      description: '',
      breachDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const { dirtyFields: claimantDirty } = claimantForm.formState;
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadClaimData = async () => {
      const claim = await ensureCurrentClaim();
      claimantForm.reset({
        fullName: claim.claimant.fullName,
        address: claim.claimant.address,
        phone: claim.claimant.phone,
        email: claim.claimant.email,
      });
      defendantForm.reset({
        type: claim.defendant.type,
        fullName: claim.defendant.fullName,
        companyName: claim.defendant.companyName || '',
        address: claim.defendant.address,
        email: claim.defendant.email || '',
      });
      claimDetailsForm.reset({
        whatHappened: claim.particularsOfClaim,
        amountOwed: claim.claimAmount || eligibilityAnswers.claimAmount || 0,
        description: claim.particularsOfClaim,
        breachDate: claim.interest.startDate || eligibilityAnswers.breachDate || format(new Date(), 'yyyy-MM-dd'),
      });
      setChecklist(claim.preActionChecklist);
      setLetterSent(claim.letterBeforeClaim.sent);
      setLetterSentDate(claim.letterBeforeClaim.sentDate || '');
      if (claim.documents && claim.documents.length > 0) {
        setEvidenceFiles(claim.documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          category: doc.category as EvidenceFile['category'],
          data: doc.data || '',
          size: 0,
          addedAt: doc.uploadedAt,
        })));
      }
      const claimantFullName = claim.claimant.fullName;
      const isFormDirty = Object.keys(claimantForm.formState.dirtyFields).length > 0;
      if (!isFormDirty && userProfile) {
        if (!claimantFullName) {
          claimantForm.reset({
            fullName: userProfile.fullName,
            address: userProfile.address,
            phone: userProfile.phone,
            email: userProfile.email,
          });
        }
        if (!claimantFullName || claimantFullName === userProfile.fullName) {
          setAutoFilledFields(new Set(['fullName', 'address.line1', 'address.line2', 'address.city', 'address.county', 'address.postcode', 'phone', 'email']));
        }
      }
    };
    loadClaimData();
  }, []);

  const letterDate = useMemo(() => {
    return letterSentDate ? parseISO(letterSentDate) : new Date();
  }, [letterSentDate]);

  const responseDeadline = useMemo(() => {
    const defendantType = defendantForm.watch('type');
    const daysToAdd = defendantType === 'company' ? 30 : 14;
    return addDays(letterDate, daysToAdd);
  }, [letterDate, defendantForm.watch('type')]);

  const daysRemaining = useMemo(() => {
    if (!responseDeadline) return null;
    return differenceInDays(responseDeadline, new Date());
  }, [responseDeadline]);

  const handleClaimantNext = () => {
    claimantForm.handleSubmit(async (claimantData) => {
      const claim = await ensureCurrentClaim();
      await saveCurrentClaim({
        ...claim,
        claimant: claimantData,
      });
      updateUserProfile(claimantToUserProfile(claimantData));
      setCurrentStep(2);
    })();
  };

  const handleDefendantNext = () => {
    defendantForm.handleSubmit(async (defendantData) => {
      const claim = await ensureCurrentClaim();
      await saveCurrentClaim({
        ...claim,
        defendant: {
          ...defendantData,
          phone: defendantData.phone || '',
          email: defendantData.email || '',
        },
      });
      setCurrentStep(3);
    })();
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

  const handleClaimDetailsNext = () => {
    claimDetailsForm.handleSubmit(async () => {
      const claim = await ensureCurrentClaim();
      const claimantData = claimantForm.getValues();
      const defendantData = defendantForm.getValues();
      const updatedClaim = {
        ...claim,
        claimant: claimantData,
        defendant: {
          ...defendantData,
          address: defendantData.address,
          phone: defendantData.phone || '',
          email: defendantData.email || '',
        },
        claimAmount: claimDetailsForm.getValues().amountOwed,
        particularsOfClaim: claimDetailsForm.getValues().whatHappened,
        interest: {
          ...claim.interest,
          startDate: claimDetailsForm.getValues().breachDate,
        },
      };
      updateUserProfile(claimantToUserProfile(claimantData));
      await saveCurrentClaim(updatedClaim);
      setCurrentStep(4);
    })();
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newFiles: EvidenceFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        const category: EvidenceFile['category'] = file.type.startsWith('image/') ? 'photo' : 'evidence';
        newFiles.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          category,
          data,
          size: file.size,
          addedAt: new Date().toISOString(),
        });
        if (newFiles.length === files.length) {
          setEvidenceFiles(prev => [...prev, ...newFiles]);
          ensureCurrentClaim().then((claim) => {
            const documents = newFiles.map((f) => ({
              id: f.id,
              name: f.name,
              type: f.type,
              category: f.category,
              data: f.data,
              uploadedAt: f.addedAt,
            }));
            saveCurrentClaim({
              ...claim,
              documents: [...(claim.documents || []), ...documents],
            });
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }, [ensureCurrentClaim, saveCurrentClaim]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const removeFile = useCallback((id: string) => {
    setEvidenceFiles(prev => prev.filter(f => f.id !== id));
    ensureCurrentClaim().then((claim) => {
      saveCurrentClaim({
        ...claim,
        documents: (claim.documents || []).filter((d) => d.id !== id),
      });
    });
  }, [ensureCurrentClaim, saveCurrentClaim]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSendLetter = async () => {
    setLetterSent(true);
    setLetterSentDate(format(new Date(), 'yyyy-MM-dd'));
    setChecklist((prev) => ({ ...prev, letterBeforeClaimSent: true }));

    const claim = await ensureCurrentClaim();
    const defendantType = defendantForm.getValues().type || claim.defendant.type;
    const deadline = addDays(new Date(), defendantType === 'company' ? 30 : 14);
    const updatedClaim = {
      ...claim,
      letterBeforeClaim: {
        ...claim.letterBeforeClaim,
        sent: true,
        sentDate: format(new Date(), 'yyyy-MM-dd'),
        responseDeadline: format(deadline, 'yyyy-MM-dd'),
      },
      preActionChecklist: {
        ...claim.preActionChecklist,
        ...checklist,
        letterBeforeClaimSent: true,
      },
      status: 'letter_sent' as const,
    };
    await saveCurrentClaim(updatedClaim);
  };

  const toggleChecklistItem = (item: keyof typeof checklist) => {
    const updated = { ...checklist, [item]: !checklist[item] };
    setChecklist(updated);
    ensureCurrentClaim().then((claim) => {
      saveCurrentClaim({ ...claim, preActionChecklist: updated });
    });
  };

  const generateLetterContent = () => {
    const claimant = claimantForm.getValues();
    const defendant = defendantForm.getValues();
    const claimDetails = claimDetailsForm.getValues();
    const defendantName = defendant.type === 'company' ? `${defendant.companyName || defendant.fullName}` : defendant.fullName;
    const claimantAddress = [
      claimant.address.line1,
      claimant.address.line2,
      claimant.address.city,
      claimant.address.county,
      claimant.address.postcode,
    ].filter(Boolean).join('\n');
    const defendantAddress = [
      defendant.address.line1,
      defendant.address.line2,
      defendant.address.city,
      defendant.address.county,
      defendant.address.postcode,
    ].filter(Boolean).join('\n');

    const deadline = format(responseDeadline, 'd MMMM yyyy');

    const evidenceList = evidenceFiles.length > 0
      ? evidenceFiles.map(f => `- ${f.name}`).join('\n')
      : '- [Relevant contracts/agreements]\n- [Correspondence relating to the debt]\n- [Invoices/receipts]\n- [Other relevant documents]';

    const enclosedList = evidenceFiles.length > 0
      ? evidenceFiles.map(f => f.name).join(', ')
      : '[List of enclosed documents]';

    return `BEFORE CLAIM

From:
${claimant.fullName}
${claimantAddress}

To:
${defendantName}
${defendantAddress}

Date: ${format(new Date(), 'd MMMM yyyy')}

Dear ${defendantName},

LETTER BEFORE CLAIM

Pursuant to the Practice Direction on Pre-Action Conduct and Protocols

I am writing to you in relation to a claim for the sum of £${claimDetails.amountOwed.toFixed(2)} owed to me.

1. THE CLAIM

The claim arises from the following circumstances:

${claimDetails.whatHappened}

${claimDetails.description}

2. AMOUNT OWED

The total amount claimed is £${claimDetails.amountOwed.toFixed(2)}.

This sum became due and payable on ${claimDetails.breachDate}.

3. PRE-ACTION PROTOCOL

This letter is sent in accordance with the Practice Direction on Pre-Action Conduct and the relevant Pre-Action Protocol for Debt Claims.

I invite you to engage with me in the spirit of the Pre-Action Protocols with a view to avoiding the need for court proceedings.

4. RESPONSE REQUIRED

I request that you respond to this letter within 14 days of the date of this letter (or 30 days if you are a business), being no later than ${deadline}.

If you fail to respond within this timeframe, I reserve the right to commence court proceedings against you without further notice.

5. DISPUTE RESOLUTION

If you dispute this claim, please provide a detailed explanation of your reasons for disputing it, together with any relevant documents.

If you are unable to pay the full amount, please provide details of your financial circumstances and a proposal for repayment.

I am willing to consider alternative dispute resolution (ADR) if you believe this would be appropriate.

6. DOCUMENTS

I confirm that I have gathered the following evidence in support of this claim:
${evidenceList}

7. CONSEQUENCES OF NON-PAYMENT

If payment is not received or the claim is not resolved within the stated timeframe, I intend to commence proceedings in the County Court. This may result in:
- A judgment being entered against you
- Additional costs being added to the claim
- Potential enforcement action

Thank you for your attention.

Yours faithfully,


${claimant.fullName}
Signature

Enc: ${enclosedList}
`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Letter Before Claim</title>
            <style>
              body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
              h1 { text-align: center; text-decoration: underline; }
              .header { margin-bottom: 30px; }
              .footer { margin-top: 50px; }
              @media print { body { margin: 20px; } }
            </style>
          </head>
          <body>
            <pre style="font-family: 'Times New Roman', serif; white-space: pre-wrap;">${generateLetterContent()}</pre>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadPDF = () => {
    const letterContent = generateLetterContent();
    const blob = new Blob([letterContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Letter_Before_Claim_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateLetterContent());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const checklistCompletion = Object.values(checklist).filter(Boolean).length;
  const checklistTotal = Object.keys(checklist).length;

  const steps = [
    { number: 1, title: 'Your Details', icon: User },
    { number: 2, title: 'Defendant Details', icon: Building2 },
    { number: 3, title: 'Claim Details', icon: FileText },
    { number: 4, title: 'Evidence & Letter', icon: Paperclip },
  ];

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pre-Claim Workflow</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate a Letter Before Claim and track your pre-action protocol compliance
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span
                  className={`ml-2 text-sm font-medium hidden sm:block ${
                    currentStep >= step.number
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.number
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {currentStep === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Your Details
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Enter your personal details. This information will be used to pre-fill your Letter Before Claim.
          </p>

          {userProfile && (
            <button
              type="button"
              onClick={handlePopulateFromProfile}
              className="mb-6 px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Populate from Saved Profile
            </button>
          )}

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
                <AutoFilledBadge isDirty={isClaimantFieldDirty('fullName')} wasAutoFilled={autoFilledFields.has('fullName')} />
              </label>
              <input
                type="text"
                {...claimantForm.register('fullName')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
              {claimantForm.formState.errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{claimantForm.formState.errors.fullName.message}</p>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your address line 1"
              />
              {claimantForm.formState.errors.address?.line1 && (
                <p className="mt-1 text-sm text-red-600">{claimantForm.formState.errors.address.line1.message}</p>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your address line 2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                  <AutoFilledBadge isDirty={isClaimantFieldDirty('address.city')} wasAutoFilled={autoFilledFields.has('address.city')} />
                </label>
                <input
                  type="text"
                  {...claimantForm.register('address.city')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your city"
                />
                {claimantForm.formState.errors.address?.city && (
                  <p className="mt-1 text-sm text-red-600">{claimantForm.formState.errors.address.city.message}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your postcode"
                />
                {claimantForm.formState.errors.address?.postcode && (
                  <p className="mt-1 text-sm text-red-600">{claimantForm.formState.errors.address.postcode.message}</p>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your county"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
                <AutoFilledBadge isDirty={isClaimantFieldDirty('phone')} wasAutoFilled={autoFilledFields.has('phone')} />
              </label>
              <input
                type="tel"
                {...claimantForm.register('phone')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your phone number"
              />
              {claimantForm.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600">{claimantForm.formState.errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
                <AutoFilledBadge isDirty={isClaimantFieldDirty('email')} wasAutoFilled={autoFilledFields.has('email')} />
              </label>
              <input
                type="email"
                {...claimantForm.register('email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email address"
              />
              {claimantForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{claimantForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleClaimantNext}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {currentStep === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Defendant Details
          </h2>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Defendant Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="individual"
                    {...defendantForm.register('type')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Individual</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="company"
                    {...defendantForm.register('type')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Company/Business</span>
                </label>
              </div>
              {defendantForm.formState.errors.type && (
                <p className="mt-1 text-sm text-red-600">{defendantForm.formState.errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {defendantForm.watch('type') === 'company' ? 'Company Name' : 'Full Name'}
              </label>
              <input
                type="text"
                {...defendantForm.register('fullName')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder={defendantForm.watch('type') === 'company' ? 'Enter company name' : 'Enter full name'}
              />
              {defendantForm.formState.errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{defendantForm.formState.errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                {...defendantForm.register('address.line1')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address line 1"
              />
              {defendantForm.formState.errors.address?.line1 && (
                <p className="mt-1 text-sm text-red-600">{defendantForm.formState.errors.address.line1.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                {...defendantForm.register('address.line2')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address line 2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  {...defendantForm.register('address.city')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter city"
                />
                {defendantForm.formState.errors.address?.city && (
                  <p className="mt-1 text-sm text-red-600">{defendantForm.formState.errors.address.city.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  {...defendantForm.register('address.postcode')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter postcode"
                />
                {defendantForm.formState.errors.address?.postcode && (
                  <p className="mt-1 text-sm text-red-600">{defendantForm.formState.errors.address.postcode.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                County (Optional)
              </label>
              <input
                type="text"
                {...defendantForm.register('address.county')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter county"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                {...defendantForm.register('email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
              {defendantForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{defendantForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleDefendantNext}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {currentStep === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Claim Details
          </h2>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What Happened?
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Provide a clear description of the circumstances leading to this claim
              </p>
              <textarea
                {...claimDetailsForm.register('whatHappened')}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what happened and why you are making this claim..."
              />
              {claimDetailsForm.formState.errors.whatHappened && (
                <p className="mt-1 text-sm text-red-600">{claimDetailsForm.formState.errors.whatHappened.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount Owed (£)
              </label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...claimDetailsForm.register('amountOwed', { valueAsNumber: true })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              {claimDetailsForm.formState.errors.amountOwed && (
                <p className="mt-1 text-sm text-red-600">{claimDetailsForm.formState.errors.amountOwed.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date the Amount Became Due
              </label>
              <input
                type="date"
                {...claimDetailsForm.register('breachDate')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              {claimDetailsForm.formState.errors.breachDate && (
                <p className="mt-1 text-sm text-red-600">{claimDetailsForm.formState.errors.breachDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Details
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Any additional information that supports your claim
              </p>
              <textarea
                {...claimDetailsForm.register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Provide any additional details, reference numbers, or supporting information..."
              />
              {claimDetailsForm.formState.errors.description && (
                <p className="mt-1 text-sm text-red-600">{claimDetailsForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleClaimDetailsNext}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Evidence
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Evidence & Documents
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Upload photos, invoices, contracts, or any other evidence supporting your claim. You can also take photos directly from your phone.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports images, PDFs, documents (max 10MB per file)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {evidenceFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Uploaded Evidence ({evidenceFiles.length})
                </h3>
                <div className="space-y-2">
                  {evidenceFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {file.type.startsWith('image/') ? (
                        <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <File className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {file.category}{file.size > 0 ? ` • ${formatFileSize(file.size)}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Letter Before Claim
              </h2>
              <button
                onClick={() => setShowLetterPreview(!showLetterPreview)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Eye className="w-4 h-4" />
                {showLetterPreview ? 'Hide' : 'Show'} Full Letter
              </button>
            </div>

            {showLetterPreview && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                  {generateLetterContent()}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Letter
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>

            {letterSent && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckSquare className="w-5 h-5" />
                  <span className="font-medium">Letter marked as sent on {format(parseISO(letterSentDate), 'd MMMM yyyy')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Pre-Action Protocol Checklist
            </h2>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{checklistCompletion} of {checklistTotal} completed</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-300"
                  style={{ width: `${(checklistCompletion / checklistTotal) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                {checklist.letterBeforeClaimSent ? (
                  <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <input
                  type="checkbox"
                  checked={checklist.letterBeforeClaimSent}
                  onChange={() => toggleChecklistItem('letterBeforeClaimSent')}
                  className="sr-only"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Letter Before Claim sent
                  </span>
                  {letterSentDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sent on {format(parseISO(letterSentDate), 'd MMMM yyyy')}
                    </p>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                {checklist.evidenceGathered ? (
                  <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <input
                  type="checkbox"
                  checked={checklist.evidenceGathered}
                  onChange={() => toggleChecklistItem('evidenceGathered')}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Evidence gathered and organised
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                {checklist.adrConsidered ? (
                  <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <input
                  type="checkbox"
                  checked={checklist.adrConsidered}
                  onChange={() => toggleChecklistItem('adrConsidered')}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alternative Dispute Resolution (ADR) considered
                </span>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed ${
                checklist.informationExchanged
                  ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50'
              }`}>
                {checklist.informationExchanged ? (
                  <CheckSquare className="w-5 h-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
                <input
                  type="checkbox"
                  checked={checklist.informationExchanged}
                  onChange={() => toggleChecklistItem('informationExchanged')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Relevant information exchanged with defendant
                  </span>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    Complete this after the defendant acknowledges receipt and returns information
                  </p>
                </div>
              </label>
            </div>
          </div>

          {!letterSent && (
            <div className="mt-4">
              <button
                onClick={handleSendLetter}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Send className="w-5 h-5" />
                Mark Letter as Sent
              </button>
            </div>
          )}

          {letterSent && responseDeadline && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Claim Timeline
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Send className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">Letter Before Claim Sent</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(letterSentDate), 'd MMMM yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    daysRemaining !== null && daysRemaining < 0
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : daysRemaining !== null && daysRemaining <= 7
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Calendar className={`w-5 h-5 ${
                      daysRemaining !== null && daysRemaining < 0
                        ? 'text-red-600'
                        : daysRemaining !== null && daysRemaining <= 7
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">Response Deadline</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(responseDeadline, 'd MMMM yyyy')}
                    </p>
                    {daysRemaining !== null && daysRemaining >= 0 ? (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        {daysRemaining} days remaining
                      </p>
                    ) : daysRemaining !== null ? (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Deadline passed {Math.abs(daysRemaining)} days ago
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {defendantForm.watch('type') === 'company' ? (
                      <>
                        <Building2 className="w-4 h-4" />
                        <span>Business defendant - 30 day response period</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        <span>Individual defendant - 14 day response period</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}