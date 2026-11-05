import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Skeleton, SkeletonCard, SkeletonFade } from "@/components/ui/skeleton";
import { Elevation, HeroGradient, Palette, Radii } from "@/constants/theme";

/** Search result cards. */
export function SearchResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonFade style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={[styles.resultCard, Elevation.card]}>
          <View style={styles.row}>
            <Skeleton width={26} height={18} radius={4} />
            <Skeleton width={90} height={11} />
            <Skeleton width={60} height={11} />
          </View>
          <Skeleton width="82%" height={17} style={styles.mt14} />
          <Skeleton width="96%" height={12} style={styles.mt10} />
          <Skeleton width="64%" height={12} style={styles.mt8} />
        </SkeletonCard>
      ))}
    </SkeletonFade>
  );
}

/** Saved guide cards. */
export function SavedListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonFade style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={[styles.resultCard, Elevation.card]}>
          <View style={styles.row}>
            <Skeleton width={52} height={52} radius={16} />
            <View style={styles.flex}>
              <Skeleton width={70} height={10} />
              <Skeleton width="78%" height={16} style={styles.mt8} />
            </View>
            <Skeleton circle height={40} />
          </View>
          <Skeleton width="94%" height={12} style={styles.mt14} />
          <Skeleton width="58%" height={12} style={styles.mt8} />
        </SkeletonCard>
      ))}
    </SkeletonFade>
  );
}

/** Document rows on a country page. */
export function DocumentRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={[styles.docRow, Elevation.card]}>
          <Skeleton width={48} height={48} radius={15} />
          <View style={styles.flex}>
            <Skeleton width={80} height={10} />
            <Skeleton width="85%" height={15} style={styles.mt8} />
            <Skeleton width="65%" height={12} style={styles.mt8} />
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

/** Full country detail: hero, overview and guide list. */
export function CountryDetailSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <SkeletonFade>
      <View style={[styles.countryHero, { paddingTop: insets.top + 96 }]}>
        <Skeleton width={56} height={38} radius={10} tone="dark" />
        <Skeleton width="62%" height={36} radius={10} tone="dark" style={styles.mt18} />
        <Skeleton width="80%" height={14} tone="dark" style={styles.mt12} />
        <View style={[styles.row, styles.mt22]}>
          <Skeleton height={58} radius={18} tone="dark" style={styles.flex} />
          <Skeleton height={58} radius={18} tone="dark" style={styles.flex} />
        </View>
      </View>
      <View style={styles.countryBody}>
        <SkeletonCard style={[styles.overview, Elevation.card]}>
          <Skeleton width={40} height={40} radius={13} />
          <View style={styles.flex}>
            <Skeleton width="52%" height={15} />
            <Skeleton width="96%" height={12} style={styles.mt10} />
            <Skeleton width="76%" height={12} style={styles.mt8} />
          </View>
        </SkeletonCard>
        <Skeleton width={190} height={22} radius={8} style={styles.sectionTitle} />
        <DocumentRowsSkeleton />
      </View>
    </SkeletonFade>
  );
}

/** Guide reading page. */
export function GuideDetailSkeleton({ showTitle = true }: { showTitle?: boolean }) {
  return (
    <SkeletonFade>
      {/* Stands in for the large title when it isn't known yet, so the cover doesn't jump. */}
      {showTitle ? (
        <View style={styles.guideTitle}>
          <Skeleton width={96} height={11} />
          <Skeleton width="82%" height={32} radius={8} style={styles.mt12} />
          <Skeleton width="48%" height={32} radius={8} style={styles.mt12} />
        </View>
      ) : null}
      <View style={styles.guideHero}>
        <View style={styles.row}>
          <Skeleton width={40} height={28} radius={6} tone="dark" />
          <View style={styles.flex}>
            <Skeleton width={110} height={10} tone="dark" />
            <Skeleton width={70} height={10} tone="dark" style={styles.mt8} />
          </View>
        </View>
        <Skeleton width="88%" height={26} radius={8} tone="dark" style={styles.mt22} />
        <Skeleton width="60%" height={26} radius={8} tone="dark" style={styles.mt8} />
        <Skeleton width="94%" height={13} tone="dark" style={styles.mt18} />
        <Skeleton width="72%" height={13} tone="dark" style={styles.mt8} />
      </View>
      <Skeleton width="96%" height={15} style={styles.mt22} />
      <Skeleton width="88%" height={15} style={styles.mt10} />
      <Skeleton width="54%" height={15} style={styles.mt10} />
      {[0, 1].map((key) => (
        <SkeletonCard key={key} style={styles.mt18}>
          <Skeleton width="48%" height={17} />
          <Skeleton width="100%" height={12} style={styles.mt14} />
          <Skeleton width="92%" height={12} style={styles.mt8} />
          <Skeleton width="80%" height={12} style={styles.mt8} />
        </SkeletonCard>
      ))}
    </SkeletonFade>
  );
}

/** Generic form (edit profile). */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <SkeletonFade style={styles.formStack}>
      {Array.from({ length: fields }).map((_, index) => (
        <View key={index}>
          <Skeleton width={90} height={12} />
          <Skeleton height={56} radius={Radii.md} style={styles.mt10} />
        </View>
      ))}
      <Skeleton height={56} radius={Radii.lg} style={styles.mt8} />
    </SkeletonFade>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  resultCard: {
    padding: 18,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  countryHero: {
    minHeight: 400,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: HeroGradient[0],
  },
  countryBody: {
    marginTop: -26,
    paddingHorizontal: 20,
  },
  overview: {
    flexDirection: "row",
    gap: 14,
  },
  sectionTitle: {
    marginTop: 30,
    marginBottom: 14,
  },
  guideTitle: {
    // Matches StackScreen's large title: 6 top + overline row + 2 title lines + 24 bottom.
    paddingTop: 7,
    paddingBottom: 24,
  },
  guideHero: {
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.navy,
  },
  formStack: {
    gap: 18,
  },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
  mt12: { marginTop: 12 },
  mt14: { marginTop: 14 },
  mt18: { marginTop: 18 },
  mt22: { marginTop: 22 },
});
