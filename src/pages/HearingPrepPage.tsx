import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, ListChecks, BookOpen, Download, Save, RefreshCw, Gavel } from 'lucide-react';
import { useAppStore } from '../store';
import { Claim, HearingDetails, HearingChecklistItems } from '../types';
import {
  generateChronology,
  generateBundleIndex,
  generateSkeletonArgumentTemplate,
  getDefaultChecklist,
  exportToPrintableHtml,
} from '../utils/hearingPrep';
import { format } from 'date-fns';

type TabId = 'details' | 'summary' | 'skeleton' | 'chronology' | 'bundle' | 'checklist';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'details', label: 'Hearing Details', icon: <Calendar className="w-4 h-4" /> },
  { id: 'summary', label: 'Case Summary', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'skeleton', label: 'Skeleton Argument', icon: <Gavel className="w-4 h-4" /> },
  { id: 'chronology', label: 'Chronology', icon: <ListChecks className="w-4 h-4" /> },
  { id: 'bundle', label: 'Bundle Index', icon: <FileText className="w-4 h-4" /> },
  { id: 'checklist', label: 'Checklist', icon: <ListChecks className="w-4 h-4" /> },
];

const HEARING_TYPES = [
  { value: 'in_person', label: 'In Person' },
  { value: 'video', label: 'Video' },
  { value: 'telephone', label: 'Telephone' },
  { value: 'paper', label: 'Paper (on documents only)' },
] as const;

export const HearingPrepPage = () => {
  const navigate = useNavigate();
  const { currentClaimId, claims, updateHearingDetails } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>('details');

  const currentClaim = claims.find((c) => c.id === currentClaimId);
  const hearingDetails = (currentClaim?.hearingDetails || {}) as HearingDetails;

  const [formData, setFormData] = useState<Partial<HearingDetails>>({
    type: hearingDetails.type || 'in_person',
    date: hearingDetails.date || '',
    time: hearingDetails.time || '',
    location: hearingDetails.location || '',
    link: hearingDetails.link || '',
    notes: hearingDetails.notes || '',
    caseSummary: hearingDetails.caseSummary || '',
    skeletonArgument: hearingDetails.skeletonArgument || '',
    openingStatement: hearingDetails.openingStatement || '',
    closingStatement: hearingDetails.closingStatement || '',
    witnessStatement: hearingDetails.witnessStatement || '',
    questionsForJudge: hearingDetails.questionsForJudge || [],
    hearingChecklist: hearingDetails.hearingChecklist || getDefaultChecklist(),
    bundleDocumentIds: hearingDetails.bundleDocumentIds || currentClaim?.documents.map(d => d.id) || [],
  });

  const [skeletonText, setSkeletonText] = useState(hearingDetails.skeletonArgument || '');
  const [caseSummaryText, setCaseSummaryText] = useState(hearingDetails.caseSummary || '');
  const [newQuestion, setNewQuestion] = useState('');

  const autoChronology = currentClaim ? generateChronology(currentClaim) : [];
  const autoBundle = currentClaim ? generateBundleIndex(currentClaim.documents) : [];

  const handleSave = useCallback(async () => {
    if (!currentClaimId) return;
    await updateHearingDetails(currentClaimId, {
      ...formData,
      caseSummary: caseSummaryText,
      skeletonArgument: skeletonText,
    });
  }, [currentClaimId, formData, caseSummaryText, skeletonText, updateHearingDetails]);

  const handleAutoFillSkeleton = useCallback(() => {
    if (currentClaim) {
      const template = generateSkeletonArgumentTemplate(currentClaim);
      setSkeletonText(template);
      setFormData(prev => ({ ...prev, skeletonArgument: template }));
    }
  }, [currentClaim]);

  const handleExportHtml = useCallback((title: string, content: string) => {
    const html = exportToPrintableHtml({ title, body: content });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleChecklistToggle = useCallback((key: keyof HearingChecklistItems) => {
    setFormData(prev => {
      const checklist = { ...(prev.hearingChecklist || getDefaultChecklist()) };
      checklist[key] = !checklist[key];
      return { ...prev, hearingChecklist: checklist };
    });
  }, []);

  const handleAddQuestion = useCallback(() => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questionsForJudge: [...(prev.questionsForJudge || []), newQuestion.trim()],
      }));
      setNewQuestion('');
    }
  }, [newQuestion]);

  const handleRemoveQuestion = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      questionsForJudge: prev.questionsForJudge?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  useEffect(() => {
    if (currentClaim?.documents) {
      setFormData(prev => ({
        ...prev,
        bundleDocumentIds: prev.bundleDocumentIds || currentClaim.documents.map(d => d.id),
      }));
    }
  }, [currentClaim?.documents]);

  if (!currentClaim) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400">No claim selected. Please create or select a claim first.</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hearing Preparation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Prepare your case for the hearing</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <HearingDetailsTab
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
        />
      )}

      {activeTab === 'summary' && (
        <CaseSummaryTab
          autoSummary={currentClaim ? generateCaseSummaryText(currentClaim) : ''}
          summaryText={caseSummaryText}
          setSummaryText={setCaseSummaryText}
          onSave={handleSave}
          onExport={() => handleExportHtml('Case_Summary', caseSummaryText)}
        />
      )}

      {activeTab === 'skeleton' && (
        <SkeletonArgumentTab
          skeletonText={skeletonText}
          setSkeletonText={setSkeletonText}
          onAutoFill={handleAutoFillSkeleton}
          onSave={handleSave}
          onExport={() => handleExportHtml('Skeleton_Argument', skeletonText)}
        />
      )}

      {activeTab === 'chronology' && (
        <ChronologyTab
          chronology={autoChronology}
          onExport={() => handleExportHtml('Chronology', formatChronology(autoChronology))}
        />
      )}

      {activeTab === 'bundle' && (
        <BundleTab
          bundle={autoBundle}
          selectedIds={formData.bundleDocumentIds || []}
          documents={currentClaim.documents}
          onExport={() => handleExportHtml('Bundle_Index', formatBundle(autoBundle))}
        />
      )}

      {activeTab === 'checklist' && (
        <ChecklistTab
          checklist={formData.hearingChecklist || getDefaultChecklist()}
          onToggle={handleChecklistToggle}
          questions={formData.questionsForJudge || []}
          newQuestion={newQuestion}
          setNewQuestion={setNewQuestion}
          onAddQuestion={handleAddQuestion}
          onRemoveQuestion={handleRemoveQuestion}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

const HearingDetailsTab = ({
  formData,
  setFormData,
  onSave,
}: {
  formData: Partial<HearingDetails>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<HearingDetails>>>;
  onSave: () => void;
}) => (
  <div className="space-y-6">
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Hearing Details</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hearing Type
          </label>
          <select
            className="input-field"
            value={formData.type || 'in_person'}
            onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as HearingDetails['type'] }))}
          >
            {HEARING_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              className="input-field"
              value={formData.date || ''}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time
            </label>
            <input
              type="time"
              className="input-field"
              value={formData.time || ''}
              onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
            />
          </div>
        </div>
        {formData.type === 'in_person' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Court Location
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., County Court at Central London"
              value={formData.location || ''}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>
        )}
        {(formData.type === 'video' || formData.type === 'telephone') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {formData.type === 'video' ? 'Video Link' : 'Dial-in Number'}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={formData.type === 'video' ? 'https://...' : 'Phone number'}
              value={formData.link || ''}
              onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Any additional notes about the hearing..."
            value={formData.notes || ''}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </div>
      <div className="mt-6">
        <button className="btn-primary" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Details
        </button>
      </div>
    </div>
  </div>
);

