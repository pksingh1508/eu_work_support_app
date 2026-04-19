import { createContext, PropsWithChildren, useContext, useState } from 'react';

export type OnboardingGoal = 'visit' | 'work' | 'study' | 'family' | 'business' | 'relocate' | 'other';

export type OnboardingDraft = {
  nationalityCountryCode: string;
  residenceCountryCode: string;
  destinationInterests: string;
  preferredLanguage: string;
  goal: OnboardingGoal | '';
  notificationOptIn: boolean;
};

type OnboardingContextValue = {
  draft: OnboardingDraft;
  updateDraft: (updates: Partial<OnboardingDraft>) => void;
  resetDraft: () => void;
};

const initialDraft: OnboardingDraft = {
  nationalityCountryCode: '',
  residenceCountryCode: '',
  destinationInterests: '',
  preferredLanguage: 'en',
  goal: '',
  notificationOptIn: false,
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);

  const updateDraft = (updates: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
  };

  const resetDraft = () => setDraft(initialDraft);

  return (
    <OnboardingContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingDraft() {
  const value = useContext(OnboardingContext);

  if (!value) {
    throw new Error('useOnboardingDraft must be used inside OnboardingProvider');
  }

  return value;
}

