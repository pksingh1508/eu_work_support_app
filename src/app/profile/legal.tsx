import type Ionicons from "@expo/vector-icons/Ionicons";
import { type Href, useRouter } from "expo-router";

import { FadeInView } from "@/components/ui/fade-in-view";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { StackScreen } from "@/components/ui/stack-screen";
import { dataDeletion } from "@/constants/dataDeletion";
import { openSource } from "@/constants/openSource";
import { privacyPolicy } from "@/constants/privacyPolicy";
import { termsAndCondition } from "@/constants/terms&condition";

const legalItems: {
  title: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  updated: string;
  tone: "primary" | "gold" | "success" | "neutral";
}[] = [
  {
    title: "Privacy policy",
    href: "/profile/legal/privacy-policy",
    icon: "shield-checkmark-outline",
    updated: privacyPolicy.lastUpdated,
    tone: "primary",
  },
  {
    title: "Terms & conditions",
    href: "/profile/legal/terms-and-conditions",
    icon: "document-text-outline",
    updated: termsAndCondition.lastUpdated,
    tone: "gold",
  },
  {
    title: "Data deletion policy",
    href: "/profile/legal/data-deletion",
    icon: "trash-bin-outline",
    updated: dataDeletion.lastUpdated,
    tone: "success",
  },
  {
    title: "Open source licences",
    href: "/profile/legal/open-source",
    icon: "code-slash-outline",
    updated: openSource.lastUpdated,
    tone: "neutral",
  },
];

export default function LegalScreen() {
  const router = useRouter();

  return (
    <StackScreen title="Legal" subtitle="How we handle your data and the terms of using the app.">
      <FadeInView>
        <ListGroup title="Policies">
          {legalItems.map((item) => (
            <ListRow
              key={item.href}
              icon={item.icon}
              tone={item.tone}
              title={item.title}
              subtitle={`Updated ${item.updated}`}
              onPress={() => router.push(item.href as Href)}
            />
          ))}
        </ListGroup>
      </FadeInView>
    </StackScreen>
  );
}
