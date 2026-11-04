import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { CustomLoading } from "@/components/custom-loading";
import { Palette, Type } from "@/constants/theme";
import { useAuthAccess } from "@/features/auth/access";
import { UnAuthenticated } from "@/features/auth/components/unauthenticated";

type PremiumGuardProps = PropsWithChildren<{
  returnTo?: string;
}>;

export function PremiumGuard({ children, returnTo }: PremiumGuardProps) {
  const { isAuthLoaded, isSignedIn, isProfileLoading } = useAuthAccess();

  if (!isAuthLoaded || isProfileLoading) {
    return (
      <View style={styles.loading}>
        <CustomLoading size={72} />
        <Animated.Text entering={FadeIn.delay(300).duration(400)} style={styles.loadingText}>
          Preparing your guides…
        </Animated.Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return <UnAuthenticated returnTo={returnTo} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: Palette.canvas,
  },
  loadingText: {
    ...Type.callout,
    marginTop: 20,
    color: Palette.muted,
  },
});
