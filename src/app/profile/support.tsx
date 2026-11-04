import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { FadeInView } from "@/components/ui/fade-in-view";
import { GradientFill } from "@/components/ui/gradient-fill";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { StackScreen } from "@/components/ui/stack-screen";
import { StarRing } from "@/components/ui/star-ring";
import { Elevation, NavyGradient, Palette, Radii, Type } from "@/constants/theme";
import { openMail } from "@/lib/open-external";

const supportEmail = "support@euworksupport.com";

export default function SupportScreen() {
  const router = useRouter();

  return (
    <StackScreen title="Support" subtitle="Questions, feedback or a problem — we’re here to help.">
      <FadeInView style={[styles.hero, Elevation.floating]}>
        <GradientFill colors={NavyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.ring} pointerEvents="none">
          <StarRing size={150} starSize={10} opacity={0.4} period={140} />
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="chatbubbles" size={22} color={Palette.navy} />
        </View>
        <Text style={styles.heroTitle}>How can we help?</Text>
        <Text style={styles.heroBody}>Questions about a guide, your access or the app — just ask.</Text>
        <Text style={styles.heroEmail}>{supportEmail}</Text>
      </FadeInView>

      <FadeInView index={1} style={styles.group}>
        <ListGroup title="Get in touch">
          <ListRow
            icon="mail-outline"
            title="Contact support"
            subtitle="Ask a question about your account"
            onPress={() => void openMail(supportEmail, "Contact Support")}
          />
          <ListRow
            icon="bug-outline"
            tone="danger"
            title="Report a problem"
            subtitle="Something broken or out of date?"
            onPress={() => void openMail(supportEmail, "Report a Problem")}
          />
        </ListGroup>
      </FadeInView>

      <FadeInView index={2} style={styles.group}>
        <ListGroup title="Self-service">
          <ListRow
            icon="help-buoy-outline"
            tone="gold"
            title="FAQ"
            subtitle="Quick answers to common questions"
            onPress={() => router.push("/profile/faq")}
          />
        </ListGroup>
      </FadeInView>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: "hidden",
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.navy,
  },
  ring: {
    position: "absolute",
    right: -40,
    top: -40,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.gold,
  },
  heroTitle: {
    ...Type.title2,
    marginTop: 16,
    color: Palette.white,
  },
  heroBody: {
    ...Type.callout,
    marginTop: 4,
    color: "rgba(255,255,255,0.72)",
  },
  heroEmail: {
    ...Type.label,
    marginTop: 14,
    color: "#FFE3A3",
  },
  group: {
    marginTop: 26,
  },
});
