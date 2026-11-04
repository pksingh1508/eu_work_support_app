import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { GradientFill } from "@/components/ui/gradient-fill";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StarRing } from "@/components/ui/star-ring";
import { BottomTabInset, Elevation, NavyGradient, Palette, Radii, Type } from "@/constants/theme";
import { useAuthAccess } from "@/features/auth/access";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { FontFamily } from "@/lib/fonts";

export default function ProfileScreen() {
  return (
    <PremiumGuard>
      <ProfileContent />
    </PremiumGuard>
  );
}

function getInitials(name: string) {
  const [firstName = "", lastName = ""] = name.trim().split(/\s+/).filter(Boolean);
  return `${firstName.charAt(0)}${lastName.charAt(0) || firstName.charAt(1)}`.toUpperCase();
}

function ProfileContent() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, refreshProfile, hasPremiumAccess } = useAuthAccess();
  const email = profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const databaseName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  const fullName = databaseName || user?.fullName || user?.firstName || "";
  const displayName = fullName || "Welcome";
  const initials = getInitials(fullName || email);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FocusStatusBar style="dark" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Account" title="Profile" />

        <FadeInView index={1}>
          <PressableScale
            onPress={() => router.push("/profile/edit")}
            scaleTo={0.985}
            style={[styles.identity, Elevation.floating]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <GradientFill colors={NavyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.identityDecor} pointerEvents="none">
              <View style={styles.identityGlow} />
              <StarRing size={190} starSize={12} opacity={0.38} period={150} />
            </View>

            <View style={styles.identityRow}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  {initials ? (
                    <Text style={styles.avatarText}>{initials}</Text>
                  ) : (
                    <Ionicons name="person" size={28} color={Palette.white} />
                  )}
                </View>
              </View>
              <View style={styles.identityText}>
                <Text style={styles.name} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {email || "Add your email"}
                </Text>
              </View>
            </View>

            <View style={styles.identityFooter}>
              {hasPremiumAccess ? (
                <View style={styles.premium}>
                  <Ionicons name="sparkles" size={12} color={Palette.navy} />
                  <Text style={styles.premiumText}>Premium access</Text>
                </View>
              ) : (
                <View style={styles.freePlan}>
                  <Text style={styles.freePlanText}>Free plan</Text>
                </View>
              )}
              <View style={styles.editHint}>
                <Text style={styles.editHintText}>Edit</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          </PressableScale>
        </FadeInView>

        <FadeInView index={2} style={styles.group}>
          <ListGroup title="Account">
            <ListRow
              icon="person-circle-outline"
              title="Account"
              subtitle="Profile, password and sign out"
              onPress={() => router.push("/profile/account")}
            />
          </ListGroup>
        </FadeInView>

        <FadeInView index={3} style={styles.group}>
          <ListGroup title="Information">
            <ListRow
              icon="document-text-outline"
              title="Legal"
              subtitle="Privacy, terms and licences"
              onPress={() => router.push("/profile/legal")}
            />
            <ListRow
              icon="library-outline"
              title="Sources and disclaimer"
              subtitle="Where our information comes from"
              tone="gold"
              onPress={() => router.push("/profile/sources-and-disclaimer")}
            />
            <ListRow
              icon="chatbubbles-outline"
              title="Support"
              subtitle="Contact us, report a problem, FAQ"
              tone="success"
              onPress={() => router.push("/profile/support")}
            />
            <ListRow
              icon="information-circle-outline"
              title="App info"
              tone="neutral"
              value={`v${version}`}
              onPress={() => router.push("/profile/app-info")}
            />
          </ListGroup>
        </FadeInView>

        <FadeInView index={4} style={styles.group}>
          <ListGroup>
            <ListRow
              icon="trash-outline"
              title="Danger zone"
              subtitle="Permanently delete your account"
              destructive
              onPress={() => router.push("/profile/danger-zone")}
            />
          </ListGroup>
        </FadeInView>

        <FadeInView index={5} style={styles.footer}>
          <StarRing size={34} starSize={5} color={Palette.faint} period={0} />
          <Text style={styles.footerText}>EU Work Support · Version {version}</Text>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  content: {
    paddingHorizontal: 20,
  },
  identity: {
    overflow: "hidden",
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.navy,
  },
  identityDecor: {
    position: "absolute",
    right: -56,
    top: -60,
    alignItems: "center",
    justifyContent: "center",
  },
  identityGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(70, 120, 255, 0.16)",
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: "rgba(242, 179, 61, 0.7)",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  avatarText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 22,
    letterSpacing: 0.5,
    color: Palette.white,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
  },
  name: {
    ...Type.title2,
    color: Palette.white,
  },
  email: {
    ...Type.callout,
    marginTop: 2,
    color: "rgba(255, 255, 255, 0.68)",
  },
  identityFooter: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  premium: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Palette.gold,
  },
  premiumText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 12,
    color: Palette.navy,
  },
  freePlan: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  freePlanText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 12,
    color: Palette.white,
  },
  editHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  editHintText: {
    ...Type.caption,
    color: "rgba(255,255,255,0.7)",
  },
  group: {
    marginTop: 26,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
    gap: 10,
  },
  footerText: {
    ...Type.caption,
    color: Palette.subtle,
  },
});
