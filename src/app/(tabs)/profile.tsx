import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { type Href, useRouter } from "expo-router";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { GradientFill } from "@/components/ui/gradient-fill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  BottomTabInset,
  Elevation,
  HeroGradient,
  Palette,
} from "@/constants/theme";
import { useAuthAccess } from "@/features/auth/access";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { FontFamily } from "@/lib/fonts";

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: "default" | "danger";
};

export default function ProfileScreen() {
  return (
    <PremiumGuard>
      <ProfileContent />
    </PremiumGuard>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, refreshProfile, hasPremiumAccess } = useAuthAccess();
  const email = profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const databaseName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fullName =
    databaseName || user?.fullName || user?.firstName || "Welcome";
  const initials = getInitials(fullName);

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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + 26 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Account" title="Profile" />

        <FadeInView index={1}>
          <View style={[styles.identity, Elevation.floating]}>
            <GradientFill colors={HeroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.identityOrb} />
            <View style={styles.identityRow}>
              <ProfileAvatar initials={initials} />
              <View style={styles.identityText}>
                <Text style={styles.name} numberOfLines={1}>
                  {fullName}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {email || "Email"}
                </Text>
              </View>
            </View>
            {hasPremiumAccess ? (
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={13} color="#0B1F4B" />
                <Text style={styles.badgeText}>Premium access</Text>
              </View>
            ) : null}
          </View>
        </FadeInView>

        <FadeInView index={2} style={styles.group}>
          <Text style={styles.groupLabel}>ACCOUNT</Text>
          <View style={[styles.groupCard, Elevation.card]}>
            <ProfileMenuRow
              icon="person-circle-outline"
              label="Account"
              onPress={() => router.push("/profile/account")}
            />
          </View>
        </FadeInView>

        <FadeInView index={3} style={styles.group}>
          <Text style={styles.groupLabel}>INFORMATION</Text>
          <View style={[styles.groupCard, Elevation.card]}>
            <ProfileMenuRow
              icon="document-text-outline"
              label="Legal"
              onPress={() => router.push("/profile/legal")}
            />
            <ProfileMenuRow
              icon="library-outline"
              label="Sources and Disclaimer"
              onPress={() =>
                router.push("/profile/sources-and-disclaimer" as Href)
              }
            />
            <ProfileMenuRow
              icon="help-circle-outline"
              label="Support"
              onPress={() => router.push("/profile/support")}
            />
            <ProfileMenuRow
              icon="information-circle-outline"
              label="App Info"
              onPress={() => router.push("/profile/app-info")}
            />
          </View>
        </FadeInView>

        <FadeInView index={4} style={styles.group}>
          <View style={[styles.groupCard, Elevation.card]}>
            <ProfileMenuRow
              icon="trash-outline"
              label="Danger Zone"
              tone="danger"
              onPress={() => router.push("/profile/danger-zone")}
            />
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const [firstName = "", lastName = ""] = parts;
  const fallbackSecondLetter = firstName.charAt(1);

  return `${firstName.charAt(0)}${
    lastName.charAt(0) || fallbackSecondLetter
  }`.toUpperCase();
}

function ProfileAvatar({ initials }: { initials: string }) {
  return (
    <View style={styles.avatar}>
      {initials ? (
        <Text style={styles.avatarText}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={30} color="#FFFFFF" />
      )}
    </View>
  );
}

function ProfileMenuRow({ icon, label, onPress, tone = "default" }: MenuRowProps) {
  const isDanger = tone === "danger";

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.rowIcon, isDanger && styles.rowIconDanger]}>
        <Ionicons
          name={icon}
          size={20}
          color={isDanger ? Palette.danger : Palette.primary}
        />
      </View>
      <Text style={[styles.rowLabel, isDanger && styles.rowLabelDanger]}>
        {label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDanger ? Palette.danger : Palette.subtle}
      />
    </PressableScale>
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
    borderRadius: 28,
    backgroundColor: HeroGradient[1],
  },
  identityOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -60,
    top: -80,
    backgroundColor: "rgba(140, 190, 255, 0.25)",
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  avatarText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: "#FFFFFF",
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
  },
  name: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    lineHeight: 28,
    color: "#FFFFFF",
  },
  email: {
    marginTop: 2,
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.78)",
  },
  badge: {
    marginTop: 18,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  badgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    color: "#0B1F4B",
  },
  group: {
    marginTop: 24,
  },
  groupLabel: {
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Palette.subtle,
  },
  groupCard: {
    padding: 6,
    borderRadius: 24,
    backgroundColor: Palette.card,
  },
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  rowIconDanger: {
    backgroundColor: Palette.dangerTint,
  },
  rowLabel: {
    flex: 1,
    marginLeft: 14,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Palette.ink,
  },
  rowLabelDanger: {
    color: Palette.danger,
  },
});
