import { useRouter } from "expo-router";

import { FadeInView } from "@/components/ui/fade-in-view";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { StackScreen } from "@/components/ui/stack-screen";

export default function ProfileHelpScreen() {
  const router = useRouter();

  return (
    <StackScreen title="Help centre" subtitle="Answers, support and the fine print — all in one place.">
      <FadeInView>
        <ListGroup>
          <ListRow
            icon="help-buoy-outline"
            tone="gold"
            title="FAQ"
            subtitle="Quick answers to common questions"
            onPress={() => router.push("/profile/faq")}
          />
          <ListRow
            icon="chatbubbles-outline"
            tone="success"
            title="Support"
            subtitle="Contact us or report a problem"
            onPress={() => router.push("/profile/support")}
          />
          <ListRow
            icon="document-text-outline"
            title="Legal"
            subtitle="Privacy, terms and licences"
            onPress={() => router.push("/profile/legal")}
          />
        </ListGroup>
      </FadeInView>
    </StackScreen>
  );
}
