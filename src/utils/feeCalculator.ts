export interface FeeBracket {
  min: number;
  max: number;
  fee: number;
}

// Issue fees for money claims (Civil Proceedings Fees Order 2008, Fee 1.1).
// Effective 8 April 2025 there is a single issue fee regardless of filing
// method (the previous online/paper discount was removed).
export const FEE_BRACKETS: FeeBracket[] = [
  { min: 0, max: 300, fee: 35 },
  { min: 300.01, max: 500, fee: 50 },
  { min: 500.01, max: 1000, fee: 70 },
  { min: 1000.01, max: 1500, fee: 80 },
  { min: 1500.01, max: 3000, fee: 115 },
  { min: 3000.01, max: 5000, fee: 205 },
  { min: 5000.01, max: 10000, fee: 455 },
];

// Hearing fee (Civil Proceedings Fees Order 2008) — flat rate by track from
// 8 April 2025 (previously value-based).
export const SMALL_CLAIMS_HEARING_FEE = 147;
export const OTHER_CLAIMS_HEARING_FEE = 171;

export function calculateCourtFee(amount: number): number {
  if (amount > 200000) {
    return 10000;
  }

  if (amount > 10000) {
    return Math.ceil(amount * 0.05);
  }

  const bracket = FEE_BRACKETS.find(
    (b) => amount >= b.min && amount <= b.max
  );

  return bracket ? bracket.fee : 0;
}

export function calculateHearingFee(amount: number): number {
  return amount <= 10000 ? SMALL_CLAIMS_HEARING_FEE : OTHER_CLAIMS_HEARING_FEE;
}

export function calculateTotalFees(
  claimAmount: number,
  interestAmount: number
): { courtFee: number; hearingFee: number; total: number } {
  const totalClaim = claimAmount + interestAmount;
  const courtFee = calculateCourtFee(totalClaim);
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
