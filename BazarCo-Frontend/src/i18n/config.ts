export const locales = ["en-AU", "ne"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en-AU";

export const localeLabels: Record<Locale, string> = {
  "en-AU": "English (AU)",
  ne: "नेपाली",
};
