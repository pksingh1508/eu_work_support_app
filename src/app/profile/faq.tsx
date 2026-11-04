import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { FaqItem } from "@/components/document/document-faq";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/ui/fade-in-view";
import { StackScreen } from "@/components/ui/stack-screen";
import { FAQs } from "@/constants/FAQ";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";

export default function FAQScreen() {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(FAQs[0]?.id ?? null);

  return (
    <StackScreen
      title="FAQ"
      eyebrow="Help centre"
      subtitle="Quick answers for using EU Work Support and managing your guides."
    >
      <FadeInView style={[styles.card, Elevation.card]}>
        {FAQs.map((item, index) => (
          <FaqItem
            key={item.id}
            question={item.question}
            answer={item.answer}
            isOpen={openId === item.id}
            isLast={index === FAQs.length - 1}
            onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
          />
        ))}
      </FadeInView>

      <FadeInView index={1} style={styles.cta}>
        <Text style={styles.ctaTitle}>Still need help?</Text>
        <Text style={styles.ctaBody}>Our team is happy to answer anything not covered here.</Text>
        <Button
          label="Contact support"
          variant="secondary"
          size="md"
          icon="chatbubbles-outline"
          fullWidth={false}
          onPress={() => router.push("/profile/support")}
          style={styles.ctaButton}
        />
      </FadeInView>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
  },
  cta: {
    marginTop: 24,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  ctaTitle: {
    ...Type.title3,
    color: Palette.ink,
  },
  ctaBody: {
    ...Type.callout,
    marginTop: 4,
    textAlign: "center",
    color: Palette.muted,
  },
  ctaButton: {
    marginTop: 16,
    alignSelf: "center",
  },
});
