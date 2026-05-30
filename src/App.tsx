import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { WelcomePage } from './pages/WelcomePage';
import { EligibilityPage } from './pages/EligibilityPage';
import PreClaimPage from './pages/PreClaimPage';
import ClaimBuilderPage from './pages/ClaimBuilderPage';
import FeeCalculatorPage from './pages/FeeCalculatorPage';
import SubmissionGuidePage from './pages/SubmissionGuidePage';
import { ClaimTrackerPage } from './pages/ClaimTrackerPage';
import { MediationPage } from './pages/MediationPage';
import { HearingPrepPage } from './pages/HearingPrepPage';
import { PreviousClaimsPage } from './pages/PreviousClaimsPage';
import { EnforcementPage } from './pages/EnforcementPage';
import { SettingsPage } from './pages/SettingsPage';
import { DisclaimerModal } from './components/DisclaimerModal';
import { useAppStore } from './store';

function App() {
  useEffect(() => {
    useAppStore.getState().loadClaims();
  }, []);
  return (
    <>
      <DisclaimerModal />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WelcomePage />} />
          <Route path="eligibility" element={<EligibilityPage />} />
          <Route path="pre-claim" element={<PreClaimPage />} />
          <Route path="claim-builder" element={<ClaimBuilderPage />} />
          <Route path="fee-calculator" element={<FeeCalculatorPage />} />
          <Route path="submission" element={<SubmissionGuidePage />} />
          <Route path="tracker" element={<ClaimTrackerPage />} />
          <Route path="claims" element={<PreviousClaimsPage />} />
          <Route path="mediation" element={<MediationPage />} />
          <Route path="hearing" element={<HearingPrepPage />} />
          <Route path="enforcement" element={<EnforcementPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;