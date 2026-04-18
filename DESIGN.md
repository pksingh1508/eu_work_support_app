# Design System Document: The Sovereign Guide

## 1. Overview & Creative North Star

**Creative North Star: "The Diplomatic Atelier"**

This design system rejects the "utilitarian form-filler" aesthetic of traditional government apps. Instead, it adopts the persona of a high-end European digital concierge. It is built on the concept of **Architectural Clarity**—where white space is as functional as the text itself.

To break the "template" look, we employ **Intentional Asymmetry**. Instead of perfectly centered grids, we use weighted typography and offset elements to create a rhythmic, editorial flow. The experience should feel like reading a premium financial journal or a high-end travel monograph: authoritative, spacious, and calming. We don't just provide data; we provide a path.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

Our palette is rooted in a deep, institutional blue (`primary`), but it is modernized through a spectrum of "Atmospheric Neutrals."

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or tonal transitions.

- **The Logic:** Lines create visual noise and "trap" content. By using color shifts (e.g., a `surface-container-low` card on a `surface` background), we create a seamless, infinite feel that reflects modern European tech.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers, like stacked sheets of frosted glass.

- **Level 0 (Base):** `surface` (#faf8ff) – The canvas.
- **Level 1 (Subtle Inset):** `surface-container-low` (#f2f3ff) – Use for secondary background sections.
- **Level 2 (The Hero Layer):** `surface-container-lowest` (#ffffff) – Pure white cards that "pop" against the off-white base.
- **Level 3 (Interactive):** `surface-container-high` (#e2e7ff) – For active states or emphasized nested content.

### The "Glass & Gradient" Rule

To inject "soul" into the professional interface:

- **Signature Textures:** For primary CTAs and Hero sections, use a subtle linear gradient from `primary` (#0058bc) to `primary-container` (#0070eb) at a 135-degree angle. This adds a "lithographic" quality that flat hex codes lack.
- **Glassmorphism:** For floating navigation bars or modal headers, use `surface` at 80% opacity with a `20px` backdrop-blur.

---

## 3. Typography: The Editorial Voice

We utilize a dual-font strategy to balance character with legibility.

- **Display & Headlines (Manrope):** Chosen for its geometric precision and modern European flair. Use `display-lg` and `headline-md` with tighter letter-spacing (-0.02em) to create an authoritative, "bold-print" editorial look.
- **Body & Labels (Inter):** The workhorse of readability. Inter provides a neutral, high-legibility counterpoint to the more expressive Manrope.

**Hierarchy Strategy:**
Use extreme scale contrast. Pair a `display-sm` headline with `body-md` secondary text. This "Big-Small" gap creates an immediate information hierarchy that feels premium and intentional.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are often "dirty." We use light and tone to imply height.

- **The Layering Principle:** Rather than adding a shadow to a card, place a `surface-container-lowest` (White) card on a `surface-container` (Cool Grey-Blue) background. The contrast creates "Natural Lift."
- **Ambient Shadows:** If a floating element (like a FAB) requires a shadow, use: `box-shadow: 0px 12px 32px rgba(19, 27, 46, 0.06);`. The shadow color is a tinted version of `on-surface`, not pure black.
- **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` at 15% opacity. It should be felt, not seen.
- **Roundedness:** Follow the `xl` (1.5rem) token for main containers and `md` (0.75rem) for interactive elements. This "Extra-Round" approach softens the official nature of the content, making it feel approachable.

---

## 5. Components

### Buttons

- **Primary:** Gradient fill (`primary` to `primary-container`), `xl` roundedness, White `on-primary` text. No shadow—use height and color to drive action.
- **Secondary:** `surface-container-highest` background with `primary` text. This "tone-on-tone" look is the hallmark of premium European design.

### Cards & Lists

- **The Divider Ban:** Never use horizontal lines. Use `1.5rem` of vertical white space or a change in the `surface-container` tier to separate list items.
- **Flag Presentation:** Countries should not be represented by simple circles. Use a custom "Soft-Rect" (4px radius) for flags to maintain the architectural feel of the app.

### Input Fields

- **Style:** `surface-container-lowest` fill with a `Ghost Border`. On focus, the border transitions to a `2px` solid `primary` and the background remains white.
- **Validation:** Error states use `error` (#ba1a1a) but replace the background of the field with `error-container` at 20% opacity to maintain the "soft" aesthetic.

### Additional Signature Components

- **Progress Steppers:** Use "The Horizon Line"—a thin `surface-variant` track with a `primary` glow.
- **The "Guide" Card:** A custom component for immigration steps using `tertiary-container` (#c15300) accents to highlight critical "Action Required" moments without the "Alarm" of red.

---

## 6. Do's and Don'ts

### Do

- **DO** use whitespace as a separator. If in doubt, add 8px more padding.
- **DO** use `Manrope` for all numbers (e.g., "12 Days Remaining"). Its geometric shapes are highly premium.
- **DO** use `surface-tint` for subtle iconography backgrounds to create a cohesive brand ecosystem.

### Don't

- **DON'T** use 100% Black (#000000). Use `on-surface` (#131b2e) for text. It’s a deep navy-black that feels much more "European-Tech."
- **DON'T** use standard "Material Design" shadows. They are too heavy for this refined aesthetic.
- **DON'T** crowd the edges. Maintain a minimum `24px` (1.5rem) screen margin at all times.
