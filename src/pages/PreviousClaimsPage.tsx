import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';

export const PreviousClaimsPage = () => {
  const navigate = useNavigate();
  const claims = useAppStore((state) => state.claims);
  const deleteClaim = useAppStore((state) => state.deleteClaim);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await deleteClaim(id);
    setConfirmingId(null);
  };

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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{claim.defendant.fullName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amount: £{claim.claimAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status: {claim.status}</p>
                </div>
                {confirmingId === claim.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      onClick={() => handleDelete(claim.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    aria-label={`Delete claim against ${claim.defendant.fullName}`}
                    onClick={() => setConfirmingId(claim.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              {confirmingId === claim.id && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Delete this claim? This cannot be undone.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
