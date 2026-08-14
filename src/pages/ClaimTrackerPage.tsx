import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Calendar, Bell } from 'lucide-react';
import { useAppStore } from '../store';
import { ClaimStatus } from '../types';
import { format, addDays, differenceInDays } from 'date-fns';

const STATUS_FLOW: { status: ClaimStatus; label: string; description: string }[] = [
  { status: 'draft', label: 'Draft', description: 'Your claim is being prepared' },
  { status: 'letter_sent', label: 'Letter Before Claim Sent', description: 'Waiting for defendant response' },
  { status: 'claim_submitted', label: 'Claim Submitted', description: 'Court is processing your claim' },
  { status: 'awaiting_response', label: 'Awaiting Response', description: 'Defendant has 14 days to respond' },
  { status: 'mediation', label: 'Mediation', description: 'Attempting to resolve through mediation' },
  { status: 'hearing', label: 'Hearing Scheduled', description: 'Your case will be heard in court' },
  { status: 'judgment', label: 'Judgment', description: 'The court has made its decision' },
  { status: 'enforcement', label: 'Enforcement', description: 'Collecting the judgment amount' },
  { status: 'closed', label: 'Closed', description: 'This claim has been resolved' },
];

export const ClaimTrackerPage = () => {
  const navigate = useNavigate();
  const { claims, currentClaimId } = useAppStore();
  const [selectedClaim, setSelectedClaim] = useState<string | null>(currentClaimId);
  
  const claim = claims.find(c => c.id === selectedClaim);
  const currentStatusIndex = claim ? STATUS_FLOW.findIndex(s => s.status === claim.status) : 0;
  
  const responseDeadline = claim?.submissionDate
    ? format(addDays(new Date(claim.submissionDate), 14), 'dd MMM yyyy')
    : null;
  
  const daysUntilDeadline = claim?.submissionDate
    ? differenceInDays(addDays(new Date(claim.submissionDate), 14), new Date())
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Claim Tracker</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track the progress of your claim through the court process</p>
      </div>

      {claims.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Claims Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Start by creating your first claim</p>
          <button className="btn-primary" onClick={() => navigate('/eligibility')}>
            Start Your Claim
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Claim
            </label>
            <select
              className="input-field"
              value={selectedClaim || ''}
              onChange={(e) => setSelectedClaim(e.target.value)}
            >
              {claims.map(c => (
                <option key={c.id} value={c.id}>
                  {c.defendant.fullName} - £{c.claimAmount.toFixed(2)} ({c.status.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {claim && (
            <>
              <div className="card mb-6">
                <h2 className="text-lg font-semibold mb-4">Claim Progress</h2>
                <div className="relative">
                  {STATUS_FLOW.map((step, index) => {
                    const isCompleted = index < currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    
                    return (
                      <div key={step.status} className="flex items-start mb-6 last:mb-0">
                        <div className="flex flex-col items-center mr-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-500' : isCurrent ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : isCurrent ? (
                              <Clock className="w-6 h-6 text-white" />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-gray-500" />
                            )}
                          </div>
                          {index < STATUS_FLOW.length - 1 && (
                            <div className={`w-0.5 h-12 ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                          )}
                        </div>
                        <div className="pt-1">
                          <h3 className={`font-medium ${isCurrent ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                            {step.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200">Response Deadline</h3>
                      <p className="text-amber-700 dark:text-amber-300">
                        The defendant has {daysUntilDeadline} days remaining to respond (deadline: {responseDeadline})
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Key Dates</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="font-medium">{format(new Date(claim.createdAt), 'dd MMM yyyy')}</span>
                  </div>
                  {claim.submissionDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Submitted:</span>
                      <span className="font-medium">{format(new Date(claim.submissionDate), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                  {responseDeadline && (
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-amber-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Response Due:</span>
                      <span className="font-medium text-amber-600">{responseDeadline}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}