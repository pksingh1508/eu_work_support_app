import { PropsWithChildren } from "react";
import { Text, View } from "react-native";

import { CustomLoading } from "@/components/custom-loading";
import { useAuthAccess } from "@/features/auth/access";
import { UnAuthenticated } from "@/features/auth/components/unauthenticated";

type PremiumGuardProps = PropsWithChildren<{
  returnTo?: string;
}>;

export function PremiumGuard({ children, returnTo }: PremiumGuardProps) {
  const { isAuthLoaded, isSignedIn, isProfileLoading } = useAuthAccess();

  if (!isAuthLoaded || isProfileLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-diplomatic-surface px-5">
        <CustomLoading />
        <Text className="mt-4 text-base font-bold tracking-normal text-diplomatic-secondaryText">
          Loading account...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return <UnAuthenticated returnTo={returnTo} />;
  }

  return <>{children}</>;
}
