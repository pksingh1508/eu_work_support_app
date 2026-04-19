import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

type OnboardingSlideProps = {
  activeIndex: number;
};

const countryCards = [
  { code: 'DE', name: 'Germany' },
  { code: 'PL', name: 'Poland' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
];

const workbenchItems = [
  {
    icon: 'document-text-outline' as const,
    title: 'Visa details',
    subtitle: 'Eligibility, duration, fees',
  },
  {
    icon: 'briefcase-outline' as const,
    title: 'Work permit process',
    subtitle: 'Employer, authority, timelines',
  },
  {
    icon: 'clipboard-outline' as const,
    title: 'Required documents',
    subtitle: 'Checklist by destination',
  },
];

const savedGuides = [
  { code: 'DE', title: 'Germany Blue Card', subtitle: 'Documents and salary threshold' },
  { code: 'PL', title: 'Poland Work Permit', subtitle: 'Employer application steps' },
  { code: 'FR', title: 'France Talent Passport', subtitle: 'Visa overview and checklist' },
];

export const onboardingSlideCount = 4;

export function ExploreCountriesSlide({ activeIndex }: OnboardingSlideProps) {
  return (
    <OnboardingSlideFrame activeIndex={activeIndex}>
      <View className="rounded-interactive border border-[#D8E2F1] bg-[#F4F7FC] px-5 py-6">
        <View className="flex-row items-center justify-between">
          <View className="h-[88px] w-[88px] items-center justify-center rounded-interactive bg-diplomatic-primary">
            <Ionicons name="globe-outline" size={48} color="#FFFFFF" />
          </View>
          <View className="flex-row items-center rounded-interactive border border-[#E1E6EF] bg-white px-4 py-3">
            <Ionicons name="location-outline" size={15} color="#0058BC" />
            <Text className="ml-2 text-sm font-extrabold tracking-normal text-diplomatic-ink">
              29 countries
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap gap-3">
          {countryCards.map((country) => (
            <View
              key={country.code}
              className="h-14 min-w-[145px] flex-1 flex-row items-center rounded-interactive border border-[#E1E6EF] bg-white px-4">
              <CountryIcon code={country.code} />
              <Text className="ml-3 text-base font-extrabold tracking-normal text-diplomatic-ink">
                {country.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <SlideCopy
        title="Explore Europe by country"
        description="Find immigration, visa, and work guidance organized around each destination you care about."
      />
    </OnboardingSlideFrame>
  );
}

export function VisaGuidanceSlide({ activeIndex }: OnboardingSlideProps) {
  return (
    <OnboardingSlideFrame activeIndex={activeIndex} eyebrow="Guidance">
      <View className="rounded-interactive bg-[#090E17] p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-extrabold tracking-normal text-white">Visa Workbench</Text>
          <View className="flex-row items-center rounded-interactive bg-diplomatic-primary px-3 py-2">
            <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
            <Text className="ml-2 text-sm font-extrabold tracking-normal text-white">Updated</Text>
          </View>
        </View>

        <View className="mt-3 gap-3">
          {workbenchItems.map((item) => (
            <View key={item.title} className="flex-row items-center rounded-interactive bg-white px-4 py-4">
              <View className="h-10 w-10 items-center justify-center rounded-interactive bg-[#EDF4FF]">
                <Ionicons name={item.icon} size={22} color="#1D7BF0" />
              </View>
              <View className="ml-4">
                <Text className="text-base font-extrabold tracking-normal text-diplomatic-ink">
                  {item.title}
                </Text>
                <Text className="mt-1 text-sm font-medium tracking-normal text-diplomatic-secondaryText">
                  {item.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <SlideCopy
        title="Visa, permits, documents in one place"
        description="Read clear guidance for each country without jumping between scattered sources."
      />
    </OnboardingSlideFrame>
  );
}

export function SaveGuidesSlide({ activeIndex }: OnboardingSlideProps) {
  return (
    <OnboardingSlideFrame activeIndex={activeIndex} eyebrow="Save">
      <View className="rounded-interactive border border-[#D8E2F1] bg-[#F4F7FC] p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="bookmark-outline" size={22} color="#1D7BF0" />
            <Text className="ml-3 text-base font-extrabold tracking-normal text-diplomatic-ink">
              Saved guides
            </Text>
          </View>
          <Text className="text-sm font-extrabold tracking-normal text-diplomatic-secondaryText">
            12 items
          </Text>
        </View>

        <View className="gap-3">
          {savedGuides.map((guide) => (
            <View
              key={guide.title}
              className="flex-row items-center justify-between rounded-interactive border border-[#E1E6EF] bg-white px-4 py-4">
              <View className="min-w-0 flex-1 flex-row items-center">
                <CountryIcon code={guide.code} />
                <View className="ml-4 min-w-0 flex-1">
                  <Text className="text-base font-extrabold tracking-normal text-diplomatic-ink">
                    {guide.title}
                  </Text>
                  <Text className="mt-1 text-sm font-medium tracking-normal text-diplomatic-secondaryText">
                    {guide.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="bookmark-outline" size={20} color="#1D7BF0" />
            </View>
          ))}
        </View>
      </View>

      <SlideCopy
        title="Save useful details for later"
        description="Bookmark countries, document lists, visa steps, and common issues so they stay easy to reach."
      />
    </OnboardingSlideFrame>
  );
}

export function SupportSlide({ activeIndex }: OnboardingSlideProps) {
  return (
    <OnboardingSlideFrame activeIndex={activeIndex} eyebrow="Support">
      <View className="rounded-interactive border border-[#D8E2F1] bg-[#F4F7FC] p-5">
        <View className="h-28 items-center justify-center rounded-interactive bg-diplomatic-primary">
          <Ionicons name="chatbubbles-outline" size={45} color="#FFFFFF" />
          <Text className="mt-2 text-base font-extrabold tracking-normal text-white">
            Support Center
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          {[
            { icon: 'notifications-outline' as const, label: 'Alerts' },
            { icon: 'checkmark-done-outline' as const, label: 'Checklists' },
            { icon: 'mail-outline' as const, label: 'Email' },
          ].map((item) => (
            <View
              key={item.label}
              className="h-[72px] flex-1 justify-center rounded-interactive border border-[#E1E6EF] bg-white px-3">
              <Ionicons name={item.icon} size={20} color="#1D7BF0" />
              <Text className="mt-2 text-sm font-extrabold tracking-normal text-diplomatic-ink">
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-4 flex-row items-center rounded-interactive bg-[#090E17] px-4 py-4">
          <Ionicons name="shield-checkmark-outline" size={26} color="#FFFFFF" />
          <View className="ml-3">
            <Text className="text-base font-extrabold tracking-normal text-white">
              Private guidance space
            </Text>
            <Text className="mt-1 text-sm font-medium tracking-normal text-white opacity-75">
              Save, review, and ask for help
            </Text>
          </View>
        </View>
      </View>

      <SlideCopy
        title="Start with confidence"
        description="Move from country research to document preparation, issue tracking, and support without losing context."
      />
    </OnboardingSlideFrame>
  );
}

function OnboardingSlideFrame({
  activeIndex,
  eyebrow = 'EU Work Support',
  children,
}: OnboardingSlideProps & { eyebrow?: string; children: React.ReactNode }) {
  return (
    <View>
      <View className="mb-7 flex-row items-center justify-between">
        <View className="flex-row items-center">
          {eyebrow === 'EU Work Support' ? (
            <View className="mr-3 h-7 w-7 items-center justify-center rounded-interactive bg-[#EAF2FF]">
              <Ionicons name="shield-checkmark-outline" size={16} color="#1D7BF0" />
            </View>
          ) : null}
          <Text className="text-base font-extrabold tracking-normal text-diplomatic-ink">
            {eyebrow}
          </Text>
        </View>
      </View>

      {children}

      <SlideDots activeIndex={activeIndex} />
    </View>
  );
}

function SlideCopy({ title, description }: { title: string; description: string }) {
  return (
    <View className="mt-7 items-center px-3">
      <Text className="text-center text-[28px] font-extrabold leading-9 tracking-normal text-[#111827]">
        {title}
      </Text>
      <Text className="mt-4 text-center text-base leading-6 tracking-normal text-diplomatic-secondaryText">
        {description}
      </Text>
    </View>
  );
}

function SlideDots({ activeIndex }: { activeIndex: number }) {
  return (
    <View className="mt-7 flex-row justify-center gap-2">
      {Array.from({ length: onboardingSlideCount }).map((_, index) => (
        <View
          key={index}
          className={`h-1.5 rounded-full ${
            index === activeIndex ? 'w-6 bg-diplomatic-primary' : 'w-1.5 bg-[#DDE5F0]'
          }`}
        />
      ))}
    </View>
  );
}

function CountryIcon({ code }: { code: string }) {
  return (
    <View className="h-6 w-8 items-center justify-center rounded-[4px] border border-[#8F96A5] bg-white">
      <Text className="text-[11px] font-semibold tracking-normal text-diplomatic-ink">{code}</Text>
    </View>
  );
}
