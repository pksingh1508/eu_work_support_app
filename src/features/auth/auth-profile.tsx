import { PropsWithChildren } from "react";

import { useAuthAccess } from "@/features/auth/access";

export function AuthProfileProvider({
  children,
}: PropsWithChildren<{ value?: unknown }>) {
  return <>{children}</>;
}

export function useAuthProfile() {
  const {
    isProfileLoading,
    onboardingCompleted,
    markOnboardingCompleted,
    refreshProfile,
  } = useAuthAccess();

  return {
    isProfileLoading,
    onboardingCompleted,
    markOnboardingCompleted,
    refreshProfile,
  };
}
