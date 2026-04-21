import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type SplashScreenProps = {
  label?: string;
};

const STAR_COUNT = 12;
const STAR_RING_SIZE = 58;
const STAR_SIZE = 9;
const STAR_RADIUS = STAR_RING_SIZE / 2 - STAR_SIZE;

function RotatingStarCircle() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3200,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-[#0B3DBA]">
      <View className="absolute left-3 top-3 h-7 w-9 rounded-full bg-white opacity-20" />
      <View className="absolute bottom-2 right-2 h-8 w-10 rounded-full bg-[#082C8F] opacity-35" />

      <Animated.View
        style={[
          {
            height: STAR_RING_SIZE,
            width: STAR_RING_SIZE,
          },
          rotatingStyle,
        ]}
      >
        {Array.from({ length: STAR_COUNT }).map((_, index) => {
          const angle = (index / STAR_COUNT) * Math.PI * 2 - Math.PI / 2;
          const x =
            Math.cos(angle) * STAR_RADIUS + STAR_RING_SIZE / 2 - STAR_SIZE / 2;
          const y =
            Math.sin(angle) * STAR_RADIUS + STAR_RING_SIZE / 2 - STAR_SIZE / 2;

          return (
            <Ionicons
              key={`splash-star-${index}`}
              name="star"
              size={STAR_SIZE}
              color="#FFE95C"
              style={{
                position: "absolute",
                left: x,
                top: y,
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

export function SplashScreen({
  label = "Loading EU Work Support",
}: SplashScreenProps) {
  return (
    <SafeAreaView
      accessibilityLabel={label}
      className="flex-1 bg-diplomatic-primary"
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />

      <View className="flex-1 items-center justify-center px-8">
        <View className="h-[104px] w-[104px] items-center justify-center rounded-interactive bg-white shadow-sm">
          <RotatingStarCircle />
        </View>

        <Text className="mt-7 text-center text-[30px] font-extrabold leading-9 tracking-normal text-white">
          EU Work Support
        </Text>
        <Text className="mt-3 text-center text-base font-medium leading-6 tracking-normal text-[#E8F1FF]">
          Country-wise immigration and work guidance for Europe
        </Text>

        <View className="mt-6 flex-row items-center rounded-interactive bg-[#0F62D6] px-4 py-3">
          <Ionicons name="lock-closed-outline" size={16} color="#DCEBFF" />
          <Text className="ml-2 text-sm font-extrabold tracking-normal text-white">
            Trusted guidance hub
          </Text>
        </View>

        <Text className="mt-7 text-center text-sm font-extrabold tracking-normal text-[#E8F1FF]">
          29 European destinations
        </Text>
      </View>
    </SafeAreaView>
  );
}
