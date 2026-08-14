export interface FeeBracket {
  min: number;
  max: number;
  onlineFee: number;
  paperFee: number;
}

// Issue fees for money claims (Civil Proceedings Fees Order 2008, Fee 1.1).
// Updated to the EX50A schedule effective from 8 April 2025. The previous
// online/paper two-tier fee was replaced by a single issue fee, so onlineFee
// and paperFee are set to the same value.
export const FEE_BRACKETS: FeeBracket[] = [
  { min: 0, max: 300, onlineFee: 35, paperFee: 35 },
  { min: 300.01, max: 500, onlineFee: 50, paperFee: 50 },
  { min: 500.01, max: 1000, onlineFee: 70, paperFee: 70 },
  { min: 1000.01, max: 1500, onlineFee: 80, paperFee: 80 },
  { min: 1500.01, max: 3000, onlineFee: 115, paperFee: 115 },
  { min: 3000.01, max: 5000, onlineFee: 205, paperFee: 205 },
  { min: 5000.01, max: 10000, onlineFee: 455, paperFee: 455 },
];

// Hearing fee (Civil Proceedings Fees Order 2008) — flat rate by track from
// 8 April 2025 (previously value-based).
export const SMALL_CLAIMS_HEARING_FEE = 147;
export const OTHER_CLAIMS_HEARING_FEE = 171;

export function calculateCourtFee(amount: number, method: 'online' | 'paper'): number {
  if (amount > 200000) {
    return 10000;
  }

  if (amount > 10000) {
    return Math.ceil(amount * 0.05);
  }

  const bracket = FEE_BRACKETS.find(
    (b) => amount >= b.min && amount <= b.max
  );

  return bracket ? (method === 'online' ? bracket.onlineFee : bracket.paperFee) : 0;
}

export function calculateHearingFee(amount: number): number {
  return amount <= 10000 ? SMALL_CLAIMS_HEARING_FEE : OTHER_CLAIMS_HEARING_FEE;
}

export function calculateTotalFees(
  claimAmount: number,
  interestAmount: number,
  method: 'online' | 'paper'
): { courtFee: number; hearingFee: number; total: number } {
  const totalClaim = claimAmount + interestAmount;
  const courtFee = calculateCourtFee(totalClaim, method);
  const hearingFee = calculateHearingFee(totalClaim);

  return {
    courtFee,
    hearingFee,
    total: courtFee + hearingFee,
  };
}

export function getFeeLastUpdated(): string {
  return 'April 2025';
}
