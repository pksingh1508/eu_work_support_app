# AGENT.md — Expo Mobile App Design & Development Rules

> These rules are mandatory and must be followed in every component, screen, and feature
> of this Expo app. No exceptions unless explicitly overridden by the user.

---

## 1. PROJECT STACK

- **Framework**: Expo (SDK latest) with React Native
- **Navigation**: Expo Router (file-based routing)
- **Styling**: StyleSheet API + design tokens (no inline styles unless trivial)
- **State**: Zustand (local/global), React Query (server state)
- **Icons**: `@expo/vector-icons` (Ionicons preferred)
- **Fonts**: Expo Google Fonts (`expo-font` + `useFonts`)

---

## 2. FOLDER STRUCTURE

```
app/                   # Expo Router screens (file-based)
  (tabs)/              # Tab-based screens
  _layout.tsx          # Root layout
components/
  ui/                  # Reusable atomic UI components (Button, Card, Input…)
  shared/              # Business-specific shared components
constants/
  colors.ts            # Design token: color palette
  typography.ts        # Design token: font sizes, weights, families
  spacing.ts           # Design token: spacing scale
  theme.ts             # Combined theme export
hooks/                 # Custom React hooks
store/                 # Zustand stores
utils/                 # Pure utility functions
assets/
  fonts/
  images/
```

---

## 3. DESIGN TOKENS (MANDATORY)

Always import from `constants/`. Never hardcode colors, font sizes, or spacing values.

### Colors (`constants/colors.ts`)

```ts
export const Colors = {
  primary: "#YOUR_PRIMARY",
  secondary: "#YOUR_SECONDARY",
  accent: "#YOUR_ACCENT",
  background: "#YOUR_BG",
  surface: "#YOUR_SURFACE",
  textPrimary: "#YOUR_TEXT",
  textSecondary: "#YOUR_MUTED",
  border: "#YOUR_BORDER",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
};
```

### Spacing (`constants/spacing.ts`)

```ts
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Typography (`constants/typography.ts`)

```ts
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};
```

---

## 4. COMPONENT RULES

### 4.1 General

- Every component must be a **typed functional component** with `React.FC` or explicit props interface.
- Props interface must be defined above the component, named `[ComponentName]Props`.
- No anonymous default exports. Always name your component.

```tsx
// ✅ Correct
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
}

const Button: React.FC<ButtonProps> = ({ label, onPress, variant = 'primary' }) => { ... };
export default Button;

// ❌ Wrong
export default ({ label, onPress }) => { ... };
```

### 4.2 Styling

- Use `StyleSheet.create()` at the **bottom** of every file.
- Style objects go after the component, before the export.
- Use design tokens for all values.
- No magic numbers.

```tsx
// ✅ Correct
const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
});

// ❌ Wrong
style={{ padding: 16, backgroundColor: '#fff', borderRadius: 12 }}
```

### 4.3 Reusability

- Extract any UI element used more than once into `components/ui/`.
- Never copy-paste styles between screens — abstract into a shared component.

---

## 5. SCREEN RULES

- Every screen lives in the `app/` directory (Expo Router convention).
- Screens must use `SafeAreaView` from `react-native-safe-area-context`.
- Use `KeyboardAvoidingView` on screens with inputs.
- Wrap scrollable content in `ScrollView` with `showsVerticalScrollIndicator={false}`.
- Every screen must define a `<Stack.Screen options={{ title: '...' }} />` or equivalent.

```tsx
// Screen template
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
```

---

## 6. TYPOGRAPHY RULES

- Use a **custom font** loaded via `expo-font`. Never rely on system default.
- Body text: use `FontSize.md` (15px).
- Headings: use `FontSize.xl` or above.
- Always set `lineHeight` = `fontSize * 1.5` for body, `fontSize * 1.25` for headings.
- Limit font weights to: Regular (400), SemiBold (600), Bold (700).
- Avoid `fontStyle: 'italic'` unless intentional for branding.

---

## 7. SPACING & LAYOUT RULES

- Use the spacing scale from `constants/spacing.ts` everywhere.
- Horizontal padding for screens: `Spacing.md` (16px) minimum.
- Card inner padding: `Spacing.md`.
- Between list items: `Spacing.sm` gap.
- Section separation: `Spacing.lg` or `Spacing.xl`.
- Never use `margin` on the outermost container of a reusable component — let the parent control spacing.

---

## 8. TOUCH & INTERACTION RULES

- Use `Pressable` (not `TouchableOpacity`) for all tappable elements.
- Every pressable must have a visual feedback state (`pressed` style).
- Minimum touch target size: **44x44 px** (Apple HIG & Android guideline).
- Add `activeOpacity`-equivalent using `style={({ pressed }) => [styles.btn, pressed && styles.pressed]}`.
- Debounce rapid taps on actions (form submits, API calls) using a `loading` state.

```tsx
<Pressable
  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
  onPress={onPress}
  disabled={loading}
>
  <Text style={styles.label}>{label}</Text>
