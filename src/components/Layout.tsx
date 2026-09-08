import { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useAppStore } from '../store';
import { Home, CheckCircle, FileText, PlusCircle, Calculator, Clock, Users, Gavel, Shield, FolderCog, Settings, Menu, X, Moon, Sun, ChevronRight, Leaf, Palette } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home }, { path: '/eligibility', label: 'Eligibility', icon: CheckCircle },
  { path: '/pre-claim', label: 'Pre-Claim', icon: FileText }, { path: '/claim-builder', label: 'Claim Builder', icon: PlusCircle },
  { path: '/mediation', label: 'Mediation', icon: Users }, { path: '/hearing', label: 'Hearing Prep', icon: Gavel },
  { path: '/enforcement', label: 'Enforcement', icon: Shield }, { path: '/fee-calculator', label: 'Fee Calculator', icon: Calculator },
  { path: '/tracker', label: 'Tracker', icon: Clock }, { path: '/claims', label: 'Previous Claims', icon: FolderCog },
  { path: '/settings', label: 'Settings', icon: Settings },
];
const stepOrder = ['/', '/eligibility', '/pre-claim', '/claim-builder', '/mediation', '/hearing', '/enforcement', '/fee-calculator', '/tracker', '/claims'];

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accent, setAccentState] = useState<'slate' | 'green'>(() => document.documentElement.dataset.accent === 'green' ? 'green' : 'slate');
  const darkMode = useAppStore((state) => state.darkMode);
  const setDarkMode = useAppStore((state) => state.setDarkMode);
  const location = useLocation();
  const currentStepIndex = stepOrder.indexOf(location.pathname);
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / stepOrder.length) * 100 : 0;
  const currentLabel = navItems.find((item) => item.path === location.pathname)?.label ?? 'ClaimCutter';
  const setAccent = (value: 'slate' | 'green') => { document.documentElement.dataset.accent = value; localStorage.setItem('claimcutter-accent', value); setAccentState(value); };
  const toggleMode = () => { const next = !darkMode; setDarkMode(next); document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#181613' : '#F7F4ED'); };

  return (
    <div className="min-h-screen bg-surface text-on-surface lg:flex">
      {sidebarOpen && <button className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[17.5rem] border-r border-outline-variant/40 bg-surface-container-lowest transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-full flex-col">
          <div className="flex min-h-24 items-center justify-between border-b border-outline-variant/40 px-5">
            <NavLink to="/" className="group flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <span className="flex h-11 w-11 items-center justify-center border border-primary-600 bg-primary-600 font-headline text-sm font-extrabold tracking-[-.08em] text-white shadow-sm transition-transform group-hover:-rotate-2">CC</span>
              <span><span className="block font-headline text-[17px] font-bold tracking-[-.04em]">ClaimCutter</span><span className="block text-[9px] font-bold uppercase tracking-[.19em] text-on-surface-variant">Small claims companion</span></span>
            </NavLink>
            <button className="grid h-10 w-10 place-items-center rounded-md text-on-surface-variant hover:bg-surface-container-low lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button>
          </div>
          <div className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[.2em] text-on-surface-variant">Your case journal</div>
          <nav className="flex-1 overflow-y-auto px-3 pb-5" aria-label="Primary navigation"><ul className="space-y-0.5">
            {navItems.map((item, index) => { const Icon = item.icon; return <li key={item.path}><NavLink to={item.path} end={item.path === '/'} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `group flex min-h-11 items-center gap-3 border-l-2 px-3 py-2 text-sm transition-colors ${isActive ? 'border-primary-600 bg-primary-50 font-semibold text-primary-700' : 'border-transparent text-on-surface-variant hover:border-outline-variant hover:bg-surface-container-low hover:text-on-surface'}`}><span className="w-4 text-[10px] tabular-nums text-on-surface-variant/70">{String(index + 1).padStart(2, '0')}</span><Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} /><span>{item.label}</span></NavLink></li>; })}
          </ul></nav>
          <div className="border-t border-outline-variant/40 p-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-on-surface-variant">Reading preferences</p><div className="flex items-center gap-1 rounded-md bg-surface-container-low p-1">
            <button type="button" onClick={() => setAccent('slate')} className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded text-xs font-semibold transition-colors ${accent === 'slate' ? 'bg-surface-container-lowest text-primary-600 shadow-sm' : 'text-on-surface-variant'}`} aria-pressed={accent === 'slate'}><Palette className="h-3.5 w-3.5" />Slate</button>
            <button type="button" onClick={() => setAccent('green')} className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded text-xs font-semibold transition-colors ${accent === 'green' ? 'bg-surface-container-lowest text-primary-600 shadow-sm' : 'text-on-surface-variant'}`} aria-pressed={accent === 'green'}><Leaf className="h-3.5 w-3.5" />Forest</button>
            <button type="button" onClick={toggleMode} className="grid h-9 w-9 shrink-0 place-items-center rounded text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          </div></div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-outline-variant/40 bg-surface/90 px-4 backdrop-blur-md sm:px-6 lg:px-8"><div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between">
          <div className="flex min-w-0 items-center gap-3"><button className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-on-surface-variant hover:bg-surface-container-low lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button><div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-on-surface-variant">E&amp;W jurisdiction · Guidance only</span><div className="mt-0.5 flex items-center gap-1.5 text-sm"><span className="hidden text-on-surface-variant sm:inline">Case journal</span><ChevronRight className="hidden h-3.5 w-3.5 text-outline sm:block" /><span className="truncate font-semibold">{currentLabel}</span></div></div></div>
          {currentStepIndex >= 0 && <span className="text-xs font-semibold tabular-nums text-on-surface-variant"><span className="sr-only">Step {currentStepIndex + 1} of {stepOrder.length}</span><span aria-hidden="true">{String(currentStepIndex + 1).padStart(2, '0')} / {stepOrder.length}</span></span>}
        </div>{currentStepIndex >= 0 && <div className="absolute inset-x-0 bottom-0 h-px bg-surface-container-high"><div className="h-full bg-primary-600 transition-all duration-500" style={{ width: `${progress}%` }} /></div>}</header>
        <main className="min-h-[calc(100vh-4.5rem)] overflow-hidden"><Outlet /></main>
      </div>
    </div>
  );
};