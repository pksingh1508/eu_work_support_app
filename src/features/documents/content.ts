import type Ionicons from "@expo/vector-icons/Ionicons";

export type ContentSection = {
  type?: string;
  title?: string;
  content?: string;
  items?: unknown[];
  columns?: string[];
  rows?: unknown[][];
};

export type ContentJson = {
  sections?: ContentSection[];
};

export function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeContentJson(value: unknown): ContentJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { sections: [] };
  }

  const maybeContent = value as ContentJson;
  return Array.isArray(maybeContent.sections) ? maybeContent : { sections: [] };
}

export function stringifyValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

export function getCategoryIcon(icon: string | null): keyof typeof Ionicons.glyphMap {
  switch (icon) {
    case "briefcase":
    case "building-2":
      return "briefcase-outline";
    case "graduation-cap":
      return "school-outline";
    case "passport":
    case "id-card":
    case "file-text":
      return "document-text-outline";
    case "shield-check":
      return "shield-checkmark-outline";
    case "car":
      return "car-outline";
    case "heart-pulse":
      return "heart-outline";
    case "book-open":
      return "book-outline";
    case "languages":
      return "language-outline";
    default:
      return "document-text-outline";
  }
}

export function normalizeExternalUrl(value: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const parsedUrl = new URL(normalizedValue);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
}

export function getUrlHost(value: string) {
  try {
    return new URL(value).host.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function formatLongDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Rough reading time for a guide, used as a light metadata hint. */
export function estimateReadingMinutes(intro: string | null, content: ContentJson) {
  let words = intro ? intro.split(/\s+/).length : 0;

  (content.sections ?? []).forEach((section) => {
    words += `${section.title ?? ""} ${section.content ?? ""}`.split(/\s+/).length;
    (section.items ?? []).forEach((item) => {
      if (item && typeof item === "object") {
        Object.values(item as Record<string, unknown>).forEach((value) => {
          words += stringifyValue(value).split(/\s+/).length;
        });
      } else {
        words += stringifyValue(item).split(/\s+/).length;
      }
    });
    (section.rows ?? []).forEach((row) => {
      (Array.isArray(row) ? row : []).forEach((cell) => {
        words += stringifyValue(cell).split(/\s+/).length;
      });
    });
  });

  return Math.max(1, Math.round(words / 220));
}
