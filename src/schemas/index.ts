import { z } from 'zod';

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  county: z.string().optional(),
  postcode: z.string().min(1, 'Postcode is required').regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i, 'Invalid UK postcode format'),
  country: z.enum(['England', 'Wales']),
});

export const claimantSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  address: addressSchema,
  phone: z.string().min(1, 'Phone number is required').regex(/^[\d\s+()-]{11,}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
});

export const defendantSchema = z.object({
  type: z.enum(['individual', 'company']),
  fullName: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  address: addressSchema,
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export const interestSchema = z.object({
  claimInterest: z.boolean(),
  rate: z.number().min(0).max(100).default(8),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  calculatedAmount: z.number().default(0),
});

export const letterBeforeClaimSchema = z.object({
  sent: z.boolean(),
  sentDate: z.string().optional(),
  method: z.enum(['post', 'email', 'hand_delivered']),
  responseDeadline: z.string().optional(),
  responseReceived: z.boolean(),
  responseContent: z.string().optional(),
});

export const preActionChecklistSchema = z.object({
  letterBeforeClaimSent: z.boolean(),
  evidenceGathered: z.boolean(),
  adrConsidered: z.boolean(),
  informationExchanged: z.boolean(),
  completedAt: z.string().optional(),
});

export const claimSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'draft',
    'letter_sent',
    'claim_submitted',
    'awaiting_response',
    'mediation',
    'hearing',
    'judgment',
    'enforcement',
    'closed',
  ]),
  createdAt: z.string(),
  updatedAt: z.string(),
  disputeType: z.enum([
    'unpaid_invoice',
    'defective_product',
    'service_not_provided',
    'tenancy_deposit',
    'contract_breach',
    'faulty_goods',
    'other',
  ]),
  claimant: claimantSchema,
  defendant: defendantSchema,
  claimAmount: z.number().min(0.01, 'Claim amount must be greater than 0'),
  interest: interestSchema,
  particularsOfClaim: z.string().min(50, 'Particulars of claim must be at least 50 characters'),
  courtFee: z.number().default(0),
  letterBeforeClaim: letterBeforeClaimSchema,
  preActionChecklist: preActionChecklistSchema,
  submissionMethod: z.enum(['online', 'paper']),
  submissionDate: z.string().optional(),
  defendantResponse: z.object({
    type: z.enum(['full_admission', 'partial_admission', 'defence', 'counterclaim', 'no_response']),
    receivedDate: z.string(),
    content: z.string().optional(),
    admittedAmount: z.number().optional(),
  }).optional(),
  mediationStatus: z.object({
    offered: z.boolean(),
    accepted: z.boolean(),
    scheduled: z.boolean().optional(),
    scheduledDate: z.string().optional(),
    completed: z.boolean(),
    outcome: z.enum(['settled', 'not_settled', 'refused']).optional(),
  }).optional(),
  hearingDetails: z.object({
    type: z.enum(['paper', 'telephone', 'video', 'in_person']),
    date: z.string().optional(),
    time: z.string().optional(),
    location: z.string().optional(),
    link: z.string().optional(),
    notes: z.string().optional(),
    caseSummary: z.string().optional(),
    skeletonArgument: z.string().optional(),
    openingStatement: z.string().optional(),
    closingStatement: z.string().optional(),
    witnessStatement: z.string().optional(),
    questionsForJudge: z.array(z.string()).optional(),
    hearingChecklist: z.object({
      broughtAllDocuments: z.boolean().default(false),
      broughtCopiesForJudge: z.boolean().default(false),
      broughtCopiesForDefendant: z.boolean().default(false),
      preparedTimeline: z.boolean().default(false),
      calculatedInterestToDate: z.boolean().default(false),
      reviewedDefendantResponse: z.boolean().default(false),
      preparedOpeningStatement: z.boolean().default(false),
      preparedQuestionsForWitnesses: z.boolean().default(false),
      dressedAppropriately: z.boolean().default(false),
      arrivedEarly: z.boolean().default(false),
    }).optional(),
    bundleDocumentIds: z.array(z.string()).optional(),
  }).optional(),
  judgment: z.object({
    won: z.boolean(),
    amount: z.number(),
    paymentDeadline: z.string().optional(),
    paymentSchedule: z.string().optional(),
    costsAwarded: z.number().optional(),
  }).optional(),
  enforcement: z.object({
    type: z.enum([
      'warrant_of_control',
      'attachment_of_earnings',
      'third_party_debt_order',
      'charging_order',
    ]),
    applied: z.boolean(),
    appliedDate: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
  }).optional(),
  documents: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
    category: z.enum([
      'evidence',
      'correspondence',
      'contract',
      'invoice',
      'receipt',
      'photo',
      'witness_statement',
      'expert_report',
      'other',
    ]),
    data: z.string().optional(),
    uploadedAt: z.string(),
    notes: z.string().optional(),
  })),
  timeline: z.array(z.object({
    id: z.string().uuid(),
    date: z.string(),
    title: z.string(),
    description: z.string(),
    type: z.enum(['milestone', 'deadline', 'event', 'reminder']),
    completed: z.boolean(),
  })),
});

export const eligibilitySchema = z.object({
  jurisdiction: z.enum(['england_wales', 'scotland', 'northern_ireland']),
  isClaimantOver18: z.boolean().refine(val => val === true, 'You must be over 18'),
  isDefendantOver18: z.boolean(),
  isDefendantInEnglandWales: z.boolean().refine(val => val === true, 'Defendant must reside in England & Wales'),
  claimAmount: z.number().min(0.01, 'Claim amount must be greater than 0'),
  isPersonalInjury: z.boolean(),
  personalInjuryAmount: z.number().optional(),
  isRoadTrafficAccident: z.boolean(),
  isHousingDisrepair: z.boolean(),
  housingDisrepairAmount: z.number().optional(),
  claimType: z.string().min(1, 'Please select a claim type'),
  breachDate: z.string().optional(),
  isDefamation: z.boolean(),
});

export type Address = z.infer<typeof addressSchema>;
export type ClaimantDetails = z.infer<typeof claimantSchema>;
export type DefendantDetails = z.infer<typeof defendantSchema>;
export type InterestCalculation = z.infer<typeof interestSchema>;
export type LetterBeforeClaim = z.infer<typeof letterBeforeClaimSchema>;
export type PreActionChecklist = z.infer<typeof preActionChecklistSchema>;
export type Claim = z.infer<typeof claimSchema>;
export type EligibilityAnswers = z.infer<typeof eligibilitySchema>;

export const userProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  address: addressSchema,
  phone: z.string().min(1, 'Phone number is required').regex(/^[\d\s+()-]{11,}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  lastUpdated: z.string(),
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;

export function emptyUserProfile(): UserProfileSchema {
  return {
    fullName: '',
    address: { line1: '', city: '', postcode: '', country: 'England' },
    phone: '',
    email: '',
    lastUpdated: '',
  };
}