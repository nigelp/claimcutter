import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useAppStore } from '../../store';
import type { Address, Claim, EligibilityAnswers } from '../../types';
import {
  deleteClaim,
  exportAllData,
  getAllClaims,
  getClaim,
  getSetting,
  importClaims,
  saveClaim,
  saveSetting,
} from '../../services/storage';

vi.mock('../../services/storage', () => ({
  getAllClaims: vi.fn(),
  getClaim: vi.fn(),
  saveClaim: vi.fn(),
  deleteClaim: vi.fn(),
  saveSetting: vi.fn(),
  getSetting: vi.fn(),
  exportAllData: vi.fn(),
  importClaims: vi.fn(),
}));

const storageMocks = {
  getAllClaims: vi.mocked(getAllClaims),
  getClaim: vi.mocked(getClaim),
  saveClaim: vi.mocked(saveClaim),
  deleteClaim: vi.mocked(deleteClaim),
  saveSetting: vi.mocked(saveSetting),
  getSetting: vi.mocked(getSetting),
  exportAllData: vi.mocked(exportAllData),
  importClaims: vi.mocked(importClaims),
};

const defaultEligibilityAnswers: EligibilityAnswers = {
  jurisdiction: '',
  isClaimantOver18: false,
  isDefendantOver18: false,
  isDefendantInEnglandWales: false,
  claimAmount: 0,
  isPersonalInjury: false,
  personalInjuryAmount: 0,
  isRoadTrafficAccident: false,
  isHousingDisrepair: false,
  housingDisrepairAmount: 0,
  claimType: '',
  breachDate: '',
};

const address: Address = {
  line1: '1 High Street',
  line2: '',
  city: 'London',
  county: '',
  postcode: 'SW1A 1AA',
  country: 'England',
};

const sampleClaim = (overrides: Partial<Claim> = {}): Claim => ({
  id: 'claim-1',
  status: 'draft',
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-05-01T10:00:00.000Z',
  disputeType: 'unpaid_invoice',
  claimant: {
    fullName: 'Ada Claimant',
    address,
    phone: '07123456789',
    email: 'ada@example.com',
  },
  defendant: {
    type: 'individual',
    fullName: 'Bob Defendant',
    companyName: '',
    address: {
      ...address,
      line1: '2 Market Road',
      postcode: 'E1 1AA',
    },
    phone: '',
    email: 'bob@example.com',
  },
  claimAmount: 1250,
  interest: {
    claimInterest: false,
    rate: 8,
    startDate: '',
    endDate: '',
    calculatedAmount: 0,
  },
  particularsOfClaim: 'The defendant failed to pay invoice CC-100 after services were completed and reminders were sent.',
  courtFee: 80,
  letterBeforeClaim: {
    sent: false,
    method: 'email',
    responseReceived: false,
  },
  preActionChecklist: {
    letterBeforeClaimSent: false,
    evidenceGathered: false,
    adrConsidered: false,
    informationExchanged: false,
  },
  submissionMethod: 'online',
  documents: [],
  timeline: [],
  ...overrides,
});

const resetStore = (claims: Claim[] = []) => {
  useAppStore.setState({
    claims,
    currentClaimId: claims[0]?.id ?? null,
    eligibilityAnswers: { ...defaultEligibilityAnswers },
    disclaimerAccepted: false,
    darkMode: false,
    userProfile: null,
  });
};

const setupStorage = (claims: Claim[] = []) => {
  storageMocks.getAllClaims.mockResolvedValue(claims);
  storageMocks.getClaim.mockResolvedValue(undefined);
  storageMocks.saveClaim.mockResolvedValue();
  storageMocks.deleteClaim.mockResolvedValue();
  storageMocks.saveSetting.mockResolvedValue();
  storageMocks.getSetting.mockResolvedValue(undefined);
  storageMocks.exportAllData.mockResolvedValue(claims);
  storageMocks.importClaims.mockResolvedValue();
};

const renderApp = (route = '/', claims: Claim[] = []) => {
  resetStore(claims);
  setupStorage(claims);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
};

const acceptDisclaimer = async (user: ReturnType<typeof userEvent.setup>) => {
  const checkbox = screen.getByRole('checkbox', {
    name: /I understand this app provides guidance only/i,
  });
  await user.click(checkbox);
  await user.click(screen.getByRole('button', { name: /Accept & Continue/i }));
};

