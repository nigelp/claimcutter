import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, Calculator, ListChecks, Scale, ShieldCheck } from 'lucide-react';

const features = [
  { icon: ListChecks, number: '01', title: 'Step-by-step guidance', description: 'Clear instructions from your first eligibility check through to the final court stage.' },
  { icon: FileText, number: '02', title: 'Documents made clearer', description: 'Prepare a Letter Before Action and organise the facts the court will need.' },
  { icon: Calculator, number: '03', title: 'Fees worked out', description: 'Calculate court fees and statutory interest against the latest verified bands.' },
  { icon: Scale, number: '04', title: 'Your progress recorded', description: 'Keep dates, next actions and claim stages together in one private case journal.' },
];

export const WelcomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-surface">
      <section className="relative border-b border-outline-variant/40">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-surface-container-low lg:block" />
        <div className="relative mx-auto grid max-w-7xl lg:grid-cols-[1.35fr_.65fr]">
          <div className="px-5 py-16 sm:px-10 sm:py-24 lg:px-14 lg:py-28 xl:pl-20">
            <span className="page-folio">A calmer route through small claims</span>
            <h1 className="max-w-3xl font-headline text-[clamp(2.7rem,6vw,5.8rem)] font-bold leading-[.97] tracking-[-.065em] text-on-surface">Make your claim.<br /><span className="text-primary-600">Know every step.</span></h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-on-surface-variant sm:text-xl">Practical, plain-English guidance for making a money claim in England and Wales—without losing sight of what comes next.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => navigate('/eligibility')} className="btn-primary px-7">Check your eligibility <ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => navigate('/claims')} className="btn-secondary px-7">Open an existing claim</button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-outline-variant/50 pt-5 text-xs font-medium text-on-surface-variant">
              {['Free to use', 'Saved on your device', 'No solicitor required'].map((item) => <span className="flex items-center gap-2" key={item}><Check className="h-3.5 w-3.5 text-primary-600" />{item}</span>)}
            </div>
          </div>
          <aside className="flex flex-col justify-between border-t border-outline-variant/40 bg-surface-container-low px-5 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-9 lg:py-20">
            <div><span className="text-[10px] font-bold uppercase tracking-[.2em] text-on-surface-variant">Before you begin</span><div className="mt-5 h-px w-12 bg-primary-600" /><blockquote className="mt-8 font-headline text-2xl font-semibold leading-9 tracking-[-.035em]">“You do not need to know the whole process. You only need to know your next sound step.”</blockquote></div>
            <div className="mt-14 border border-outline-variant/60 bg-surface-container-lowest p-5"><ShieldCheck className="h-6 w-6 text-primary-600" strokeWidth={1.6} /><h2 className="mt-4 text-sm font-bold">Private by design</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Your claim information stays locally on this device. Nothing is sent to an external server.</p></div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-10 sm:py-24 lg:px-14 xl:px-20">
        <div className="grid gap-10 lg:grid-cols-[.55fr_1.45fr] lg:gap-20">
          <div><span className="page-folio">Your working file</span><h2 className="font-headline text-3xl font-bold leading-tight sm:text-4xl">Everything in its proper place.</h2><p className="mt-5 max-w-sm leading-7 text-on-surface-variant">A complete set of tools, organised around the real sequence of a small claim—not around legal jargon.</p></div>
          <div className="grid border-t border-outline-variant/50 sm:grid-cols-2">
            {features.map(({ icon: Icon, number, title, description }) => <article key={title} className="group border-b border-outline-variant/50 py-7 sm:odd:pr-8 sm:even:border-l sm:even:pl-8">
              <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[.18em] text-primary-600">{number}</span><Icon className="h-5 w-5 text-on-surface-variant transition-colors group-hover:text-primary-600" strokeWidth={1.5} /></div>
              <h3 className="mt-6 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-outline-variant/40 bg-surface-container-lowest"><div className="mx-auto max-w-7xl px-5 py-16 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><span className="page-folio">The process, simplified</span><h2 className="font-headline text-3xl font-bold sm:text-4xl">Three clear chapters</h2></div><button className="group flex items-center gap-2 text-sm font-bold text-primary-600" onClick={() => navigate('/eligibility')}>Begin chapter one <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></div>
        <ol className="mt-12 grid gap-px overflow-hidden border border-outline-variant/50 bg-outline-variant/50 md:grid-cols-3">
          {[['I', 'Check the facts', 'Confirm jurisdiction, claim type, amount and time limits.'], ['II', 'Prepare your case', 'Gather evidence, write formally and calculate what is owed.'], ['III', 'Submit & follow through', 'File the claim, track deadlines and prepare for what follows.']].map(([number, title, copy]) => <li key={number} className="bg-surface-container-lowest p-7 sm:p-9"><span className="font-headline text-4xl font-normal text-primary-600/50">{number}</span><h3 className="mt-8 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-on-surface-variant">{copy}</p></li>)}
        </ol>
      </div></section>
      <footer className="mx-auto flex max-w-4xl gap-4 px-5 py-10 text-xs leading-5 text-on-surface-variant"><Scale className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /><p><strong className="text-on-surface">Guidance, not legal advice.</strong> ClaimCutter provides general information and may not fit every situation. Verify information with official sources and seek professional advice for complex claims.</p></footer>
    </div>
  );
};