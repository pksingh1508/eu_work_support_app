import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UnAuthenticatedProps = {
  title?: string;
  message?: string;
  returnTo?: string;
};

export function UnAuthenticated({
  title = "Login or Request Access",
  message = "if you have Access, click Login. Otherwise click Request Access to get Access.",
  returnTo,
}: UnAuthenticatedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const nextReturnTo = returnTo ?? pathname;

  const openLogin = () => {
    router.push({
      pathname: "/sign-in",
      params: { returnTo: nextReturnTo },
    });
  };

  const openVerify = () => {
    router.push(`/verify?returnTo=${encodeURIComponent(nextReturnTo)}` as Href);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <View className="flex-1 justify-center px-5 py-8">
        <View className="rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-7">
          <View className="h-14 w-14 items-center justify-center rounded-[22px] bg-[#EEF7FF]">
            <Ionicons name="lock-closed-outline" size={26} color="#1E7AF2" />
          </View>

          <Text className="mt-6 text-[28px] font-serif font-extrabold leading-9 tracking-normal text-diplomatic-ink">
            {title}
          </Text>
          <Text className="mt-3 text-base font-semibold leading-7 tracking-normal text-diplomatic-secondaryText">
            {message}
          </Text>

          <View className="mt-7 gap-3">
            <Pressable
              onPress={openLogin}
              className="h-14 flex-row items-center justify-center rounded-[22px] bg-diplomatic-primary active:opacity-80"
              accessibilityRole="button"
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 text-base font-extrabold tracking-normal text-white">
                Login
              </Text>
            </Pressable>

            <Pressable
              onPress={openVerify}
              className="h-14 flex-row items-center justify-center rounded-[22px] border border-[#CFE0F7] bg-[#EEF7FF] active:opacity-80"
              accessibilityRole="button"
            >
              <Ionicons name="mail-unread-outline" size={20} color="#1E7AF2" />
              <Text className="ml-2 text-base font-extrabold tracking-normal text-diplomatic-primary">
                Request Access
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