const CaseSummaryTab = ({
  autoSummary,
  summaryText,
  setSummaryText,
  onSave,
  onExport,
}: {
  autoSummary: string;
  summaryText: string;
  setSummaryText: (text: string) => void;
  onSave: () => void;
  onExport: () => void;
}) => (
  <div className="space-y-6">
    <div className="card">
      <h2 className="text-lg font-semibold mb-2">Case Summary</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        A brief overview of your case. You can edit the auto-generated summary below.
      </p>
      <textarea
        className="input-field"
        rows={8}
        value={summaryText || autoSummary}
        onChange={e => setSummaryText(e.target.value)}
        placeholder="Summary of your case..."
      />
      <div className="mt-4 flex gap-3">
        <button className="btn-primary" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </button>
        <button className="btn-secondary" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>
    </div>
  </div>
);

const SkeletonArgumentTab = ({
  skeletonText,
  setSkeletonText,
  onAutoFill,
  onSave,
  onExport,
}: {
  skeletonText: string;
  setSkeletonText: (text: string) => void;
  onAutoFill: () => void;
  onSave: () => void;
  onExport: () => void;
}) => (
  <div className="space-y-6">
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Skeleton Argument</h2>
        <button className="btn-secondary" onClick={onAutoFill}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Auto-fill Template
        </button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        A skeleton argument is a written summary of your case for the judge. Click "Auto-fill Template" to generate a starting point, then edit as needed.
      </p>
      <textarea
        className="input-field font-mono text-sm"
        rows={20}
        value={skeletonText}
        onChange={e => setSkeletonText(e.target.value)}
        placeholder="Click 'Auto-fill Template' to generate a skeleton argument..."
      />
      <div className="mt-4 flex gap-3">
        <button className="btn-primary" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </button>
        <button className="btn-secondary" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export as HTML
        </button>
      </div>
    </div>
  </div>
);

