import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/ui/fade-in-view";
import { StackScreen } from "@/components/ui/stack-screen";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";
import { openMail } from "@/lib/open-external";

const SUPPORT_EMAIL = "support@euworksupport.eu";

const sections: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: { bg: string; fg: string };
  title: string;
  paragraphs: string[];
}[] = [
  {
    icon: "library-outline",
    tone: { bg: Palette.tint, fg: Palette.primary },
    title: "Our sources",
    paragraphs: [
      "Information available within the application is researched from publicly available sources, including official government websites, European Union portals, embassy and consulate websites, official immigration authority websites, and official university or college websites.",
      "Our team reviews, simplifies, and organizes the information to make it easier for users to understand. We do not copy or reproduce complete third-party articles.",
    ],
  },
  {
    icon: "alert-circle-outline",
    tone: { bg: Palette.warningTint, fg: Palette.warning },
    title: "Disclaimer",
    paragraphs: [
      "Immigration rules, visa requirements, university information, document requirements, fees, and application procedures may change without notice. Users should always confirm the latest information directly with the relevant official authority before making an application or financial decision.",
      "EU Work Support does not provide legal, immigration, financial, recruitment, or professional advice. Information provided through the app should not be considered a substitute for advice from a qualified professional or authorized government authority.",
    ],
  },
  {
    icon: "checkmark-done-outline",
    tone: { bg: Palette.successTint, fg: Palette.success },
    title: "Content review process",
    paragraphs: [
      "Our content is periodically reviewed against the official sources linked within each article. The “Last reviewed” date indicates when the information was most recently checked by our content team.",
    ],
  },
];

export default function SourcesAndDisclaimerScreen() {
  return (
    <StackScreen title="Sources & disclaimer" eyebrow="Transparency">
      <FadeInView style={[styles.lead, Elevation.card]}>
        <View style={styles.leadIcon}>
          <Ionicons name="shield-checkmark" size={24} color={Palette.goldInk} />
        </View>
        <Text style={styles.leadTitle}>Independent information, clearly sourced</Text>
        <Text style={styles.body}>
          EU Work Support is an independent educational and informational application. We are not
          affiliated with, endorsed by, or officially connected to any government, embassy,
          consulate, immigration authority, visa office, university, college, or employment
          authority.
        </Text>
      </FadeInView>

      {sections.map((section, index) => (
        <FadeInView key={section.title} index={index + 1} style={[styles.card, Elevation.card]}>
          <View style={styles.heading}>
            <View style={[styles.headingIcon, { backgroundColor: section.tone.bg }]}>
              <Ionicons name={section.icon} size={19} color={section.tone.fg} />
            </View>
            <Text style={styles.headingTitle}>{section.title}</Text>
          </View>
          <View style={styles.paragraphs}>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.body}>
                {paragraph}
              </Text>
            ))}
          </View>
        </FadeInView>
      ))}

      <FadeInView index={4} style={[styles.card, Elevation.card]}>
        <View style={styles.heading}>
          <View style={[styles.headingIcon, { backgroundColor: Palette.tint }]}>
            <Ionicons name="chatbox-ellipses-outline" size={19} color={Palette.primary} />
          </View>
          <Text style={styles.headingTitle}>Spotted something outdated?</Text>
        </View>
        <Text style={[styles.body, styles.paragraphs]}>
          Report inaccurate or outdated information through Contact Support in the app, or email
          us directly.
        </Text>
        <Button
          label={SUPPORT_EMAIL}
          variant="secondary"
          size="md"
          icon="mail-outline"
          onPress={() => void openMail(SUPPORT_EMAIL, "Report outdated information")}
          style={styles.button}
        />
      </FadeInView>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  lead: {
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
  },
  leadIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.goldSoft,
  },
  leadTitle: {
    ...Type.title2,
    marginTop: 16,
    marginBottom: 8,
    color: Palette.ink,
  },
  card: {
    marginTop: 14,
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headingIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  headingTitle: {
    ...Type.title3,
    flex: 1,
    color: Palette.ink,
  },
  paragraphs: {
    marginTop: 14,
    gap: 12,
  },
  body: {
    ...Type.body,
    color: "#3B4459",
  },
  button: {
    marginTop: 16,
  },
});
