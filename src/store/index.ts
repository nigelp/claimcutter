import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Claim, ClaimStatus, EligibilityAnswers, UserProfile, HearingDetails } from '../types';
import { saveClaim, getAllClaims, getClaim, deleteClaim, saveSetting } from '../services/storage';

function migrateUserProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  // New shape: has nested address object
  if (obj.address && typeof obj.address === 'object' && 'line1' in obj.address) {
    return obj as unknown as UserProfile;
  }
  // Old shape: flat fields (addressLine1, city, county, postcode)
  if (obj.addressLine1 || obj.fullName) {
    return {
      fullName: (obj.fullName as string) || '',
      address: {
        line1: (obj.addressLine1 as string) || '',
        line2: (obj.addressLine2 as string) || undefined,
        city: (obj.city as string) || '',
        county: (obj.county as string) || undefined,
        postcode: (obj.postcode as string) || '',
        country: 'England',
      },
      phone: (obj.phone as string) || '',
      email: (obj.email as string) || '',
      lastUpdated: (obj.lastUpdated as string) || new Date().toISOString(),
    };
  }
  return null;
}

interface AppState {
  claims: Claim[];
  currentClaimId: string | null;
  eligibilityAnswers: EligibilityAnswers;
  disclaimerAccepted: boolean;
  darkMode: boolean;
  userProfile: UserProfile | null;
  
  setClaims: (claims: Claim[]) => void;
  setCurrentClaimId: (id: string | null) => void;
  setEligibilityAnswers: (answers: Partial<EligibilityAnswers>) => void;
  setDisclaimerAccepted: (accepted: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (partial: Partial<UserProfile>) => void;
  clearUserProfile: () => void;
  
  loadClaims: () => Promise<void>;
  saveCurrentClaim: (claim: Claim) => Promise<void>;
  getCurrentClaim: () => Promise<Claim | undefined>;
  deleteClaim: (id: string) => Promise<void>;
  createNewClaim: () => Claim;
  ensureCurrentClaim: () => Promise<Claim>;
  updateClaimStatus: (id: string, status: ClaimStatus) => Promise<void>;
  updateHearingDetails: (id: string, details: Partial<HearingDetails>) => Promise<void>;
}

const createEmptyClaim = (profile?: UserProfile | null): Claim => ({
  id: crypto.randomUUID(),
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  disputeType: 'other',
  claimant: profile
    ? {
        fullName: profile.fullName,
        address: { ...profile.address },
        phone: profile.phone,
        email: profile.email,
      }
    : {
        fullName: '',
        address: { line1: '', city: '', postcode: '', country: 'England' },
        phone: '',
        email: '',
      },
  defendant: {
    type: 'individual',
    fullName: '',
    address: { line1: '', city: '', postcode: '', country: 'England' },
    phone: '',
    email: '',
  },
  claimAmount: 0,
  interest: {
    claimInterest: false,
    rate: 8,
    startDate: '',
    endDate: '',
    calculatedAmount: 0,
  },
  particularsOfClaim: '',
  courtFee: 0,
  letterBeforeClaim: {
    sent: false,
    method: 'post',
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
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      claims: [],
      currentClaimId: null,
      eligibilityAnswers: {
        jurisdiction: '',
        isClaimantOver18: false,
        isDefendantOver18: false,
        isDefendantInEnglandWales: false,
        claimAmount: 0,
        isPersonalInjury: false,
        isRoadTrafficAccident: false,
        isHousingDisrepair: false,
        claimType: '',
      },
      disclaimerAccepted: false,
      darkMode: true,
      userProfile: null,
      
      setClaims: (claims) => set({ claims }),
      setCurrentClaimId: (id) => set({ currentClaimId: id }),
      setEligibilityAnswers: (answers) =>
        set((state) => ({
          eligibilityAnswers: { ...state.eligibilityAnswers, ...answers },
        })),
      setDisclaimerAccepted: (accepted) => set({ disclaimerAccepted: accepted }),
      setDarkMode: (dark) => {
        set({ darkMode: dark });
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        saveSetting('darkMode', dark);
      },
      
      setUserProfile: (profile) => set({ userProfile: profile }),
      updateUserProfile: (partial) => set((state) => {
        const existing = state.userProfile ?? {} as UserProfile;
        const merged: UserProfile = {
          ...existing,
          ...partial,
          address: { ...existing.address, ...partial.address },
          lastUpdated: new Date().toISOString(),
        };
        return { userProfile: merged };
      }),
      clearUserProfile: () => set({ userProfile: null }),
      
      loadClaims: async () => {
        const claims = await getAllClaims();
        set({ claims });
      },
      
      saveCurrentClaim: async (claim) => {
        const updatedClaim = { ...claim, updatedAt: new Date().toISOString() };
        await saveClaim(updatedClaim);
        set((state) => {
          const exists = state.claims.some((c) => c.id === updatedClaim.id);
          return {
            claims: exists
              ? state.claims.map((c) => (c.id === updatedClaim.id ? updatedClaim : c))
              : [updatedClaim, ...state.claims],
          };
        });
      },
      
      getCurrentClaim: async () => {
        const { currentClaimId } = get();
        if (!currentClaimId) return undefined;
        return getClaim(currentClaimId);
      },
      
      deleteClaim: async (id) => {
        await deleteClaim(id);
        set((state) => ({
          claims: state.claims.filter((c) => c.id !== id),
          currentClaimId: state.currentClaimId === id ? null : state.currentClaimId,
        }));
      },
      
      createNewClaim: () => {
        const newClaim = createEmptyClaim(get().userProfile);
        set((state) => ({
          claims: [newClaim, ...state.claims],
          currentClaimId: newClaim.id,
        }));
        void saveClaim(newClaim);
        return newClaim;
      },

      ensureCurrentClaim: async () => {
        const { currentClaimId } = get();
        if (currentClaimId) {
          const existing = await getClaim(currentClaimId);
          if (existing) return existing;
        }
        const newClaim = createEmptyClaim(get().userProfile);
        await saveClaim(newClaim);
        set((state) => ({
          claims: [newClaim, ...state.claims.filter((c) => c.id !== newClaim.id)],
          currentClaimId: newClaim.id,
        }));
        return newClaim;
      },
      
      updateClaimStatus: async (id, status) => {
        const claim = await getClaim(id);
        if (claim) {
          const updatedClaim = { ...claim, status, updatedAt: new Date().toISOString() };
          await saveClaim(updatedClaim);
          set((state) => ({
            claims: state.claims.map((c) => (c.id === id ? updatedClaim : c)),
          }));
        }
      },
      
      updateHearingDetails: async (id, details) => {
        const claim = await getClaim(id);
        if (claim) {
          const updatedClaim: Claim = {
            ...claim,
            hearingDetails: { ...(claim.hearingDetails || {}), ...details } as HearingDetails,
            updatedAt: new Date().toISOString(),
          };
          await saveClaim(updatedClaim);
          set((state) => ({
            claims: state.claims.map((c) => (c.id === id ? updatedClaim : c)),
          }));
        }
      },
    }),
    {
      name: 'claimcutter-storage',
      partialize: (state) => ({
        disclaimerAccepted: state.disclaimerAccepted,
        darkMode: state.darkMode,
        eligibilityAnswers: state.eligibilityAnswers,
        userProfile: state.userProfile,
        currentClaimId: state.currentClaimId,
      }),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as object) };
        if (merged.userProfile) {
          merged.userProfile = migrateUserProfile(merged.userProfile);
        }
        return merged;
      },
    }
  )
);