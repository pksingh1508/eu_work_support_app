import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type TextStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useArticleStyles } from "@/components/document/article-theme";
import { RichText } from "@/components/document/rich-text";
import { Motion, Palette, Radii, Type } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

type FaqEntry = { question: string; answer: string };

/** Accordion of guide questions, using the reader's typography. */
export function DocumentFaq({ items }: { items: FaqEntry[] }) {
  const article = useArticleStyles();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <FaqItem
          key={`${item.question}-${index}`}
          question={item.question}
          answer={item.answer}
          questionStyle={article.question}
          renderAnswer={(answer) => <RichText text={answer} style={[article.body, styles.answerSpacing]} />}
          isOpen={openIndex === index}
          isLast={index === items.length - 1}
          onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
        />
      ))}
    </View>
  );
}

export function FaqItem({
  question,
  answer,
  isOpen,
  isLast,
  onToggle,
  questionStyle,
  renderAnswer,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
  questionStyle?: TextStyle;
  renderAnswer?: (answer: string) => ReactNode;
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
        <Text style={[styles.questionText, questionStyle]}>{question}</Text>
        <Animated.View style={[styles.chevron, isOpen && styles.chevronOpen, chevronStyle]}>
          <Ionicons name="chevron-down" size={15} color={isOpen ? Palette.white : Palette.inkSoft} />
        </Animated.View>
      </Pressable>
      {isOpen ? (
        <Animated.View entering={FadeIn.duration(Motion.base)} exiting={FadeOut.duration(120)}>
          {renderAnswer ? (
            renderAnswer(answer)
          ) : (
            <Text selectable style={styles.answer}>
              {answer}
            </Text>
          )}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: Radii.lg,
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,16,36,0.1)",
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
    paddingVertical: 14,
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
    color: Palette.inkSoft,
  },
  answerSpacing: {
    paddingBottom: 18,
  },
});
