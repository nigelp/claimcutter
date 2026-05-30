import { EligibilityAnswers } from '../types';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  alternative?: string;
}

export function checkEligibility(answers: EligibilityAnswers): EligibilityResult {
  if (answers.jurisdiction !== 'england_wales') {
    return {
      eligible: false,
      reason: 'Small claims track is only available for England and Wales',
      alternative: answers.jurisdiction === 'scotland'
        ? 'In Scotland, you should use the Simple Procedure online system at www.scotcourts.gov.uk'
        : 'In Northern Ireland, you should use the Small Claims Court at www.nidirect.gov.uk',
    };
  }

  if (!answers.isClaimantOver18) {
    return {
      eligible: false,
      reason: 'You must be over 18 to use the small claims track',
    };
  }

  if (answers.isDefendantOver18 === false) {
    return {
      eligible: false,
      reason: 'The defendant must be over 18 (or a business)',
    };
  }

  if (!answers.isDefendantInEnglandWales) {
    return {
      eligible: false,
      reason: 'The defendant must reside in England & Wales',
    };
  }

  if (answers.isPersonalInjury) {
    const amount = answers.personalInjuryAmount || answers.claimAmount;
    const limit = answers.isRoadTrafficAccident ? 5000 : 1000;
    if (amount > limit) {
      return {
        eligible: false,
        reason: `Personal injury claims over £${limit.toLocaleString()} cannot use the small claims track`,
        alternative: 'Your claim may need to go through the Fast Track or Multi Track. Please seek legal advice.',
      };
    }
  }

  if (answers.isHousingDisrepair) {
    const repairCost = answers.housingDisrepairAmount || 0;
    if (repairCost > 1000) {
      return {
        eligible: false,
        reason: 'Housing disrepair claims for repair costs over £1,000 cannot use the small claims track',
        alternative: 'You may need to use a different court track. Please seek legal advice.',
      };
    }
  }

  if (answers.claimAmount > 10000) {
    return {
      eligible: false,
      reason: 'Claims over £10,000 cannot use the small claims track',
      alternative: 'Your claim may need to go through the Fast Track or Multi Track. Please seek legal advice.',
    };
  }

  if (answers.claimAmount <= 0) {
    return {
      eligible: false,
      reason: 'Claim amount must be greater than £0',
    };
  }

  if (answers.breachDate) {
    const breach = new Date(answers.breachDate);
    const limitationYears = answers.isPersonalInjury ? 3 : 6;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - limitationYears);

    if (breach < cutoff) {
      return {
        eligible: false,
        reason: `Claims are generally time-barred after ${limitationYears} years from the date of breach`,
        alternative: 'You may still be able to claim in certain circumstances. Please seek legal advice.',
      };
    }
  }

  return {
    eligible: true,
  };
}

export function getDisputeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    unpaid_invoice: 'Unpaid Invoice',
    defective_product: 'Defective Product',
    service_not_provided: 'Service Not Provided',
    tenancy_deposit: 'Tenancy Deposit Dispute',
    contract_breach: 'Contract Breach',
    faulty_goods: 'Faulty Goods',
    other: 'Other',
  };
  return labels[type] || type;
}