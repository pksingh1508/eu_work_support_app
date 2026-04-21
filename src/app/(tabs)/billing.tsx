import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset } from "@/constants/theme";

type BillingCycle = "monthly" | "annual";

const premiumBenefits = [
  {
    icon: "checkmark-circle-outline",
    title: "Full document checklist",
    description: "Personalized to your specific nationality and destination.",
  },
  {
    icon: "people-outline",
    title: "Direct legal support",
    description: "Priority access to certified immigration experts.",
  },
  {
    icon: "language-outline",
    title: "Certified translations",
    description: "Discounted rates on official document translation.",
  },
  {
    icon: "notifications-outline",
    title: "Priority updates",
    description: "Instant alerts on policy changes affecting your case.",
  },
] satisfies {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[];

const trustItems = [
  { icon: "lock-closed-outline", label: "Bank level encryption" },
  { icon: "card-outline", label: "Secure payment via Stripe" },
  { icon: "calendar-outline", label: "Cancel anytime" },
] satisfies {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}[];

export default function BillingScreen() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const price = billingCycle === "monthly" ? "€29" : "€279";
  const cadence = billingCycle === "monthly" ? "/ month" : "/ year";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 26 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-8">
          <Text className="max-w-[280px] text-[36px] font-extrabold leading-[41px] tracking-normal text-diplomatic-ink">
            Elevate your{"\n"}
            <Text className="text-diplomatic-primary">
              European{"\n"}journey.
            </Text>
          </Text>

          <Text className="mt-4 max-w-[310px] text-base font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
            Unlock full access to expert guidance, personalized document
            checklists, and direct legal support to ensure your relocation is
            seamless and secure.
          </Text>

          <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />

          <View className="mt-8 h-1 rounded-full bg-diplomatic-primary" />

          <View className="mt-4 rounded-interactive bg-white px-5 py-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-extrabold uppercase tracking-normal text-diplomatic-primary">
                  Sovereign Premium
                </Text>
                <View className="mt-3 flex-row items-end">
                  <Text className="text-[40px] font-extrabold leading-[44px] tracking-normal text-diplomatic-ink">
                    {price}
                  </Text>
                  <Text className="mb-2 ml-2 text-sm font-extrabold tracking-normal text-diplomatic-secondaryText">
                    {cadence}
                  </Text>
                </View>
              </View>

              <View className="h-12 w-12 items-center justify-center rounded-interactive bg-diplomatic-surfaceHigh">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={25}
                  color="#0058BC"
                />
              </View>
            </View>

            <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText">
              Everything you need for a secure, confident relocation.
            </Text>

            <View className="mt-5 gap-3">
              {premiumBenefits.map((benefit) => (
                <BenefitRow key={benefit.title} {...benefit} />
              ))}
            </View>

            <Pressable
              onPress={() => router.push("/billing/paywall")}
              className="mt-6 h-14 items-center justify-center rounded-interactive bg-diplomatic-primary active:opacity-80"
              accessibilityRole="button"
            >
              <Text className="text-base font-extrabold tracking-normal text-white">
                Get Premium
              </Text>
            </Pressable>
          </View>

          <View className="mt-7 items-center gap-4">
            {trustItems.map((item) => (
              <TrustRow key={item.label} {...item} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BillingCycleToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
}) {
  return (
    <View className="mt-8 self-start flex-row rounded-full bg-white p-1">
      <CycleButton
        label="Monthly"
        isActive={value === "monthly"}
        onPress={() => onChange("monthly")}
      />
      <CycleButton
        label="Annually"
        badge="-20%"
        isActive={value === "annual"}
        onPress={() => onChange("annual")}
      />
    </View>
  );
}

function CycleButton({
  label,
  badge,
  isActive,
  onPress,
}: {
  label: string;
  badge?: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-9 flex-row items-center rounded-full px-4 ${
        isActive ? "bg-diplomatic-surfaceHigh" : "bg-transparent"
      }`}
      accessibilityRole="button"
    >
      <Text
        className={`text-sm font-extrabold tracking-normal ${
          isActive ? "text-diplomatic-ink" : "text-diplomatic-secondaryText"
        }`}
      >
        {label}
      </Text>
      {badge ? (
        <Text className="ml-2 text-xs font-extrabold tracking-normal text-diplomatic-primary">
          {badge}
        </Text>
      ) : null}
    </Pressable>
  );
}

function BenefitRow({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start rounded-interactive bg-diplomatic-surface px-3 py-3">
      <View className="h-8 w-8 items-center justify-center rounded-interactive bg-diplomatic-surfaceHigh">
        <Ionicons name={icon} size={17} color="#0058BC" />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-sm font-extrabold tracking-normal text-diplomatic-ink">
          {title}
        </Text>
        <Text className="mt-1 text-xs font-semibold leading-4 tracking-normal text-diplomatic-secondaryText">
          {description}
        </Text>
      </View>
    </View>
  );
}

function TrustRow({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={15} color="#7C8497" />
      <Text className="ml-2 text-sm font-extrabold tracking-normal text-diplomatic-secondaryText">
        {label}
      </Text>
    </View>
  );
}
