import { useAuth } from "@clerk/expo";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearCachedAuthSnapshot,
  getCachedAuthSnapshot,
  setCachedAuthSnapshot,
} from "@/lib/local-storage";
import { supabase } from "@/lib/supabase";

export type UserPlan = "Free" | "PRO";

export type AuthAccessProfile = {
  userPlan: UserPlan;
};

export type AuthAccessContextValue = {
  isAuthLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null | undefined;
  userPlan: UserPlan | null;
  hasPremiumAccess: boolean;
  isProfileLoading: boolean;
  refreshProfile: () => Promise<AuthAccessProfile | null>;
};

const defaultUserPlan: UserPlan = "Free";

const AuthAccessContext = createContext<AuthAccessContextValue | undefined>(
  undefined,
);

export function normalizeUserPlan(value: unknown): UserPlan {
  if (typeof value !== "string") {
    return defaultUserPlan;
  }

  return value.trim().toUpperCase() === "PRO" ? "PRO" : defaultUserPlan;
}

export function AuthAccessProvider({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setUserPlan(null);
      return null;
    }

    const cachedProfile = getCachedAuthSnapshot();
    const cachedUserPlan = normalizeUserPlan(cachedProfile.userPlan);
    const canUseCachedProfile =
      cachedProfile.lastSignedIn &&
      cachedProfile.userId === userId &&
      typeof cachedProfile.userPlan === "string";

    if (canUseCachedProfile) {
      setUserPlan(cachedUserPlan);
    }

    setIsProfileLoading(!canUseCachedProfile);

    try {
      await supabase.rpc("ensure_user_profile");

      const { data, error } = await supabase
        .from("app_users")
        .select("user_plan")
        .eq("clerk_user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const nextProfile = {
        userPlan: normalizeUserPlan(data?.user_plan),
      };

      setCachedAuthSnapshot({
        lastSignedIn: true,
        userId,
        userPlan: nextProfile.userPlan,
      });
      setUserPlan(nextProfile.userPlan);

      return nextProfile;
    } catch (error) {
      console.warn("Unable to load Supabase user profile", error);

      if (!canUseCachedProfile) {
        setUserPlan(defaultUserPlan);
      }

      return canUseCachedProfile
        ? {
            userPlan: cachedUserPlan,
          }
        : null;
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      clearCachedAuthSnapshot();
      setUserPlan(null);
      setIsProfileLoading(false);
      return;
    }

    void refreshProfile();
  }, [isLoaded, isSignedIn, refreshProfile]);

  const value = useMemo(
    () => ({
      isAuthLoaded: isLoaded,
      isSignedIn: Boolean(isSignedIn),
      userId,
      userPlan,
      hasPremiumAccess: Boolean(isSignedIn),
      isProfileLoading,
      refreshProfile,
    }),
    [
      isLoaded,
      isSignedIn,
      userId,
      userPlan,
      isProfileLoading,
      refreshProfile,
    ],
  );

  return (
    <AuthAccessContext.Provider value={value}>
      {children}
    </AuthAccessContext.Provider>
  );
}

export function useAuthAccess() {
  const value = useContext(AuthAccessContext);

  if (!value) {
    throw new Error("useAuthAccess must be used inside AuthAccessProvider");
  }

  return value;
}
