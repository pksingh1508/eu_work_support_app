import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';

const filters = ['All Regions', 'Top Rated', 'Easiest Visa'];

const destinations = [
  {
    country: 'Netherlands',
    flag: 'https://flagcdn.com/w80/nl.png',
    summary: 'Excellent work-life balance.',
  },
  {
    country: 'France',
    flag: 'https://flagcdn.com/w80/fr.png',
    summary: 'Tech Visa program active.',
  },
];

export function HomeDemo() {
  return (
    <ScrollView className="flex-1 bg-diplomatic-surface" showsVerticalScrollIndicator={false}>
      <SafeAreaView edges={['top']} className="px-5 pt-2" style={{ paddingBottom: BottomTabInset }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-[24px] font-extrabold tracking-normal text-diplomatic-ink">
            The Sovereign Guide
          </Text>
          <Image
            source={{ uri: 'https://i.pravatar.cc/96?img=12' }}
            style={{ width: 28, height: 28, borderRadius: 14 }}
            contentFit="cover"
          />
        </View>

        <View className="mt-8">
          <Text className="text-[32px] font-extrabold leading-9 tracking-normal text-diplomatic-ink">
            Welcome, Alex
          </Text>
          <Text className="mt-2 text-[17px] font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
            Your journey to working in Europe begins here.
          </Text>
        </View>

        <View className="mt-7 h-14 flex-row items-center rounded-interactive bg-white px-4">
          <Ionicons name="search" size={18} color="#A2A8B8" />
          <Text className="ml-3 text-[15px] font-semibold tracking-normal text-[#9EA5B4]">
            Search countries, visas, or roles...
          </Text>
        </View>

        <View className="mt-8 flex-row gap-3">
          {filters.map((filter, index) => (
            <View
              key={filter}
              className={`h-10 items-center justify-center rounded-full px-5 ${
                index === 0 ? 'bg-diplomatic-surfaceHigh' : 'bg-white'
              }`}>
              <Text
                className={`text-sm font-extrabold tracking-normal ${
                  index === 0 ? 'text-diplomatic-primary' : 'text-diplomatic-secondaryText'
                }`}>
                {filter}
              </Text>
            </View>
          ))}
        </View>

        <Text className="mt-12 text-[25px] font-extrabold tracking-normal text-diplomatic-ink">
          Popular Destinations
        </Text>

        <View className="mt-5 overflow-hidden rounded-atelier bg-diplomatic-ink">
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80',
            }}
            style={{ height: 260, width: '100%', opacity: 0.55 }}
            contentFit="cover"
          />
          <View className="absolute inset-0 justify-end p-5">
            <View className="absolute inset-x-0 bottom-0 h-28 bg-diplomatic-ink opacity-50" />
            <View className="mb-6 flex-row items-center gap-2">
              <Image
                source={{ uri: 'https://flagcdn.com/w80/de.png' }}
                style={{ width: 28, height: 18, borderRadius: 3 }}
                contentFit="cover"
              />
              <View className="rounded-full bg-[#8B2330] px-3 py-1">
                <Text className="text-xs font-extrabold uppercase tracking-normal text-white">
                  High Demand
                </Text>
              </View>
            </View>
            <View className="flex-row items-end justify-between gap-4">
              <View className="flex-1">
                <Text className="text-[29px] font-extrabold tracking-normal text-white">
                  Germany
                </Text>
                <Text className="mt-1 text-[15px] font-semibold leading-5 tracking-normal text-white opacity-85">
                  Leading tech hub with streamlined visa options.
                </Text>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
                <Ionicons name="arrow-forward" size={22} color="#0058BC" />
              </View>
            </View>
          </View>
        </View>

        <View className="mt-6 gap-5">
          {destinations.map((destination) => (
            <View
              key={destination.country}
              className="min-h-[120px] rounded-atelier bg-white px-5 py-5">
              <View className="flex-row items-start justify-between">
                <Image
                  source={{ uri: destination.flag }}
                  style={{ width: 30, height: 20, borderRadius: 3 }}
                  contentFit="cover"
                />
                <Ionicons name="bookmark" size={20} color="#7C8497" />
              </View>
              <Text className="mt-7 text-[20px] font-extrabold tracking-normal text-diplomatic-ink">
                {destination.country}
              </Text>
              <Text className="mt-1 text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
                {destination.summary}
              </Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
