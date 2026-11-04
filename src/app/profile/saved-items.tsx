import { Redirect } from "expo-router";

/** Legacy profile shortcut — the Saved tab is the single home for saved items. */
export default function ProfileSavedItemsScreen() {
  return <Redirect href="/saved" />;
}
