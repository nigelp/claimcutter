import { differenceInDays } from 'date-fns';

export const STATUTORY_INTEREST_RATE = 8;

export interface InterestResult {
  totalDays: number;
  interestAmount: number;
  dailyRate: number;
}

export function calculateInterest(
  principal: number,
  startDate: string,
  endDate: string,
  rate: number = STATUTORY_INTEREST_RATE
): InterestResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const totalDays = differenceInDays(end, start);
  
  if (totalDays <= 0) {
    return { totalDays: 0, interestAmount: 0, dailyRate: 0 };
  }
  
  const dailyRate = (principal * rate) / 36500;
  const interestAmount = dailyRate * totalDays;
  
  return {
    totalDays,
    interestAmount: Math.round(interestAmount * 100) / 100,
    dailyRate: Math.round(dailyRate * 100) / 100,
  };
}

export function calculateInterestToDate(
  principal: number,
  startDate: string,
  rate: number = STATUTORY_INTEREST_RATE
): InterestResult {
  return calculateInterest(principal, startDate, new Date().toISOString().split('T')[0], rate);
}

export function formatInterestAmount(amount: number): string {
  return `£${amount.toFixed(2)}`;
}