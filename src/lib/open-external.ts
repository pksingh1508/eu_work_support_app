import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

import { Palette } from "@/constants/theme";
import { showErrorToast } from "@/lib/toast";

/** Opens a URL in an in-app Chrome Custom Tab, falling back to the system browser. */
export async function openExternal(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: Palette.card,
      secondaryToolbarColor: Palette.canvas,
      controlsColor: Palette.primary,
      enableBarCollapsing: true,
      showTitle: true,
    });
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      showErrorToast("Unable to open link", "Please try again in a moment.");
    }
  }
}

export async function openMail(address: string, subject: string) {
  try {
    await Linking.openURL(`mailto:${address}?subject=${encodeURIComponent(subject)}`);
  } catch {
    showErrorToast("No email app found", address);
  }
}
