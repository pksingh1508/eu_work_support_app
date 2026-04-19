import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthProfile } from "@/features/auth/auth-profile";
import {
  ExploreCountriesSlide,
  onboardingSlideCount,
  SaveGuidesSlide,
  SupportSlide,
  VisaGuidanceSlide,
} from "@/features/onboarding/components/onboarding-slides";
import { supabase } from "@/lib/supabase";

const slides = [
  ExploreCountriesSlide,
  VisaGuidanceSlide,
  SaveGuidesSlide,
  SupportSlide,
];

type SlideDirection = "forward" | "back";

function isSupabaseJwtDecodeError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "PGRST301"
  );
}

export default function OnboardingStartScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { markOnboardingCompleted } = useAuthProfile();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] =
    useState<SlideDirection>("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ActiveSlide = slides[activeIndex];
  const isLastSlide = activeIndex === onboardingSlideCount - 1;

  const changeSlide = (nextIndex: number, direction: SlideDirection) => {
    setError(null);
    setSlideDirection(direction);
    setActiveIndex(nextIndex);
  };

  const goPrevious = () => {
    changeSlide(Math.max(activeIndex - 1, 0), "back");
  };

  const goNextSlide = () => {
    changeSlide(Math.min(activeIndex + 1, onboardingSlideCount - 1), "forward");
  };

  const swipeGesture = Gesture.Exclusive(
    Gesture.Fling()
      .direction(Directions.LEFT)
      .onEnd(() => {
        if (!isLastSlide) {
          goNextSlide();
        }
      })
      .runOnJS(true),
    Gesture.Fling()
      .direction(Directions.RIGHT)
      .onEnd(() => {
        if (activeIndex > 0) {
          goPrevious();
        }
      })
      .runOnJS(true),
  );

  const completeOnboarding = async () => {
    if (!userId || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await supabase.rpc("ensure_user_profile");

      const { error: profileError } = await supabase
        .from("app_users")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", userId);

      if (profileError) {
        throw profileError;
      }

      markOnboardingCompleted();
      router.replace("/");
    } catch (submitError) {
      console.warn("Unable to complete onboarding", submitError);
      setError(
        isSupabaseJwtDecodeError(submitError)
          ? "Supabase cannot verify the Clerk session yet. Enable Clerk under Supabase Auth > Third-Party Auth, then sign out and sign in again."
          : "We could not finish onboarding yet. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (isLastSlide) {
      void completeOnboarding();
      return;
    }

    goNextSlide();
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="min-h-full px-6 pb-8 pt-5"
      >
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-end">
            <Pressable
              onPress={completeOnboarding}
              disabled={isSubmitting}
              hitSlop={12}
            >
              <Text className="text-base font-bold tracking-normal text-diplomatic-secondaryText">
                Skip
              </Text>
            </Pressable>
          </View>

          <GestureDetector gesture={swipeGesture}>
            <View className="mt-5 flex-1">
              <Animated.View
                key={activeIndex}
                entering={(slideDirection === "forward"
                  ? SlideInRight
                  : SlideInLeft
                )
                  .duration(240)
                  .damping(18)
                  .stiffness(180)
                  .withInitialValues({
                    opacity: 0,
                    transform: [
                      { translateX: slideDirection === "forward" ? 80 : -80 },
                    ],
                  })}
                exiting={(slideDirection === "forward"
                  ? SlideOutLeft
                  : SlideOutRight
                )
                  .duration(180)
                  .withInitialValues({ opacity: 1 })}
                className="flex-1"
              >
                <Animated.View
                  entering={FadeIn.duration(180)}
                  exiting={FadeOut.duration(120)}
                >
                  <ActiveSlide activeIndex={activeIndex} />
                </Animated.View>
              </Animated.View>
            </View>
          </GestureDetector>

          {error ? (
            <View className="mt-5 rounded-interactive bg-[#FFEDEA] px-4 py-3">
              <Text className="text-sm font-semibold tracking-normal text-[#BA1A1A]">
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={goNext}
            disabled={isSubmitting}
            className="mt-5 h-14 items-center justify-center rounded-interactive bg-diplomatic-primary active:opacity-80 disabled:opacity-60"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-extrabold tracking-normal text-white">
                {isLastSlide ? "Get Started" : "Next"} {"->"}
              </Text>
            )}
          </Pressable>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
