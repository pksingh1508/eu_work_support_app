import { createContext, PropsWithChildren, useContext } from 'react';

type AuthProfileContextValue = {
  isProfileLoading: boolean;
  onboardingCompleted: boolean | null;
  markOnboardingCompleted: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthProfileContext = createContext<AuthProfileContextValue | undefined>(undefined);

export function AuthProfileProvider({
  children,
  value,
}: PropsWithChildren<{ value: AuthProfileContextValue }>) {
  return <AuthProfileContext.Provider value={value}>{children}</AuthProfileContext.Provider>;
}

export function useAuthProfile() {
  const value = useContext(AuthProfileContext);

  if (!value) {
    throw new Error('useAuthProfile must be used inside AuthProfileProvider');
  }

  return value;
}

