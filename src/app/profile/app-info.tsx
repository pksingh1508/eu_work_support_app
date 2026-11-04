import Constants from "expo-constants";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { FadeInView } from "@/components/ui/fade-in-view";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { StackScreen } from "@/components/ui/stack-screen";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";

export default function AppInfoScreen() {
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <StackScreen title="App info">
      <FadeInView style={[styles.card, Elevation.card]}>
        <View style={styles.logoWrap}>
          <View style={styles.logoGlow} />
          <Image
            source={require("@/assets/images/adaptive-icon.png")}
            style={styles.logo}
            contentFit="cover"
            accessibilityLabel="EU Work Support logo"
          />
        </View>
        <Text style={styles.name}>EU Work Support</Text>
        <Text style={styles.tagline}>Your path to working in Europe.</Text>
      </FadeInView>

      <FadeInView index={1} style={styles.group}>
        <ListGroup>
          <ListRow icon="pricetag-outline" tone="neutral" title="Version" value={version} />
          <ListRow icon="code-working-outline" tone="neutral" title="Developer" value="EU Work Support" />
          <ListRow icon="phone-portrait-outline" tone="neutral" title="Platform" value="Android" />
        </ListGroup>
      </FadeInView>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
  },
  logoWrap: {
    width: 176,
    height: 176,
    marginVertical: -26,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Palette.tint,
  },
  logo: {
    width: 176,
    height: 176,
  },
  name: {
    ...Type.title2,
    marginTop: 16,
    color: Palette.ink,
  },
  tagline: {
    ...Type.callout,
    marginTop: 4,
    color: Palette.muted,
  },
  group: {
    marginTop: 26,
  },
});
