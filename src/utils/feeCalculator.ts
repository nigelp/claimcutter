export interface FeeBracket {
  min: number;
  max: number;
  onlineFee: number;
  paperFee: number;
}

export const FEE_BRACKETS: FeeBracket[] = [
  { min: 0, max: 300, onlineFee: 25, paperFee: 35 },
  { min: 300.01, max: 500, onlineFee: 35, paperFee: 50 },
  { min: 500.01, max: 1000, onlineFee: 60, paperFee: 70 },
  { min: 1000.01, max: 1500, onlineFee: 70, paperFee: 80 },
  { min: 1500.01, max: 3000, onlineFee: 80, paperFee: 115 },
  { min: 3000.01, max: 5000, onlineFee: 180, paperFee: 205 },
  { min: 5000.01, max: 10000, onlineFee: 455, paperFee: 520 },
];

export const HEARING_FEE_BRACKETS: FeeBracket[] = [
  { min: 0, max: 1500, onlineFee: 25, paperFee: 25 },
  { min: 1500.01, max: 3000, onlineFee: 55, paperFee: 55 },
  { min: 3000.01, max: 5000, onlineFee: 80, paperFee: 80 },
  { min: 5000.01, max: 10000, onlineFee: 115, paperFee: 115 },
];

export function calculateCourtFee(amount: number, method: 'online' | 'paper'): number {
  if (amount > 10000) {
    return Math.ceil(amount * 0.05);
  }
  
  const bracket = FEE_BRACKETS.find(
    (b) => amount >= b.min && amount <= b.max
  );
  
  return bracket ? (method === 'online' ? bracket.onlineFee : bracket.paperFee) : 0;
}

export function calculateHearingFee(amount: number): number {
  if (amount > 10000) {
    return 335;
  }
  
  const bracket = HEARING_FEE_BRACKETS.find(
    (b) => amount >= b.min && amount <= b.max
  );
  
  return bracket ? bracket.onlineFee : 0;
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
  return 'January 2024';
}