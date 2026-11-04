import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Palette, Radii } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

type AppSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Sticky content above the scroll area (titles, actions). */
  header?: ReactNode;
  /** Fixed snap points; omit to size the sheet to its content. */
  snapPoints?: (string | number)[];
  scrollable?: boolean;
  /** Bottom padding inside the scroll/content area. */
  contentPaddingBottom?: number;
};

function SheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.5}
      pressBehavior="close"
      style={[props.style, styles.backdrop]}
    />
  );
}

function SheetHandle() {
  return (
    <View style={styles.handleArea}>
      <View style={styles.handle} />
    </View>
  );
}

/**
 * Controlled bottom sheet built on @gorhom/bottom-sheet. Handles the Android
 * hardware back button, haptics, safe areas and the app's sheet styling.
 */
export function AppSheet({
  visible,
  onClose,
  children,
  header,
  snapPoints,
  scrollable = false,
  contentPaddingBottom,
}: AppSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  // Only dismiss a sheet we actually presented: dismissing a never-presented
  // gorhom modal leaves it stuck in a "dismissing" state that ignores present().
  const isPresentedRef = useRef(false);
  const insets = useSafeAreaInsets();
  const isDynamic = !snapPoints;
  const bottomPadding = contentPaddingBottom ?? Math.max(insets.bottom, 16) + 16;

  useEffect(() => {
    if (visible) {
      haptics.light();
      isPresentedRef.current = true;
      sheetRef.current?.present();
    } else if (isPresentedRef.current) {
      isPresentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      sheetRef.current?.dismiss();
      return true;
    });

    return () => subscription.remove();
  }, [visible]);

  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;

    if (visible) {
      onClose();
    }
  }, [onClose, visible]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={isDynamic}
      enablePanDownToClose
      topInset={insets.top + 8}
      onDismiss={handleDismiss}
      backdropComponent={SheetBackdrop}
      handleComponent={SheetHandle}
      backgroundStyle={styles.background}
      style={styles.sheetShadow}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {scrollable ? (
        <>
          {header}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          >
            {children}
          </BottomSheetScrollView>
        </>
      ) : (
        <BottomSheetView style={[styles.viewContent, { paddingBottom: bottomPadding }]}>
          {header}
          {children}
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: Palette.navy,
  },
  background: {
    backgroundColor: Palette.card,
    borderTopLeftRadius: Radii.sheet,
    borderTopRightRadius: Radii.sheet,
  },
  sheetShadow: {
    shadowColor: "#060C24",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 24,
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D3D8E2",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  viewContent: {
    paddingHorizontal: 20,
  },
});
