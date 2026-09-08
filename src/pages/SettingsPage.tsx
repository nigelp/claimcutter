import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Moon, Sun, Download, Upload, Trash2, Shield, Info, Database, User, Clock, Edit2, Save, X } from 'lucide-react';
import { useAppStore } from '../store';
import { exportAllData, importClaims } from '../services/storage';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { userProfileSchema, emptyUserProfile, type UserProfileSchema } from '../schemas';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export const SettingsPage = () => {
  const { darkMode, setDarkMode, claims, userProfile, setUserProfile, clearUserProfile } = useAppStore();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmClearProfile, setShowConfirmClearProfile] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [clearProfileSuccess, setClearProfileSuccess] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<UserProfileSchema>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: userProfile ?? emptyUserProfile(),
  });

  useEffect(() => {
    profileForm.reset(userProfile ?? emptyUserProfile());
  }, [userProfile, profileForm]);

  const handleEditProfile = () => {
    profileForm.reset(userProfile ?? emptyUserProfile());
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    profileForm.reset(userProfile ?? emptyUserProfile());
    setIsEditingProfile(false);
  };

  const handleSaveProfile = profileForm.handleSubmit((data) => {
    setUserProfile({ ...data, lastUpdated: new Date().toISOString() });
    setIsEditingProfile(false);
    setSaveProfileSuccess(true);
    setTimeout(() => setSaveProfileSuccess(false), 3000);
  });

  const handleExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claimcutter-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess(false);
    try {
      const data: unknown = JSON.parse(await readFileAsText(file));
      if (
        !Array.isArray(data) ||
        data.some((c) => !c || typeof (c as { id?: unknown }).id !== 'string')
      ) {
        throw new Error('Invalid file: expected a ClaimCutter export (JSON array of claims).');
      }
      await importClaims(data as Parameters<typeof importClaims>[0]);
      await useAppStore.getState().loadClaims();
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import data.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteAll = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    localStorage.clear();
    indexedDB.deleteDatabase('claimcutter-db');
    window.location.reload();
  };

  const handleClearUserProfile = () => {
    setShowConfirmClearProfile(true);
  };

  const confirmClearUserProfile = () => {
    clearUserProfile();
    setShowConfirmClearProfile(false);
    setClearProfileSuccess(true);
    setTimeout(() => setClearProfileSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <span className="page-folio">Preferences &amp; privacy</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your app preferences and data</p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5" />
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <button
              className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-surface-container-highest'}`}
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={darkMode}
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-7' : ''}`}>
                {darkMode ? <Moon className="w-4 h-4 m-1 text-primary-500" /> : <Sun className="w-4 h-4 m-1 text-amber-500" />}
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Saved Personal Details
            </h2>
            {!isEditingProfile && (
              <button
                type="button"
                onClick={handleEditProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {userProfile ? 'Edit' : 'Add Details'}
              </button>
            )}
          </div>

          {!userProfile && !isEditingProfile && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No saved personal details yet. Click "Add Details" to save your information so forms can auto-fill across the app.
            </p>
          )}

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" {...profileForm.register('fullName')} className="input-field" placeholder="Enter your full name" />
                {profileForm.formState.errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 1</label>
                <input type="text" {...profileForm.register('address.line1')} className="input-field" placeholder="Street address" />
                {profileForm.formState.errors.address?.line1 && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.address.line1.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 2 (Optional)</label>
                <input type="text" {...profileForm.register('address.line2')} className="input-field" placeholder="Apartment, suite, etc." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input type="text" {...profileForm.register('address.city')} className="input-field" placeholder="City" />
                  {profileForm.formState.errors.address?.city && (
                    <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.address.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postcode</label>
                  <input type="text" {...profileForm.register('address.postcode')} className="input-field" placeholder="Postcode" />
                  {profileForm.formState.errors.address?.postcode && (
                    <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.address.postcode.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">County (Optional)</label>
                <input type="text" {...profileForm.register('address.county')} className="input-field" placeholder="County" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <select {...profileForm.register('address.country')} className="input-field">
                  <option value="England">England</option>
                  <option value="Wales">Wales</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input type="tel" {...profileForm.register('phone')} className="input-field" placeholder="Phone number" />
                {profileForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" {...profileForm.register('email')} className="input-field" placeholder="Email address" />
                {profileForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary inline-flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Details
                </button>
                <button type="button" onClick={handleCancelEdit} className="btn-secondary inline-flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          ) : userProfile ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 break-words">{userProfile.fullName || <span className="text-gray-400 italic">Not set</span>}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 break-words">{userProfile.phone || <span className="text-gray-400 italic">Not set</span>}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg sm:col-span-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Address</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 break-words">
                    {[userProfile.address.line1, userProfile.address.line2, userProfile.address.city, userProfile.address.county, userProfile.address.postcode, userProfile.address.country].filter(Boolean).join(', ') || <span className="text-gray-400 italic">Not set</span>}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg sm:col-span-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 break-words">{userProfile.email || <span className="text-gray-400 italic">Not set</span>}</p>
                </div>
              </div>
              {userProfile.lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Last updated {formatDistanceToNow(parseISO(userProfile.lastUpdated), { addSuffix: true })}</span>
                </div>
              )}
            </div>
          ) : null}

          {saveProfileSuccess && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
              Personal details saved. Forms across the app will auto-fill from these values.
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <p className="font-medium">Active Claims</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{claims.length} claim{claims.length !== 1 ? 's' : ''} stored locally</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button className="btn-secondary" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </button>
              <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImport}
                className="hidden"
                aria-label="Import data file"
              />
              <button
                onClick={handleClearUserProfile}
                disabled={!userProfile}
                className="px-4 py-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Clear Saved Details
              </button>
              <button className="btn-danger" onClick={handleDeleteAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </button>
            </div>

            {showConfirmClearProfile && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-3">
                  This will wipe your saved personal details. Forms will no longer auto-fill. Continue?
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors" onClick={confirmClearUserProfile}>
                    Yes, Clear Details
                  </button>
                  <button className="btn-secondary" onClick={() => setShowConfirmClearProfile(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {clearProfileSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                Saved personal details have been cleared.
              </div>
            )}

            {showConfirmDelete && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="font-medium text-red-800 dark:text-red-200 mb-3">Are you sure? This cannot be undone.</p>
                <div className="flex gap-3">
                  <button className="btn-danger" onClick={confirmDelete}>Yes, Delete Everything</button>
                  <button className="btn-secondary" onClick={() => setShowConfirmDelete(false)}>Cancel</button>
                </div>
              </div>
            )}

            {exportSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                Data exported successfully!
              </div>
            )}

            {importSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                Data imported successfully!
              </div>
            )}

            {importError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                {importError}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </h2>
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            <p>All your data is stored locally on your device. Nothing is sent to external servers.</p>
            <p>You can export or delete your data at any time.</p>
            <p>This app is GDPR compliant.</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            About ClaimCutter
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Fee data last verified</span>
              <span className="font-medium">April 2025</span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ClaimCutter provides information and guidance based on publicly available government sources. 
                It does not constitute legal advice. For complex cases, please seek professional legal advice.
              </p>
              <div className="mt-3 flex gap-3">
                <a href="https://www.gov.uk/make-court-claim-for-money" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  GOV.UK Small Claims
                </a>
                <a href="https://www.citizensadvice.org.uk/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  Citizens Advice
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}