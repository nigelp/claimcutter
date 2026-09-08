import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Shield } from 'lucide-react';

const STORAGE_KEY = 'claimcutter_disclaimer_accepted';

export const DisclaimerModal = () => {
  const [accepted, setAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem(STORAGE_KEY);
    if (!hasAccepted) {
      setShowModal(true);
    }
  }, []);

  const handleAccept = () => {
    if (accepted) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-2xl sm:p-8">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 border border-amber-600/30 bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[.2em] text-on-surface-variant">Before you continue</p>
        <h2 id="disclaimer-title" className="text-2xl font-bold text-center text-on-surface mb-3">
          Important Disclaimer
        </h2>

        {/* Content */}
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 mb-6">
          <div className="flex items-start gap-3 border-l-2 border-primary-600 bg-primary-50 p-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-gray-900 dark:text-white">Guidance Only:</strong> This application provides general guidance for small claims in England and Wales. It does not provide legal advice.
            </p>
          </div>

          <div className="flex items-start gap-3 border-l-2 border-primary-600 bg-primary-50 p-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-gray-900 dark:text-white">Not a Solicitor:</strong> claimcutter is not a law firm and does not represent you. For legal advice, consult a qualified solicitor or Citizens Advice.
            </p>
          </div>

          <div className="flex items-start gap-3 border-l-2 border-primary-600 bg-primary-50 p-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-gray-900 dark:text-white">Verify Information:</strong> Always verify information with official sources before taking legal action.
            </p>
          </div>

          {/* Official Links */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://www.gov.uk/make-court-claim-for-money"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-4 py-2"
            >
              GOV.UK Claims Guide
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://www.citizensadvice.org.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2"
            >
              Citizens Advice
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 border border-outline-variant/50 bg-surface-container-low p-4 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-outline text-primary-600 focus:ring-primary-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            I understand this app provides guidance only and is not a substitute for professional legal advice.
          </span>
        </label>

        {/* Accept Button */}
        <button
          onClick={handleAccept}
          disabled={!accepted}
          className={`w-full min-h-12 rounded-md font-semibold transition-colors ${
            accepted
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
}