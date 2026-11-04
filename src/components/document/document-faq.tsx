import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Motion, Palette, Radii, Type } from "@/constants/theme";
import { stringifyValue, type ContentSection } from "@/features/documents/content";
import { haptics } from "@/lib/haptics";

export function DocumentFaq({ section }: { section: ContentSection }) {
  const items = Array.isArray(section.items) ? section.items : [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{section.title ?? "Frequently asked"}</Text>
      <View>
        {items.map((item, index) => {
          const faq = item as { question?: unknown; answer?: unknown };

          return (
            <FaqItem
              key={`${stringifyValue(faq.question)}-${index}`}
              question={stringifyValue(faq.question)}
              answer={stringifyValue(faq.answer)}
              isOpen={openIndex === index}
              isLast={index === items.length - 1}
              onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
            />
          );
        })}
      </View>
    </View>
  );
}

export function FaqItem({
  question,
  answer,
  isOpen,
  isLast,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  const rotation = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 1 : 0, { duration: Motion.base });
  }, [isOpen, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <Animated.View layout={LinearTransition.duration(Motion.base)} style={!isLast && styles.divider}>
      <Pressable
        onPress={() => {
          haptics.selection();
          onToggle();
        }}
        style={styles.question}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={question}
      >
        <Text style={styles.questionText}>{question}</Text>
        <Animated.View style={[styles.chevron, isOpen && styles.chevronOpen, chevronStyle]}>
          <Ionicons name="chevron-down" size={15} color={isOpen ? Palette.white : Palette.inkSoft} />
        </Animated.View>
      </Pressable>
      {isOpen ? (
        <Animated.Text
          entering={FadeIn.duration(Motion.base)}
          exiting={FadeOut.duration(120)}
          style={styles.answer}
        >
          {answer}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  title: {
    ...Type.title3,
    marginBottom: 4,
    color: Palette.ink,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,16,36,0.09)",
  },
  question: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  questionText: {
    ...Type.headline,
    flex: 1,
    color: Palette.ink,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.well,
  },
  chevronOpen: {
    backgroundColor: Palette.primary,
  },
  answer: {
    ...Type.body,
    paddingBottom: 16,
    color: Palette.muted,
  },
});
