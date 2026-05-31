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
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  userPlan: UserPlan;
  cachedAt: number;
};

export type AuthAccessContextValue = {
  isAuthLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null | undefined;
  profile: AuthAccessProfile | null;
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

function profileFromCachedSnapshot(): AuthAccessProfile | null {
  const snapshot = getCachedAuthSnapshot();

  if (!snapshot.lastSignedIn || !snapshot.userId) {
    return null;
  }

  return {
    userId: snapshot.userId,
    email: snapshot.email,
    firstName: snapshot.firstName,
    lastName: snapshot.lastName,
    imageUrl: snapshot.imageUrl,
    userPlan: normalizeUserPlan(snapshot.userPlan),
    cachedAt: snapshot.cachedAt ?? 0,
  };
}

export function AuthAccessProvider({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profile, setProfile] = useState<AuthAccessProfile | null>(() =>
    profileFromCachedSnapshot(),
  );

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const cachedProfile = profileFromCachedSnapshot();
    const canUseCachedProfile = cachedProfile?.userId === userId;

    if (canUseCachedProfile) {
      setProfile(cachedProfile);
    }

    setIsProfileLoading(!canUseCachedProfile);

    try {
      await supabase.rpc("ensure_user_profile");

      const { data, error } = await supabase
        .from("app_users")
        .select("email, first_name, last_name, image_url, user_plan")
        .eq("clerk_user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const nextProfile = {
        userId,
        email: data?.email ?? null,
        firstName: data?.first_name ?? null,
        lastName: data?.last_name ?? null,
        imageUrl: data?.image_url ?? null,
        userPlan: normalizeUserPlan(data?.user_plan),
        cachedAt: Date.now(),
      };

      setCachedAuthSnapshot({
        lastSignedIn: true,
        userId: nextProfile.userId,
        email: nextProfile.email,
        firstName: nextProfile.firstName,
        lastName: nextProfile.lastName,
        imageUrl: nextProfile.imageUrl,
        userPlan: nextProfile.userPlan,
        cachedAt: nextProfile.cachedAt,
      });
      setProfile(nextProfile);

      return nextProfile;
    } catch (error) {
      console.warn("Unable to load Supabase user profile", error);

      if (!canUseCachedProfile) {
        setProfile({
          userId,
          email: null,
          firstName: null,
          lastName: null,
          imageUrl: null,
          userPlan: defaultUserPlan,
          cachedAt: Date.now(),
        });
      }

      return canUseCachedProfile ? cachedProfile : null;
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
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    const cachedProfile = profileFromCachedSnapshot();

    if (cachedProfile?.userId === userId) {
      setProfile(cachedProfile);
    } else {
      setProfile(null);
    }

    void refreshProfile();
  }, [isLoaded, isSignedIn, refreshProfile, userId]);

  const activeProfile = userId && profile?.userId === userId ? profile : null;
  const userPlan = activeProfile?.userPlan ?? null;
  const shouldWaitForProfile = Boolean(isSignedIn) && !activeProfile;

  const value = useMemo(
    () => ({
      isAuthLoaded: isLoaded,
      isSignedIn: Boolean(isSignedIn),
      userId,
      profile: activeProfile,
      userPlan,
      hasPremiumAccess: Boolean(isSignedIn),
      isProfileLoading: isProfileLoading || shouldWaitForProfile,
      refreshProfile,
    }),
    [
      isLoaded,
      isSignedIn,
      userId,
      activeProfile,
      userPlan,
      isProfileLoading,
      shouldWaitForProfile,
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
