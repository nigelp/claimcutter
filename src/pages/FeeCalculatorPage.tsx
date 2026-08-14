import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import {
  Calculator,
  FileText,
  Monitor,
  HelpCircle,
  PoundSterling,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  calculateTotalFees,
  calculateHearingFee,
  FEE_BRACKETS,
  getFeeLastUpdated,
} from '../utils/feeCalculator';

export default function FeeCalculatorPage() {
  const { claims, currentClaimId, eligibilityAnswers } = useAppStore();
  const currentClaim = useMemo(
    () => claims.find((c) => c.id === currentClaimId),
    [claims, currentClaimId],
  );
  const defaultAmount = currentClaim?.claimAmount || eligibilityAnswers.claimAmount || 0;
  const defaultInterest = currentClaim?.interest?.calculatedAmount || 0;
  const hasInitialized = useRef(false);

  const [claimAmount, setClaimAmount] = useState<string>('');
  const [interestAmount, setInterestAmount] = useState<string>('');
  const [submissionMethod, setSubmissionMethod] = useState<'online' | 'paper'>('online');
  const [showHelpWithFees, setShowHelpWithFees] = useState(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      if (defaultAmount > 0) setClaimAmount(String(defaultAmount));
      if (defaultInterest > 0) setInterestAmount(String(defaultInterest));
      if (currentClaim?.submissionMethod) setSubmissionMethod(currentClaim.submissionMethod);
      hasInitialized.current = true;
    }
  }, [defaultAmount, defaultInterest, currentClaim?.submissionMethod]);

  const numericClaimAmount = parseFloat(claimAmount) || 0;
  const numericInterestAmount = parseFloat(interestAmount) || 0;

  const feeBreakdown = useMemo(
    () => calculateTotalFees(numericClaimAmount, numericInterestAmount, submissionMethod),
    [numericClaimAmount, numericInterestAmount, submissionMethod]
  );

  const totalClaim = numericClaimAmount + numericInterestAmount;
  const currentBracket = FEE_BRACKETS.find(
    (b) => totalClaim >= b.min && totalClaim <= b.max
  );
  // Hearing fee bracket tracked for display

  const incomeThresholds = [
    { status: 'Single, under 25', monthly: 1085, annual: 13020 },
    { status: 'Single, 25 or over', monthly: 1380, annual: 16560 },
    { status: 'Couple, both under 25', monthly: 1700, annual: 20400 },
    { status: "Couple, one or both 25+", monthly: 2140, annual: 25680 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Calculator</h1>
          <p className="text-gray-600 dark:text-gray-400">Calculate court fees for your claim</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <PoundSterling className="w-5 h-5" />
            Claim Details
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Claim Amount (£)
            </label>
            <input
              type="number"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              placeholder="Enter claim amount"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Interest Amount (£) <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="number"
              value={interestAmount}
              onChange={(e) => setInterestAmount(e.target.value)}
              placeholder="Enter interest amount"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Submission Method
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setSubmissionMethod('online')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  submissionMethod === 'online'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Monitor className="w-5 h-5" />
                Online
              </button>
              <button
                onClick={() => setSubmissionMethod('paper')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  submissionMethod === 'paper'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <FileText className="w-5 h-5" />
                Paper
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Fee Breakdown
          </h2>

          {totalClaim > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total Claim Value</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  £{totalClaim.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Court Fee</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  £{feeBreakdown.courtFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Hearing Fee</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  £{feeBreakdown.hearingFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4">
                <span className="font-semibold text-blue-900 dark:text-blue-100">Total Fees</span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  £{feeBreakdown.total.toFixed(2)}
                </span>
              </div>
              {currentBracket && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fee bracket: £{currentBracket.min.toFixed(2)} - £{currentBracket.max.toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Enter a claim amount to calculate fees</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Claim Amount Range
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Online Court Fee
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Paper Court Fee
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Hearing Fee
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {FEE_BRACKETS.map((bracket, index) => {
                const hearingFee = calculateHearingFee(bracket.min);
                const isActive =
                  totalClaim >= bracket.min && totalClaim <= bracket.max;
                return (
                  <tr
                    key={index}
                    className={
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      £{bracket.min.toFixed(2)} - £{bracket.max.toFixed(2)}
                      {isActive && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          (Your bracket)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      £{bracket.onlineFee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      £{bracket.paperFee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      £{hearingFee.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                  Over £10,000
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">5%</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">5%</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">£171</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <button
          onClick={() => setShowHelpWithFees(!showHelpWithFees)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Help with Fees
          </h2>
          <span className="flex items-center justify-center w-8 h-8 text-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full border-2 border-gray-300 dark:border-gray-500 shadow-sm">
            {showHelpWithFees ? '−' : '+'}
          </span>
        </button>

        {showHelpWithFees && (
          <div className="mt-4 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                EX160 Form - Help with Fees
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                You may be eligible for help with court fees if you're on a low income or receive
                certain benefits. Apply using form EX160.
              </p>
              <a
                href="https://www.gov.uk/get-help-with-court-fees"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Apply on GOV.UK
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Eligibility Checker - Income Thresholds
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                You may qualify for full or partial fee remission if your gross monthly income is
                below these thresholds:
              </p>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                      Your Status
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      Monthly Income
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      Annual Income
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {incomeThresholds.map((threshold, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-gray-900 dark:text-white">
                        {threshold.status}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                        £{threshold.monthly.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                        £{threshold.annual.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p>
                You may also qualify if you receive Universal Credit, Income Support, or other
                qualifying benefits. Check the full eligibility criteria on GOV.UK.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Clock className="w-4 h-4" />
        <span>Fees last verified: {getFeeLastUpdated()}</span>
        <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
      </div>
    </div>
  );
}