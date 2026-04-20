import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  easiestVisaCountries,
  europeanCountryNames,
  popularDestinations,
  topRated,
} from "@/constants/country";
import { BottomTabInset } from "@/constants/theme";

type FilterKey = "all" | "top-rated" | "easiest-visa";

type CountryName = (typeof europeanCountryNames)[number];

type CountryDetails = {
  code: string;
  summary: string;
  demand: string;
};

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All Regions" },
  { key: "top-rated", label: "Top Rated" },
  { key: "easiest-visa", label: "Easiest Visa" },
];

const countryDetails: Record<CountryName, CountryDetails> = {
  Austria: {
    code: "at",
    summary: "High quality of life with skilled worker routes.",
    demand: "Skilled route",
  },
  Belgium: {
    code: "be",
    summary: "Central EU base with multilingual job markets.",
    demand: "EU hub",
  },
  Bulgaria: {
    code: "bg",
    summary: "Lower living costs and growing tech opportunities.",
    demand: "Budget friendly",
  },
  Croatia: {
    code: "hr",
    summary: "Coastal lifestyle with work and residence options.",
    demand: "Coastal jobs",
  },
  "Czech Republic": {
    code: "cz",
    summary: "Strong manufacturing and IT job market.",
    demand: "Work permits",
  },
  Denmark: {
    code: "dk",
    summary: "Stable work culture and high salary potential.",
    demand: "High salary",
  },
  Estonia: {
    code: "ee",
    summary: "Digital-first country with startup visa options.",
    demand: "Startup friendly",
  },
  Finland: {
    code: "fi",
    summary: "Clean, calm, and strong for skilled professionals.",
    demand: "Talent routes",
  },
  France: {
    code: "fr",
    summary: "Tech visa program active.",
    demand: "Tech visa",
  },
  Germany: {
    code: "de",
    summary: "Leading tech hub with streamlined visa options.",
    demand: "High demand",
  },
  Greece: {
    code: "gr",
    summary: "Helpful routes for work, study, and long stays.",
    demand: "Fresh guide",
  },
  Hungary: {
    code: "hu",
    summary: "Central location with accessible residence options.",
    demand: "Central Europe",
  },
  Iceland: {
    code: "is",
    summary: "Small market with unique skilled work needs.",
    demand: "Niche roles",
  },
  Italy: {
    code: "it",
    summary: "Culture-rich destination with annual work quotas.",
    demand: "Quota route",
  },
  Latvia: {
    code: "lv",
    summary: "Baltic destination with practical residence pathways.",
    demand: "Baltic route",
  },
  Liechtenstein: {
    code: "li",
    summary: "Small, premium labor market with strict permits.",
    demand: "Limited permits",
  },
  Lithuania: {
    code: "lt",
    summary: "Growing tech sector and Baltic work opportunities.",
    demand: "Tech growth",
  },
  Luxembourg: {
    code: "lu",
    summary: "Finance-led market with strong salaries.",
    demand: "Finance hub",
  },
  Malta: {
    code: "mt",
    summary: "English-friendly island with service jobs.",
    demand: "English friendly",
  },
  Netherlands: {
    code: "nl",
    summary: "Excellent work-life balance.",
    demand: "Top rated",
  },
  Norway: {
    code: "no",
    summary: "High income destination with skilled job demand.",
    demand: "High income",
  },
  Poland: {
    code: "pl",
    summary: "Fast-growing market with clear work permit routes.",
    demand: "Fast growth",
  },
  Portugal: {
    code: "pt",
    summary: "Popular for remote work and residence planning.",
    demand: "Remote work",
  },
  Romania: {
    code: "ro",
    summary: "Growing EU market with accessible cost of living.",
    demand: "Growing market",
  },
  Slovakia: {
    code: "sk",
    summary: "Manufacturing and service jobs in central Europe.",
    demand: "Industry jobs",
  },
  Slovenia: {
    code: "si",
    summary: "Compact EU destination with quality living.",
    demand: "Quality life",
  },
  Spain: {
    code: "es",
    summary: "Popular for study, work, and digital nomad plans.",
    demand: "Popular choice",
  },
};

const popularDestinationImages: Record<
  (typeof popularDestinations)[number],
  string
> = {
  France:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
  Germany:
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80",
  Greece:
    "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?auto=format&fit=crop&w=900&q=80",
};

