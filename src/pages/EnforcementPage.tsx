import { useState } from 'react';
import { Shield, AlertTriangle, PoundSterling, Building, Lock, ExternalLink, Download, BookOpen } from 'lucide-react';

interface EnforcementOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  fee: number;
  whenToUse: string;
  form: string;
  formUrl: string;
}

const ENFORCEMENT_OPTIONS: EnforcementOption[] = [
  {
    id: 'warrant_of_control',
    name: 'Warrant of Control',
    icon: <Shield className="w-8 h-8" />,
    description: 'Bailiffs (enforcement agents) are sent to seize and sell the defendant\'s goods to pay the debt.',
    fee: 99,
    whenToUse: 'When the defendant has goods of value that can be seized and sold.',
    form: 'N323',
    formUrl: 'https://www.gov.uk/government/publications/form-n323-request-for-warrant-of-control',
  },
  {
    id: 'attachment_of_earnings',
    name: 'Attachment of Earnings',
    icon: <PoundSterling className="w-8 h-8" />,
    description: 'Money is deducted directly from the defendant\'s wages by their employer and paid to you.',
    fee: 110,
    whenToUse: 'When the defendant is employed (not self-employed) and you know their employer\'s details.',
    form: 'N337',
    formUrl: 'https://www.gov.uk/government/publications/form-n337-request-for-attachment-of-earnings-order',
  },
  {
    id: 'third_party_debt_order',
    name: 'Third Party Debt Order',
    icon: <Building className="w-8 h-8" />,
    description: 'Money is frozen and taken directly from the defendant\'s bank or building society account.',
    fee: 110,
    whenToUse: 'When you know the defendant\'s bank account details (bank name, sort code, account number).',
    form: 'N349',
    formUrl: 'https://www.gov.uk/government/publications/form-n349-application-for-third-party-debt-order',
  },
  {
    id: 'charging_order',
    name: 'Charging Order',
    icon: <Lock className="w-8 h-8" />,
    description: 'The debt is secured against the defendant\'s property or land. You get paid when the property is sold.',
    fee: 275,
    whenToUse: 'For larger debts (£5,000+) where the defendant owns property or land.',
    form: 'N379',
    formUrl: 'https://www.gov.uk/government/publications/form-n379-application-for-charging-order-on-land-cpr-part-73',
  },
];

export const EnforcementPage = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enforcement</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Options for collecting money after winning your claim</p>
      </div>

      {/* EX321 Guide - Prominent */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Official Government Guide</h3>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Before choosing an enforcement method, read the official guide:
            </p>
            <a
              href="https://www.gov.uk/government/publications/what-to-do-if-a-defendant-doesnt-pay-money-after-judgment-ex321/what-to-do-if-you-have-a-judgement-but-the-defendant-has-not-paid-ex321"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Read EX321 - What to do if the defendant doesn't pay
            </a>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Also see: <a href="https://www.gov.uk/government/publications/ex322-enforcement-of-judgments" target="_blank" rel="noopener noreferrer" className="underline">EX322 (Enforcement of judgments)</a> and <a href="https://www.gov.uk/government/publications/ex324-how-to-enforce-a-judgment" target="_blank" rel="noopener noreferrer" className="underline">EX324 (How to enforce)</a>
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Important</h3>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              You can only apply for enforcement if you have a judgment and the defendant has not paid within the specified timeframe.
              Each enforcement method has its own fee, which you pay upfront but can add to the amount owed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {ENFORCEMENT_OPTIONS.map(option => (
          <button
            key={option.id}
            className={`card text-left transition-all hover:shadow-md ${
              selectedOption === option.id ? 'ring-2 ring-primary-500' : ''
            }`}
            onClick={() => setSelectedOption(option.id)}
          >
            <div className="flex items-start gap-3">
              <div className="text-primary-500">{option.icon}</div>
              <div>
                <h3 className="font-semibold">{option.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.description}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-gray-500">Fee: <strong>£{option.fee}</strong></span>
                  <span className="text-gray-500">Form: <strong>{option.form}</strong></span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedOption && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            {ENFORCEMENT_OPTIONS.find(o => o.id === selectedOption)?.name} - Application Guide
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">When to Use This Method</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {ENFORCEMENT_OPTIONS.find(o => o.id === selectedOption)?.whenToUse}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Steps to Apply</h3>
              <ol className="space-y-3">
                {[
                  `Complete form ${ENFORCEMENT_OPTIONS.find(o => o.id === selectedOption)?.form}`,
                  'Pay the enforcement fee (£' + ENFORCEMENT_OPTIONS.find(o => o.id === selectedOption)?.fee + ')',
                  'Submit the form to the court that made the judgment',
                  'Wait for the court to process your application',
                  'The enforcement action will be carried out',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <a
                href={ENFORCEMENT_OPTIONS.find(o => o.id === selectedOption)?.formUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Form {ENFORCEMENT_OPTIONS.find(o => o.id === selectedOption)?.form}
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Applications must be submitted directly to the court that made the judgment.
                  Complete the form and send it with the fee to the court.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}