const controlAfterText = <T extends HTMLElement>(text: RegExp | string, selector: string): T => {
  const label = screen.getByText(text);
  const container = label.closest('div') ?? label.parentElement;
  const control = container?.querySelector(selector);
  if (!control) {
    throw new Error(`Missing control for ${String(text)}`);
  }
  return control as T;
};

const claimBuilderControl = <T extends HTMLElement>(label: RegExp | string, selector = 'input'): T => {
  const labelElement = screen.getAllByText(label)[0];
  const wrapper = labelElement.closest('div');
  const control = wrapper?.querySelector(selector);
  if (!control) {
    throw new Error(`Missing claim builder control for ${String(label)}`);
  }
  return control as T;
};

describe('ClaimCutter workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.className = '';
    Object.defineProperty(window, 'print', { value: vi.fn(), configurable: true });
    Object.defineProperty(window, 'open', { value: vi.fn(), configurable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      },
      configurable: true,
    });
  });

  test('requires disclaimer acceptance before exposing the app shell and navigation', async () => {
    const user = userEvent.setup();
    renderApp('/');

    expect(screen.getByRole('heading', { name: /Important Disclaimer/i })).toBeInTheDocument();
    expect(screen.getByText(/Guidance Only:/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GOV\.UK Claims Guide/i })).toHaveAttribute(
      'href',
      'https://www.gov.uk/make-court-claim-for-money'
    );

    const acceptButton = screen.getByRole('button', { name: /Accept & Continue/i });
    expect(acceptButton).toBeDisabled();

    await acceptDisclaimer(user);

    expect(localStorage.getItem('claimcutter_disclaimer_accepted')).toBe('true');
    expect(screen.queryByRole('heading', { name: /Important Disclaimer/i })).not.toBeInTheDocument();
    expect(screen.getByText('ClaimCutter')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Eligibility/i }));
    expect(await screen.findByRole('heading', { name: /Check Your Eligibility/i })).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 10/i)).toBeInTheDocument();
  });

  test('runs the eligibility wizard happy path and navigates to pre-claim', async () => {
    const user = userEvent.setup();
    renderApp('/eligibility');
    await acceptDisclaimer(user);

    await user.selectOptions(controlAfterText<HTMLSelectElement>('Select your jurisdiction', 'select'), 'england_wales');
    await user.click(screen.getByLabelText('Are you over 18?'));
    await user.click(screen.getByLabelText(/Is the person you are claiming against over 18/i));
    await user.click(screen.getByLabelText(/Does the person or business reside in England & Wales/i));
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await user.selectOptions(controlAfterText<HTMLSelectElement>('Select your claim type', 'select'), 'unpaid_invoice');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await user.type(controlAfterText<HTMLInputElement>('Claim amount (£)', 'input'), '1000');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Check Eligibility/i }));

    expect(await screen.findByText(/You appear to be eligible for small claims/i)).toBeInTheDocument();
    expect(screen.getByText(/Based on your answers/i)).toBeInTheDocument();
    expect(screen.getByText(/Your claim summary:/i)).toBeInTheDocument();
    expect(screen.getByText(/England & Wales/i)).toBeInTheDocument();
    expect(screen.getByText(/Unpaid Invoice/i)).toBeInTheDocument();
    expect(screen.getByText(/£1,000/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Start Pre-Claim Process/i }));
    expect(await screen.findByRole('heading', { name: /Pre-Claim/i })).toBeInTheDocument();
  });

  test('keeps non England and Wales users on the jurisdiction step with official alternatives', async () => {
    const user = userEvent.setup();
    renderApp('/eligibility');
    await acceptDisclaimer(user);

    await user.selectOptions(controlAfterText<HTMLSelectElement>('Select your jurisdiction', 'select'), 'scotland');

    expect(screen.getByRole('link', { name: /Guidance on Simple Procedure in Scotland/i })).toHaveAttribute(
      'href',
      'https://www.scotcourts.gov.uk/taking-action/simple-procedure/guide-to-simple-procedure/'
    );

    await user.selectOptions(controlAfterText<HTMLSelectElement>('Select your jurisdiction', 'select'), 'northern_ireland');

    expect(screen.getByRole('link', { name: /Small Claims Forms \(Justice NI\)/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Online Services Login \(Justice NI\)/i })).toBeInTheDocument();
  });

  test('shows an ineligible result when the claim exceeds the small claims limit', async () => {
    const user = userEvent.setup();
    renderApp('/eligibility');
    await acceptDisclaimer(user);

    await user.selectOptions(controlAfterText<HTMLSelectElement>('Select your jurisdiction', 'select'), 'england_wales');
    await user.click(screen.getByLabelText('Are you over 18?'));
    await user.click(screen.getByLabelText(/Is the person you are claiming against over 18/i));
    await user.click(screen.getByLabelText(/Does the person or business reside in England & Wales/i));
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await user.selectOptions(controlAfterText<HTMLSelectElement>('Select your claim type', 'select'), 'unpaid_invoice');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await user.type(controlAfterText<HTMLInputElement>('Claim amount (£)', 'input'), '15000');
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Check Eligibility/i }));

    expect(await screen.findByText(/Not eligible for small claims/i)).toBeInTheDocument();
    expect(screen.getByText(/Reason:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Home/i })).toBeInTheDocument();
  });

  test('completes the claim builder workflow and opens the submission guide', async () => {
    const user = userEvent.setup();
    const claim = sampleClaim({ claimant: { ...sampleClaim().claimant, fullName: '' } });
    renderApp('/claim-builder', [claim]);
    await acceptDisclaimer(user);

    await user.clear(claimBuilderControl<HTMLInputElement>('Full Name'));
    await user.type(claimBuilderControl<HTMLInputElement>('Full Name'), 'Ada Claimant');
    await user.clear(claimBuilderControl<HTMLInputElement>('Address Line 1'));
    await user.type(claimBuilderControl<HTMLInputElement>('Address Line 1'), '1 High Street');
    await user.clear(claimBuilderControl<HTMLInputElement>('City'));
    await user.type(claimBuilderControl<HTMLInputElement>('City'), 'London');
    await user.clear(claimBuilderControl<HTMLInputElement>('Postcode'));
    await user.type(claimBuilderControl<HTMLInputElement>('Postcode'), 'SW1A 1AA');
    await user.clear(claimBuilderControl<HTMLInputElement>('Phone'));
    await user.type(claimBuilderControl<HTMLInputElement>('Phone'), '07123456789');
    await user.clear(claimBuilderControl<HTMLInputElement>('Email'));
    await user.type(claimBuilderControl<HTMLInputElement>('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));

    await user.clear(claimBuilderControl<HTMLInputElement>('Full Name'));
    await user.type(claimBuilderControl<HTMLInputElement>('Full Name'), 'Bob Defendant');
    await user.clear(claimBuilderControl<HTMLInputElement>('Address Line 1'));
    await user.type(claimBuilderControl<HTMLInputElement>('Address Line 1'), '2 Market Road');
    await user.clear(claimBuilderControl<HTMLInputElement>('City'));
    await user.type(claimBuilderControl<HTMLInputElement>('City'), 'London');
    await user.clear(claimBuilderControl<HTMLInputElement>('Postcode'));
    await user.type(claimBuilderControl<HTMLInputElement>('Postcode'), 'E1 1AA');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));

    await user.clear(claimBuilderControl<HTMLInputElement>('Claim Amount (£)'));
    await user.type(claimBuilderControl<HTMLInputElement>('Claim Amount (£)'), '1250');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));

    await user.click(screen.getByRole('button', { name: /^Next$/i }));

    await user.clear(screen.getByPlaceholderText(/On 15th January 2024/i));
    await user.type(
      screen.getByPlaceholderText(/On 15th January 2024/i),
      'The defendant failed to pay invoice CC-100 after services were completed and reminders were sent.'
    );
    await user.click(screen.getByRole('button', { name: /^Next$/i }));

    await user.click(screen.getByRole('button', { name: /Preview Claim Form/i }));
    expect(screen.getByText(/Claim Summary/i)).toBeInTheDocument();
    expect(screen.getByText('Ada Claimant')).toBeInTheDocument();

    await user.click(screen.getByText(/I believe that the facts stated in this claim are true/i));
    await user.click(screen.getByRole('button', { name: /Continue to Submission Guide/i }));

    expect(await screen.findByRole('heading', { name: /Submission Guide/i })).toBeInTheDocument();
  }, 15000);

  test('submits an existing claim and shows it in the tracker timeline', async () => {
    const user = userEvent.setup();
    const claim = sampleClaim();
    renderApp('/submission', [claim]);
    await acceptDisclaimer(user);

    expect(await screen.findByRole('heading', { name: /Submission Guide/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Submit claim/i }));

    await waitFor(() => {
      expect(useAppStore.getState().claims[0].status).toBe('claim_submitted');
    });

    await user.click(screen.getByRole('button', { name: /Go to Claim Tracker/i }));
    expect(await screen.findByRole('heading', { name: /Claim Tracker/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Claim Submitted/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Response Deadline/i)).toBeInTheDocument();
    expect(screen.getByText(/Key Dates/i)).toBeInTheDocument();
  });

  test('exports settings data, edits the profile, and clears saved details', async () => {
    const user = userEvent.setup();
    renderApp('/settings');
    await acceptDisclaimer(user);

    await user.click(screen.getByRole('button', { name: /Add Details/i }));
    await user.type(screen.getByPlaceholderText(/Enter your full name/i), 'Ada Claimant');
    await user.type(screen.getByPlaceholderText(/Street address/i), '1 High Street');
    await user.type(screen.getByPlaceholderText(/^City$/i), 'London');
    await user.type(screen.getByPlaceholderText(/Postcode/i), 'SW1A 1AA');
    await user.type(screen.getByPlaceholderText(/Phone number/i), '07123456789');
    await user.type(screen.getByPlaceholderText(/Email address/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: /Save Details/i }));

    expect(await screen.findByText('Ada Claimant')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Export All Data/i }));
    await waitFor(() => expect(storageMocks.exportAllData).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Clear Saved Details/i }));
    await user.click(screen.getByRole('button', { name: /Yes, Clear Details/i }));

    expect(useAppStore.getState().userProfile).toBeNull();
  });

  test('shows previous claims and opens the selected claim in the tracker', async () => {
    const user = userEvent.setup();
    const claim = sampleClaim({ status: 'letter_sent' });
    renderApp('/claims', [claim]);
    await acceptDisclaimer(user);

    expect(await screen.findByRole('heading', { name: /Previous Claims/i })).toBeInTheDocument();
    expect(screen.getByText('Bob Defendant')).toBeInTheDocument();
    expect(screen.getByText(/£1250/i)).toBeInTheDocument();
    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
  });

  test('updates pre-claim checklist and marks the letter before claim as sent', async () => {
    const user = userEvent.setup();
    const claim = sampleClaim();
    renderApp('/pre-claim', [claim]);
    await acceptDisclaimer(user);

    expect(await screen.findByRole('heading', { name: /Pre-Claim Workflow/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Enter your full name/i), 'Ada Claimant');
    await user.type(screen.getByPlaceholderText(/Enter your address line 1/i), '1 High Street');
    await user.type(screen.getByPlaceholderText(/Enter your city/i), 'London');
    await user.type(screen.getByPlaceholderText(/Enter your postcode/i), 'SW1A 1AA');
    await user.type(screen.getByPlaceholderText(/Enter your phone number/i), '07123456789');
    await user.type(screen.getByPlaceholderText(/Enter your email address/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: /Next Step/i }));

    await user.type(await screen.findByPlaceholderText(/Enter defendant name/i), 'Bob Defendant');
    await user.type(screen.getByPlaceholderText(/Enter defendant address/i), '2 Market Road');
    await user.type(screen.getByPlaceholderText(/Enter defendant city/i), 'London');
    await user.type(screen.getByPlaceholderText(/Enter defendant postcode/i), 'E1 1AA');
    await user.click(screen.getByRole('button', { name: /Next Step/i }));

    await user.type(screen.getByPlaceholderText(/Describe what happened/i), 'The defendant failed to pay invoice CC-100 after services were completed.');
    await user.type(screen.getByPlaceholderText(/Enter amount/i), '1250');
    await user.click(screen.getByRole('button', { name: /Continue to Evidence/i }));
    await user.click(screen.getByRole('button', { name: /Show Full Letter/i }));

    expect(screen.getByText(/Letter Before Claim/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Copy to Clipboard/i }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Mark Letter as Sent/i }));
    await waitFor(() => {
      expect(useAppStore.getState().claims[0].status).toBe('letter_sent');
    });
  });
});