function getCountrySlug(country: string) {
  return country
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFlagUrl(country: CountryName) {
  return `https://flagcdn.com/w80/${countryDetails[country].code}.png`;
}

export function HomeDemo() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredCountries = useMemo(() => {
    if (activeFilter === "top-rated") {
      return topRated;
    }

    if (activeFilter === "easiest-visa") {
      return easiestVisaCountries;
    }

    return europeanCountryNames;
  }, [activeFilter]);

  const openCountry = (country: CountryName) => {
    router.push(`/country/${getCountrySlug(country)}`);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        stickyHeaderIndices={[1]}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-7">
          <Text className="text-[32px] font-extrabold leading-9 tracking-normal text-diplomatic-ink">
            Welcome
          </Text>
          <Text className="mt-2 text-[17px] font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
            Your journey to working in Europe begins here.
          </Text>
        </View>

        <View className="bg-diplomatic-surface px-5 pb-4 pt-7">
          <Pressable
            onPress={() => router.push("/search")}
            className="h-14 flex-row items-center rounded-interactive bg-white px-4"
            accessibilityRole="button"
          >
            <Ionicons name="search" size={20} color="#7C8497" />
            <Text className="ml-3 text-[15px] font-semibold tracking-normal text-[#7C8497]">
              Search countries, visas, or roles...
            </Text>
          </Pressable>
        </View>

        <View className="pt-4">
          <View className="px-5">
            <Text className="text-[25px] font-extrabold tracking-normal text-diplomatic-ink">
              Popular Destinations
            </Text>
          </View>

          <ScrollView
            horizontal
            className="mt-5"
            contentContainerClassName="gap-4 px-5"
            showsHorizontalScrollIndicator={false}
          >
            {popularDestinations.map((country) => (
              <PopularDestinationCard
                key={country}
                country={country}
                onPress={openCountry}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            className="mt-8"
            contentContainerClassName="gap-3 px-5"
            showsHorizontalScrollIndicator={false}
          >
            {filters.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  className={`h-10 items-center justify-center rounded-full px-5 ${
                    isActive ? "bg-diplomatic-surfaceHigh" : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-extrabold tracking-normal ${
                      isActive
                        ? "text-diplomatic-primary"
                        : "text-diplomatic-secondaryText"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="mt-6 gap-5 px-5">
            {filteredCountries.map((country) => (
              <CountryListCard
                key={country}
                country={country}
                onPress={openCountry}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PopularDestinationCard({
  country,
  onPress,
}: {
  country: (typeof popularDestinations)[number];
  onPress: (country: CountryName) => void;
}) {
  const details = countryDetails[country];

  return (
    <Pressable
      onPress={() => onPress(country)}
      className="h-[260px] w-[310px] overflow-hidden rounded-atelier bg-diplomatic-ink"
      accessibilityRole="button"
    >
      <Image
        source={{ uri: popularDestinationImages[country] }}
        style={{ height: 260, width: "100%", opacity: 0.55 }}
        contentFit="cover"
      />
      <View className="absolute inset-0 justify-end p-5">
        <View className="absolute inset-x-0 bottom-0 h-28 bg-diplomatic-ink opacity-50" />
        <View className="mb-6 flex-row items-center gap-2">
          <Image
            source={{ uri: getFlagUrl(country) }}
            style={{ width: 28, height: 18, borderRadius: 3 }}
            contentFit="cover"
          />
          <View className="rounded-full bg-[#8B2330] px-3 py-1">
            <Text className="text-xs font-extrabold uppercase tracking-normal text-white">
              {details.demand}
            </Text>
          </View>
        </View>
        <View className="flex-row items-end justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[29px] font-extrabold tracking-normal text-white">
              {country}
            </Text>
            <Text className="mt-1 text-[15px] font-semibold leading-5 tracking-normal text-white opacity-85">
              {details.summary}
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
            <Ionicons name="arrow-forward" size={22} color="#0058BC" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CountryListCard({
  country,
  onPress,
}: {
  country: CountryName;
  onPress: (country: CountryName) => void;
}) {
  const details = countryDetails[country];

  return (
    <Pressable
      onPress={() => onPress(country)}
      className="min-h-[120px] rounded-atelier bg-white px-5 py-5"
      accessibilityRole="button"
    >
      <View className="flex-row items-start justify-between">
        <Image
          source={{ uri: getFlagUrl(country) }}
          style={{ width: 30, height: 20, borderRadius: 3 }}
          contentFit="cover"
        />
        <Ionicons name="bookmark" size={20} color="#7C8497" />
      </View>
      <Text className="mt-7 text-[20px] font-extrabold tracking-normal text-diplomatic-ink">
        {country}
      </Text>
      <Text className="mt-1 text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
        {details.summary}
      </Text>
    </Pressable>
  );
}
