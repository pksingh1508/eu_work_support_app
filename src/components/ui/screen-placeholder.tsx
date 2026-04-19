import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenPlaceholderProps = {
  title: string;
  eyebrow?: string;
  description: string;
  items?: string[];
};

export function ScreenPlaceholder({ title, eyebrow, description, items = [] }: ScreenPlaceholderProps) {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          {eyebrow ? (
            <ThemedText type="code" themeColor="textSecondary" style={styles.eyebrow}>
              {eyebrow}
            </ThemedText>
          ) : null}
          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText themeColor="textSecondary">{description}</ThemedText>

          {items.length > 0 ? (
            <ThemedView type="backgroundElement" style={styles.itemGroup}>
              {items.map((item) => (
                <ThemedText key={item} type="small">
                  {item}
                </ThemedText>
              ))}
            </ThemedView>
          ) : null}
        </ThemedView>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  container: {
    gap: Spacing.three,
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  itemGroup: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
});
