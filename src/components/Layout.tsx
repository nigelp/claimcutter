import { useState } from 'react';
import { useAppStore } from '../store';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import {
  Home,
  CheckCircle,
  FileText,
  PlusCircle,
  Calculator,
  Clock,
  Users,
  Gavel,
  Shield,
  FolderCog,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/eligibility', label: 'Eligibility', icon: CheckCircle },
  { path: '/pre-claim', label: 'Pre-Claim', icon: FileText },
  { path: '/claim-builder', label: 'Claim Builder', icon: PlusCircle },
  { path: '/mediation', label: 'Mediation', icon: Users },
  { path: '/hearing', label: 'Hearing Prep', icon: Gavel },
  { path: '/enforcement', label: 'Enforcement', icon: Shield },
  { path: '/fee-calculator', label: 'Fee Calculator', icon: Calculator },
  { path: '/tracker', label: 'Tracker', icon: Clock },
  { path: '/claims', label: 'Previous Claims', icon: FolderCog },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const stepOrder = ['/', '/eligibility', '/pre-claim', '/claim-builder', '/mediation', '/hearing', '/enforcement', '/fee-calculator', '/tracker', '/claims'];

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const darkMode = useAppStore((state) => state.darkMode);
  const setDarkMode = useAppStore((state) => state.setDarkMode);
  const location = useLocation();

  const currentStepIndex = stepOrder.indexOf(location.pathname);
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / stepOrder.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gavel className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">ClaimCutter</span>
            </div>
            <button
              className="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>Step {currentStepIndex + 1} of {stepOrder.length}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {navItems[currentStepIndex]?.label || 'Home'}
                </span>
              </div>
            </div>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}