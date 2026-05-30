import { format } from 'date-fns';
import { Claim, Document, HearingChecklistItems } from '../types';
import { calculateInterestToDate } from './interestCalculator';
import { calculateHearingFee } from './feeCalculator';
import { getDisputeTypeLabel } from './eligibilityChecker';

export interface ChronologyEntry {
  date: string;
  title: string;
  description: string;
  source: 'timeline' | 'claim' | 'document';
}

export interface BundleIndexEntry {
  index: number;
  name: string;
  category: string;
  uploadedAt: string;
  notes?: string;
}

export interface FinancialSummary {
  claimAmount: number;
  interestAmount: number;
  courtFee: number;
  hearingFee: number;
  total: number;
}

export function generateChronology(claim: Claim): ChronologyEntry[] {
  const entries: ChronologyEntry[] = [];

  entries.push({
    date: claim.createdAt,
    title: 'Claim created',
    description: `Claim for £${claim.claimAmount.toFixed(2)} - ${getDisputeTypeLabel(claim.disputeType)}`,
    source: 'claim',
  });

  if (claim.letterBeforeClaim.sent && claim.letterBeforeClaim.sentDate) {
    entries.push({
      date: claim.letterBeforeClaim.sentDate,
      title: 'Letter before claim sent',
      description: `Sent via ${claim.letterBeforeClaim.method}`,
      source: 'claim',
    });
  }

  if (claim.letterBeforeClaim.responseDeadline) {
    entries.push({
      date: claim.letterBeforeClaim.responseDeadline,
      title: 'Response deadline',
      description: 'Deadline for defendant to respond to letter before claim',
      source: 'claim',
    });
  }

  if (claim.defendantResponse?.receivedDate) {
    entries.push({
      date: claim.defendantResponse.receivedDate,
      title: `Defendant response received - ${claim.defendantResponse.type}`,
      description: claim.defendantResponse.content || 'No content provided',
      source: 'claim',
    });
  }

  if (claim.mediationStatus?.scheduledDate) {
    entries.push({
      date: claim.mediationStatus.scheduledDate,
      title: 'Mediation scheduled',
      description: claim.mediationStatus.completed
        ? `Outcome: ${claim.mediationStatus.outcome || 'Unknown'}`
        : 'Mediation scheduled',
      source: 'claim',
    });
  }

  if (claim.submissionDate) {
    entries.push({
      date: claim.submissionDate,
      title: 'Claim submitted to court',
      description: `Submitted via ${claim.submissionMethod}`,
      source: 'claim',
    });
  }

  for (const event of claim.timeline) {
    entries.push({
      date: event.date,
      title: event.title,
      description: event.description,
      source: 'timeline',
    });
  }

  for (const doc of claim.documents) {
    entries.push({
      date: doc.uploadedAt,
      title: `Document uploaded: ${doc.name}`,
      description: `Category: ${doc.category}${doc.notes ? ` - ${doc.notes}` : ''}`,
      source: 'document',
    });
  }

  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function generateBundleIndex(documents: Document[]): BundleIndexEntry[] {
  const categoryOrder = [
    'contract',
    'invoice',
    'receipt',
    'evidence',
    'correspondence',
    'witness_statement',
    'expert_report',
    'photo',
    'other',
  ];

  const sorted = [...documents].sort((a, b) => {
    const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
  });

  return sorted.map((doc, index) => ({
    index: index + 1,
    name: doc.name,
    category: doc.category,
    uploadedAt: doc.uploadedAt,
    notes: doc.notes,
  }));
}

export function calculateFinancialSummary(claim: Claim, _hearingDate?: string): FinancialSummary {
  let interestAmount = 0;

  if (claim.interest.claimInterest && claim.interest.startDate) {
    const result = calculateInterestToDate(
      claim.claimAmount,
      claim.interest.startDate,
      claim.interest.rate
    );
    interestAmount = result.interestAmount;
  }

  const courtFee = claim.courtFee;
  const hearingFee = calculateHearingFee(claim.claimAmount + interestAmount);

  return {
    claimAmount: claim.claimAmount,
    interestAmount,
    courtFee,
    hearingFee,
    total: claim.claimAmount + interestAmount + courtFee + hearingFee,
  };
}

export function generateSkeletonArgumentTemplate(claim: Claim): string {
  const disputeType = getDisputeTypeLabel(claim.disputeType);
  const summary = generateCaseSummary(claim);

  return `SKELETON ARGUMENT

Claimant: ${claim.claimant.fullName}
Defendant: ${claim.defendant.fullName}
Claim Amount: £${claim.claimAmount.toFixed(2)}
Dispute Type: ${disputeType}

---

1. INTRODUCTION

1.1 This is a claim for ${disputeType.toLowerCase()}.

1.2 The Claimant seeks the sum of £${claim.claimAmount.toFixed(2)}${claim.interest.claimInterest ? `, plus interest at ${claim.interest.rate}%` : ''}, together with court fees of £${claim.courtFee.toFixed(2)}.

---

2. FACTS

2.1 ${summary}

---

3. PARTICULARS OF CLAIM

3.1 ${claim.particularsOfClaim}

---

4. RELIEF SOUGHT

4.1 The Claimant seeks:
    (a) Payment of £${claim.claimAmount.toFixed(2)}
${claim.interest.claimInterest ? `    (b) Interest at ${claim.interest.rate}% from ${claim.interest.startDate || '[start date]'}\n` : ''}    (c) Court fees of £${claim.courtFee.toFixed(2)}
    (d) Such further relief as the Court deems appropriate.

---

5. ${claim.defendantResponse ? 'DEFENDANT\'S RESPONSE AND REBUTTAL' : 'ADDITIONAL MATTERS'}

${claim.defendantResponse
  ? `5.1 The Defendant has ${claim.defendantResponse.type === 'full_admission' ? 'admitted the claim in full' : claim.defendantResponse.type === 'partial_admission' ? 'partially admitted the claim' : 'defended the claim'}.

5.2 ${claim.defendantResponse.content || 'No specific content provided.'}

5.3 The Claimant's response: [TO BE COMPLETED BY CLAIMANT]`
  : '5.1 [TO BE COMPLETED - Add any additional matters relevant to the claim]'}

---

6. LEGAL BASIS

6.1 [TO BE COMPLETED - Cite relevant legislation, case law, or contractual provisions]

---

7. CONCLUSION

7.1 For the reasons set out above, the Claimant respectfully requests that the Court:
    (a) Finds in favour of the Claimant;
    (b) Awards the sums claimed;
    (c) Awards costs.

---

Prepared by: ${claim.claimant.fullName}
Date: ${format(new Date(), 'dd MMMM yyyy')}
`;
}

export function generateCaseSummary(claim: Claim): string {
  const parts: string[] = [];

  parts.push(`The Claimant, ${claim.claimant.fullName}, brings this claim against the Defendant, ${claim.defendant.fullName}, for ${getDisputeTypeLabel(claim.disputeType).toLowerCase()}.`);

  if (claim.letterBeforeClaim.sent && claim.letterBeforeClaim.sentDate) {
    parts.push(`A letter before claim was sent to the Defendant on ${format(new Date(claim.letterBeforeClaim.sentDate), 'dd MMMM yyyy')} via ${claim.letterBeforeClaim.method}.`);
  }

  if (claim.defendantResponse) {
    parts.push(`The Defendant responded with a ${claim.defendantResponse.type.replace(/_/g, ' ')} on ${format(new Date(claim.defendantResponse.receivedDate), 'dd MMMM yyyy')}.`);
  }

  if (claim.mediationStatus?.completed) {
    parts.push(`Mediation was ${claim.mediationStatus.outcome === 'settled' ? 'successful and the matter was settled' : 'unsuccessful'}.`);
  }

  return parts.join(' ');
}

export function getDefaultChecklist(): HearingChecklistItems {
  return {
    broughtAllDocuments: false,
    broughtCopiesForJudge: false,
    broughtCopiesForDefendant: false,
    preparedTimeline: false,
    calculatedInterestToDate: false,
    reviewedDefendantResponse: false,
    preparedOpeningStatement: false,
    preparedQuestionsForWitnesses: false,
    dressedAppropriately: false,
    arrivedEarly: false,
  };
}

export function exportToPrintableHtml(content: { title: string; body: string }): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${content.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #666; padding-bottom: 5px; margin-top: 30px; }
    pre { white-space: pre-wrap; font-family: inherit; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${content.title}</h1>
  <pre>${content.body}</pre>
</body>
</html>`;
}