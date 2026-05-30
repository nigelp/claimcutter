export type ClaimStatus =
  | 'draft'
  | 'letter_sent'
  | 'claim_submitted'
  | 'awaiting_response'
  | 'mediation'
  | 'hearing'
  | 'judgment'
  | 'enforcement'
  | 'closed';

export type DisputeType =
  | 'unpaid_invoice'
  | 'defective_product'
  | 'service_not_provided'
  | 'tenancy_deposit'
  | 'contract_breach'
  | 'faulty_goods'
  | 'other';

export type SubmissionMethod = 'online' | 'paper';

export type HearingType = 'paper' | 'telephone' | 'video' | 'in_person';

export type EnforcementType =
  | 'warrant_of_control'
  | 'attachment_of_earnings'
  | 'third_party_debt_order'
  | 'charging_order';

export interface ClaimantDetails {
  fullName: string;
  address: Address;
  phone: string;
  email: string;
}

export interface DefendantDetails {
  type: 'individual' | 'company';
  fullName: string;
  companyName?: string;
  address: Address;
  phone: string;
  email: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: 'England' | 'Wales';
}

export interface InterestCalculation {
  claimInterest: boolean;
  rate: number;
  startDate: string;
  endDate: string;
  calculatedAmount: number;
}

export interface LetterBeforeClaim {
  sent: boolean;
  sentDate?: string;
  method: 'post' | 'email' | 'hand_delivered';
  responseDeadline?: string;
  responseReceived: boolean;
  responseContent?: string;
}

export interface PreActionChecklist {
  letterBeforeClaimSent: boolean;
  evidenceGathered: boolean;
  adrConsidered: boolean;
  informationExchanged: boolean;
  completedAt?: string;
}

export interface DefendantResponse {
  type: 'full_admission' | 'partial_admission' | 'defence' | 'counterclaim' | 'no_response';
  receivedDate: string;
  content?: string;
  admittedAmount?: number;
}

export interface MediationStatus {
  offered: boolean;
  accepted: boolean;
  scheduled?: boolean;
  scheduledDate?: string;
  completed: boolean;
  outcome?: 'settled' | 'not_settled' | 'refused';
}

export interface HearingDetails {
  type: HearingType;
  date?: string;
  time?: string;
  location?: string;
  link?: string;
  notes?: string;
  caseSummary?: string;
  skeletonArgument?: string;
  openingStatement?: string;
  closingStatement?: string;
  witnessStatement?: string;
  questionsForJudge?: string[];
  hearingChecklist?: HearingChecklistItems;
  bundleDocumentIds?: string[];
}

export interface HearingChecklistItems {
  broughtAllDocuments: boolean;
  broughtCopiesForJudge: boolean;
  broughtCopiesForDefendant: boolean;
  preparedTimeline: boolean;
  calculatedInterestToDate: boolean;
  reviewedDefendantResponse: boolean;
  preparedOpeningStatement: boolean;
  preparedQuestionsForWitnesses: boolean;
  dressedAppropriately: boolean;
  arrivedEarly: boolean;
}

export interface Judgment {
  won: boolean;
  amount: number;
  paymentDeadline?: string;
  paymentSchedule?: string;
  costsAwarded?: number;
}

export interface Enforcement {
  type: EnforcementType;
  applied: boolean;
  appliedDate?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: DocumentCategory;
  data?: string;
  uploadedAt: string;
  notes?: string;
}

export type DocumentCategory =
  | 'evidence'
  | 'correspondence'
  | 'contract'
  | 'invoice'
  | 'receipt'
  | 'photo'
  | 'witness_statement'
  | 'expert_report'
  | 'other';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'deadline' | 'event' | 'reminder';
  completed: boolean;
}

export interface Claim {
  id: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  disputeType: DisputeType;
  claimant: ClaimantDetails;
  defendant: DefendantDetails;
  claimAmount: number;
  interest: InterestCalculation;
  particularsOfClaim: string;
  courtFee: number;
  letterBeforeClaim: LetterBeforeClaim;
  preActionChecklist: PreActionChecklist;
  submissionMethod: SubmissionMethod;
  submissionDate?: string;
  defendantResponse?: DefendantResponse;
  mediationStatus?: MediationStatus;
  hearingDetails?: HearingDetails;
  judgment?: Judgment;
  enforcement?: Enforcement;
  documents: Document[];
  timeline: TimelineEvent[];
}

export interface EligibilityAnswers {
  jurisdiction: 'england_wales' | 'scotland' | 'northern_ireland' | '';
  isClaimantOver18: boolean;
  isDefendantOver18: boolean;
  isDefendantInEnglandWales: boolean;
  claimAmount: number;
  isPersonalInjury: boolean;
  personalInjuryAmount?: number;
  isRoadTrafficAccident: boolean;
  isHousingDisrepair: boolean;
  housingDisrepairAmount?: number;
  claimType: string;
  breachDate?: string;
}

export interface AppState {
  currentClaim: Claim | null;
  claims: Claim[];
  eligibilityAnswers: EligibilityAnswers;
  disclaimerAccepted: boolean;
  darkMode: boolean;
}
export interface UserProfile {
  fullName: string;
  address: Address;
  phone: string;
  email: string;
  lastUpdated: string;
}