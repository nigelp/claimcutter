import { useNavigate } from 'react-router-dom';
import { Scale, FileText, Calculator, ListChecks, ArrowRight, Shield } from 'lucide-react';

export const WelcomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: ListChecks,
      title: 'Step-by-step guidance',
      description: 'Clear, simple instructions to help you navigate the small claims process from start to finish.',
    },
    {
      icon: FileText,
      title: 'Letter generation',
      description: 'Automatically generate your Letter Before Action with all the required legal information.',
    },
    {
      icon: Calculator,
      title: 'Fee calculation',
      description: 'Calculate court fees and interest automatically based on your claim amount.',
    },
    {
      icon: Scale,
      title: 'Claim tracking',
      description: 'Track your claim progress and get reminders for important deadlines and actions.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Scale className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Make a Small Claim with Confidence
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              A free, step-by-step guide to help you navigate the UK small claims court process without needing a solicitor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/eligibility')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                Start Your Claim
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/claims')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors border border-blue-500"
              >
                View Existing Claims
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What we do section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to make a small claim
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our free tools guide you through each step of the small claims process, helping you save time and avoid common mistakes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Check eligibility', description: 'Answer a few quick questions to see if your claim qualifies for the small claims track.' },
              { step: 2, title: 'Prepare your claim', description: 'Gather your evidence, calculate fees and interest, and generate your Letter Before Action.' },
              { step: 3, title: 'Submit and track', description: 'Submit your claim to the court and track its progress with our built-in timeline.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Disclaimer:</strong> This tool provides general guidance only and does not constitute legal advice. The small claims process can be complex and the information here may not apply to your specific situation. We recommend seeking professional legal advice before proceeding with any claim.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}