import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Info, FileText, Lightbulb, ArrowRight, Download } from 'lucide-react';

export const MediationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'prepare' | 'statement'>('overview');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mediation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Resolve your dispute through free mediation before going to court</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {(['overview', 'prepare', 'statement'] as const).map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">What is Mediation?</h3>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Mediation is a voluntary process where an impartial mediator helps both parties reach a mutually acceptable agreement. 
                  It's free through the Small Claims Mediation Service, quicker than a hearing, and keeps you in control of the outcome.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Benefits of Mediation</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>Free of charge</li>
                    <li>Faster than court hearings</li>
                    <li>You control the outcome</li>
                    <li>Less stressful than court</li>
                    <li>Agreements are legally binding</li>
                    <li>Can be done by phone</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">When Mediation Works Best</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>Both parties are willing to talk</li>
                    <li>There is room for compromise</li>
                    <li>You want to preserve a relationship</li>
                    <li>The dispute is straightforward</li>
                    <li>You want a quick resolution</li>
                    <li>Costs are a concern</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">How the Process Works</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Court Offers Mediation', desc: 'The court will ask both parties if they want to try mediation' },
                { step: 2, title: 'Both Parties Agree', desc: 'If both sides agree, the case is referred to the Small Claims Mediation Service' },
                { step: 3, title: 'Mediator Contacts You', desc: 'A trained mediator will contact both parties to discuss the dispute' },
                { step: 4, title: 'Mediation Session', desc: 'The mediator helps you negotiate - usually by phone, takes about 1-2 hours' },
                { step: 5, title: 'Outcome', desc: 'If agreement reached, it is legally binding. If not, case proceeds to hearing' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prepare' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Mediation Preparation Checklist</h2>
            <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <ArrowRight className="w-4 h-4" />
                <span>Checked items will be included in your Position Statement</span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                'Review all your evidence and documents',
                'Know exactly what you want to achieve',
                'Consider what you are willing to compromise on',
                'Prepare a brief summary of your case',
                'List your key points in priority order',
                'Think about the other party\'s perspective',
                'Bring copies of all relevant documents',
                'Be prepared to listen and be flexible',
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  <FileText className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                </label>
              ))}
            </div>
          </div>

          <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Tips for Successful Mediation</h3>
            <ul className="space-y-2 text-green-700 dark:text-green-300">
              <li>Stay calm and professional throughout</li>
              <li>Focus on the facts, not emotions</li>
              <li>Be willing to compromise - perfection is rarely achievable</li>
              <li>Listen carefully to the other party's position</li>
              <li>Keep your expectations realistic</li>
              <li>Remember: any agreement is legally binding</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'statement' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Mediation Position Statement</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A position statement helps the mediator understand your case. Fill in the sections below to prepare yours.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brief Summary of the Dispute
              </label>
              <textarea className="input-field" rows={4} placeholder="Explain what happened and why you are making this claim..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What You Want to Achieve
              </label>
              <textarea className="input-field" rows={3} placeholder="Describe your ideal outcome..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What You Are Willing to Compromise On
              </label>
              <textarea className="input-field" rows={3} placeholder="List areas where you could be flexible..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key Evidence Summary
              </label>
              <textarea className="input-field" rows={3} placeholder="Summarise your strongest evidence..." />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="btn-primary">
              <FileText className="w-4 h-4 mr-2" />
              Save Position Statement
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" />
              Print / Download
            </button>
          </div>
        </div>
      )}

      {activeTab === 'statement' && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">After Mediation</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/tracker')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mediation Complete - Go to Tracker
            </button>
            <button
              onClick={() => navigate('/hearing')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Prepare for Hearing
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          className="btn-secondary"
          onClick={() => {
            if (activeTab === 'prepare') setActiveTab('overview');
            else if (activeTab === 'statement') setActiveTab('prepare');
          }}
          disabled={activeTab === 'overview'}
        >
          Previous
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            if (activeTab === 'overview') setActiveTab('prepare');
            else if (activeTab === 'prepare') setActiveTab('statement');
          }}
          disabled={activeTab === 'statement'}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}