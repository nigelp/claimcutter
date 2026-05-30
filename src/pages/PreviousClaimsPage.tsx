import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { ArrowLeft, FileText } from 'lucide-react';

export const PreviousClaimsPage = () => {
  const navigate = useNavigate();
  const claims = useAppStore((state) => state.claims);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Previous Claims</h1>
      </div>

      {claims.length === 0 ? (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No claims yet</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">You have no claims available yet. Start a new claim to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.id} className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white">{claim.defendant.fullName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Amount: £{claim.claimAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status: {claim.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}