const ChronologyTab = ({
  chronology,
  onExport,
}: {
  chronology: { date: string; title: string; description: string; source: string }[];
  onExport: () => void;
}) => (
  <div className="space-y-6">
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chronology of Events</h2>
        <button className="btn-secondary" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Auto-generated from your claim timeline, documents, and key dates.
      </p>
      {chronology.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No events to display.</p>
      ) : (
        <div className="space-y-3">
          {chronology.map((entry, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {entry.date ? format(new Date(entry.date), 'dd MMM yyyy') : 'No date'}
              </div>
              <div>
                <div className="font-medium">{entry.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{entry.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const BundleTab = ({
  bundle,
  onExport,
}: {
  bundle: { index: number; name: string; category: string; uploadedAt: string; notes?: string }[];
  selectedIds?: string[];
  documents?: { id: string; name: string; category: string }[];
  onExport: () => void;
}) => (
  <div className="space-y-6">
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Bundle Index</h2>
        <button className="btn-secondary" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Index of all documents for the hearing bundle.
      </p>
      {bundle.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No documents in bundle.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">#</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Document</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Category</th>
              </tr>
            </thead>
            <tbody>
              {bundle.map(entry => (
                <tr key={entry.index} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-3">{entry.index}</td>
                  <td className="py-2 px-3">{entry.name}</td>
                  <td className="py-2 px-3 capitalize">{entry.category.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

const ChecklistTab = ({
  checklist,
  onToggle,
  questions,
  newQuestion,
  setNewQuestion,
  onAddQuestion,
  onRemoveQuestion,
  onSave,
}: {
  checklist: HearingChecklistItems;
  onToggle: (key: keyof HearingChecklistItems) => void;
  questions: string[];
  newQuestion: string;
  setNewQuestion: (q: string) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (i: number) => void;
  onSave: () => void;
}) => {
  const checklistItems: { key: keyof HearingChecklistItems; label: string }[] = [
    { key: 'broughtAllDocuments', label: 'Brought all original documents' },
    { key: 'broughtCopiesForJudge', label: 'Brought copies for the judge' },
    { key: 'broughtCopiesForDefendant', label: 'Brought copies for the defendant' },
    { key: 'preparedTimeline', label: 'Prepared chronology/timeline' },
    { key: 'calculatedInterestToDate', label: 'Calculated interest up to hearing date' },
    { key: 'reviewedDefendantResponse', label: 'Reviewed defendant\'s response' },
    { key: 'preparedOpeningStatement', label: 'Prepared opening statement' },
    { key: 'preparedQuestionsForWitnesses', label: 'Prepared questions for witnesses' },
    { key: 'dressedAppropriately', label: 'Dressed appropriately for court' },
    { key: 'arrivedEarly', label: 'Arrived at court early (30+ minutes)' },
  ];

  const completed = Object.values(checklist).filter(Boolean).length;
  const total = checklistItems.length;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pre-Hearing Checklist</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">{completed}/{total} completed</span>
        </div>
        <div className="space-y-2">
          {checklistItems.map(item => (
            <label
              key={item.key}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checklist[item.key] || false}
                onChange={() => onToggle(item.key)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Questions for the Judge</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Add a question..."
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAddQuestion()}
          />
          <button className="btn-primary" onClick={onAddQuestion}>Add</button>
        </div>
        {questions.length > 0 && (
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li key={i} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-sm text-gray-700 dark:text-gray-300">{q}</span>
                <button
                  onClick={() => onRemoveQuestion(i)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <button className="btn-primary" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save All
        </button>
      </div>
    </div>
  );
};

function generateCaseSummaryText(claim: Claim): string {
  const parts: string[] = [];
  parts.push(`The Claimant, ${claim.claimant.fullName}, brings this claim against the Defendant, ${claim.defendant.fullName}, for ${claim.disputeType.replace(/_/g, ' ').toLowerCase()}.`);
  if (claim.letterBeforeClaim.sent && claim.letterBeforeClaim.sentDate) {
    parts.push(`A letter before claim was sent to the Defendant on ${format(new Date(claim.letterBeforeClaim.sentDate), 'dd MMMM yyyy')} via ${claim.letterBeforeClaim.method}.`);
  }
  if (claim.defendantResponse) {
    parts.push(`The Defendant responded with a ${claim.defendantResponse.type.replace(/_/g, ' ')} on ${format(new Date(claim.defendantResponse.receivedDate), 'dd MMMM yyyy')}.`);
  }
  if (claim.mediationStatus?.completed) {
    parts.push(`Mediation was ${claim.mediationStatus.outcome === 'settled' ? 'successful and the matter was settled' : 'unsuccessful'}.`);
  }
  return parts.join(' ');
}

function formatChronology(entries: { date: string; title: string; description: string }[]): string {
  return entries.map(e => `${e.date ? format(new Date(e.date), 'dd MMM yyyy') : 'No date'} - ${e.title}: ${e.description}`).join('\n');
}

function formatBundle(entries: { index: number; name: string; category: string }[]): string {
  return entries.map(e => `${e.index}. ${e.name} (${e.category.replace('_', ' ')})`).join('\n');
}