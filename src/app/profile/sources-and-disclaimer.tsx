import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@euworksupport.eu";

const sourceParagraphs = [
  "Information available within the application is researched from publicly available sources, including official government websites, European Union portals, embassy and consulate websites, official immigration authority websites, and official university or college websites.",
  "Our team reviews, simplifies, and organizes the information to make it easier for users to understand. We do not copy or reproduce complete third-party articles.",
];

const disclaimerParagraphs = [
  "Immigration rules, visa requirements, university information, document requirements, fees, and application procedures may change without notice. Users should always confirm the latest information directly with the relevant official authority before making an application or financial decision.",
  "EU Work Support does not provide legal, immigration, financial, recruitment, or professional advice. Information provided through the app should not be considered a substitute for advice from a qualified professional or authorized government authority.",
];

export default function SourcesAndDisclaimerScreen() {
  const router = useRouter();

  const openSupportEmail = () => {
    void Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Report outdated information")}`,
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-12 pt-7"
        showsVerticalScrollIndicator={false}
      >
        <Header onBack={() => router.back()} />

        <View className="mt-8 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-6">
          <View className="h-[54px] w-[54px] items-center justify-center rounded-[20px] bg-[#F0F4FF]">
            <Ionicons name="shield-checkmark-outline" size={27} color="#315EA8" />
          </View>
          <Text className="mt-5 text-[26px] font-extrabold leading-8 tracking-normal text-[#202124]">
            Independent information, clearly sourced
          </Text>
          <Text className="mt-4 text-base font-semibold leading-7 tracking-normal text-[#5F6673]">
            EU Work Support is an independent educational and informational application. We are not affiliated with, endorsed by, or officially connected to any government, embassy, consulate, immigration authority, visa office, university, college, or employment authority.
          </Text>
        </View>

        <ContentSection
          icon="library-outline"
          title="Our sources"
          paragraphs={sourceParagraphs}
        />

        <ContentSection
          icon="alert-circle-outline"
          title="Disclaimer"
          paragraphs={disclaimerParagraphs}
        />

        <ContentSection
          icon="checkmark-circle-outline"
          title="Content review process"
          paragraphs={[
            "Our content is periodically reviewed against the official sources linked within each article. The “Last reviewed” date indicates when the information was most recently checked by our content team.",
          ]}
        />

        <View className="mt-4 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-6">
          <SectionHeading icon="chatbox-ellipses-outline" title="Reporting outdated information" />
          <Text className="mt-4 text-base font-semibold leading-7 tracking-normal text-[#5F6673]">
            Users can report inaccurate or outdated information through the Contact Support option available within the app or by emailing
          </Text>
          <Pressable
            onPress={openSupportEmail}
            className="mt-3 min-h-11 self-start justify-center rounded-xl bg-[#F0F4FF] px-4 active:opacity-75"
            accessibilityRole="link"
            accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
          >
            <Text className="text-base font-extrabold tracking-normal text-[#315EA8]">
              {SUPPORT_EMAIL}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full border border-[#E6E6EA] bg-white active:opacity-75"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={21} color="#202124" />
      </Pressable>
      <Text className="ml-4 min-w-0 flex-1 text-[25px] font-extrabold leading-8 tracking-normal text-[#202124]">
        Sources and Disclaimer
      </Text>
    </View>
  );
}

function ContentSection({
  icon,
  title,
  paragraphs,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  paragraphs: string[];
}) {
  return (
    <View className="mt-4 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-6">
      <SectionHeading icon={icon} title={title} />
      <View className="mt-4 gap-4">
        {paragraphs.map((paragraph) => (
          <Text
            key={paragraph}
            className="text-base font-semibold leading-7 tracking-normal text-[#5F6673]"
          >
            {paragraph}
          </Text>
        ))}
      </View>
    </View>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="flex-row items-center">
      <View className="h-10 w-10 items-center justify-center rounded-[15px] bg-[#F4F4F5]">
        <Ionicons name={icon} size={21} color="#202124" />
      </View>
      <Text className="ml-3 min-w-0 flex-1 text-xl font-extrabold leading-7 tracking-normal text-[#202124]">
        {title}
      </Text>
    </View>
  );
}