</Pressable>
```

---

## 9. NAVIGATION RULES

- Use **Expo Router** exclusively. No manual `react-navigation` setup.
- Use `router.push()` for forward navigation, `router.back()` for back.
- Pass only **primitive values** via route params (no objects).
- Use `(tabs)` group for tab navigation, `(auth)` group for auth flow.
- Always define loading and error states for data-dependent screens before rendering content.

---

## 10. IMAGES & ASSETS

- Use `expo-image` (`Image` from `expo-image`) instead of React Native's built-in `Image` for caching and performance.
- Always define explicit `width` and `height` on images (no layout thrash).
- Use `contentFit="cover"` or `contentFit="contain"` explicitly.
- Store static assets in `assets/images/`. Use `require()` for local images.
- Provide `accessibilityLabel` on every image.

---

## 11. ACCESSIBILITY (A11Y)

- Every interactive element must have `accessibilityLabel` and `accessibilityRole`.
- Use `accessibilityHint` for non-obvious actions.
- Ensure color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text.
- Test with VoiceOver (iOS) and TalkBack (Android) for major flows.
- Never convey information through color alone (add icons or text).

---

## 12. PERFORMANCE RULES

- Use `React.memo()` on list item components.
- Use `useCallback()` for functions passed as props.
- Use `useMemo()` for expensive derived values.
- For lists, always use `FlatList` or `FlashList` (`@shopify/flash-list`) — never `map()` inside `ScrollView` for large datasets.
- Set `keyExtractor` explicitly on every list.
- Avoid anonymous functions in JSX for performance-sensitive components.

```tsx
// ✅ FlashList for large lists
<FlashList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  estimatedItemSize={80}
/>
```

---

## 13. ERROR & LOADING STATES

Every data-fetching screen/component must handle all three states:

```tsx
if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
if (!data) return <EmptyState message="Nothing here yet." />;
return <ActualContent data={data} />;
```

- `LoadingSpinner`, `ErrorState`, and `EmptyState` must be shared components in `components/ui/`.

---

## 14. DARK MODE

- Support both light and dark mode using `useColorScheme()` from React Native.
- Define separate color sets in `constants/colors.ts`:
  ```ts
  export const LightColors = { ... };
  export const DarkColors  = { ... };
  ```
- Use a `useTheme()` hook that returns the correct color set based on scheme.
- Never hardcode a color that doesn't adapt to dark mode.

---

## 15. PLATFORM-SPECIFIC CODE

- Use `Platform.OS === 'ios'` / `'android'` only for unavoidable differences.
- Abstract platform differences into a utility or hook.
- Prefer Expo APIs over platform-native ones (e.g., `expo-haptics` instead of native vibration).
- Use `.ios.tsx` / `.android.tsx` file extensions only as a last resort.

---

## 16. CODE QUALITY

- **TypeScript strictly** — no `any`, no `@ts-ignore` without an explanation comment.
- All async functions must have try/catch or use `.catch()`.
- No `console.log` in committed code — use a logger utility.
- Max component file length: **200 lines**. Split if longer.
- One component per file.
- Imports order: React → React Native → Expo → Third-party → Internal (constants, components, hooks, utils).

---

## 17. ANIMATION

- Use `react-native-reanimated` (v3+) for all animations. Not the built-in `Animated` API.
- Use `react-native-gesture-handler` for gesture interactions.
- Keep animations under **300ms** for UI transitions, **500ms** for page transitions.
- Respect `useReducedMotion()` — skip or simplify animations for users who prefer reduced motion.

---

## 18. FORMS & INPUTS

- Use `react-hook-form` for all forms.
- Always show inline validation errors below each field.
- Disable submit button while `isSubmitting` is true.
- Use `returnKeyType` and `onSubmitEditing` to chain inputs for good keyboard UX.
- Mask sensitive inputs (`secureTextEntry` for passwords).

---

## 19. NAMING CONVENTIONS

| Thing              | Convention          | Example           |
| ------------------ | ------------------- | ----------------- |
| Components         | PascalCase          | `UserProfileCard` |
| Screens            | PascalCase + Screen | `HomeScreen`      |
| Hooks              | camelCase + use     | `useAuthStatus`   |
| Stores             | camelCase + Store   | `useCartStore`    |
| Constants          | UPPER_SNAKE_CASE    | `MAX_RETRY_COUNT` |
| Style variables    | camelCase           | `containerStyle`  |
| Files (components) | PascalCase.tsx      | `Button.tsx`      |
| Files (hooks)      | camelCase.ts        | `useDebounce.ts`  |

---

## 20. DON'T DO LIST

- ❌ No hardcoded colors, sizes, or spacing values
- ❌ No `any` TypeScript type
- ❌ No `map()` rendering for large lists (use FlatList/FlashList)
- ❌ No unhandled promise rejections
- ❌ No missing loading/error/empty states
- ❌ No untested touch targets below 44x44px
- ❌ No navigation using string paths without type safety
- ❌ No business logic inside components (extract to hooks/utils)
- ❌ No copying of styles (abstract to shared components)
- ❌ No skipping `accessibilityLabel` on interactive elements

---

_Last updated: April 2026 | Stack: Expo SDK + Expo Router + TypeScript_
