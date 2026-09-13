import {
  PERSON_STATUS_LABELS,
  type Person,
  type PersonStatus,
} from "@/lib/people";

export const YEAR_OPTIONS = [5, 10, 15, 20] as const;

export const KEY_RANGES = [
  { id: "0-100", label: "0–100", min: 0, max: 100 },
  { id: "100-250", label: "100–250", min: 100, max: 250 },
  { id: "250-500", label: "250–500", min: 250, max: 500 },
  { id: "500+", label: "500+", min: 500, max: Number.POSITIVE_INFINITY },
] as const;

export const NOTICE_OPTIONS = [
  { id: "immediate", label: "Immediate" },
  { id: "twoWeeks", label: "Within 2 weeks" },
  { id: "oneMonth", label: "Within 1 month" },
  { id: "longer", label: "Longer than 1 month" },
] as const;

export const SPECIALTY_OPTIONS = [
  { id: "resort", label: "Resort", pattern: /resort/i },
  { id: "city", label: "City", pattern: /city/i },
  { id: "residential", label: "Residential", pattern: /resi(dential|dences)?\b/i },
  { id: "villas", label: "Villas", pattern: /villa/i },
  { id: "golf", label: "Golf", pattern: /golf/i },
  { id: "boutique", label: "Boutique", pattern: /boutique/i },
  { id: "luxury", label: "Luxury", pattern: /luxury|ultra-luxury/i },
  { id: "airport", label: "Airport", pattern: /airport/i },
  { id: "convention", label: "Convention", pattern: /convention|mice/i },
  { id: "allrounder", label: "All-rounder", pattern: /all[- ]?round|all segments|^all$/i },
] as const;

export const LANGUAGE_OPTIONS = [
  { id: "english", label: "English", pattern: /\benglish\b|\beng\b|\buk\b/, tokens: ["e"] },
  { id: "spanish", label: "Spanish", pattern: /\bspanish\b/, tokens: ["sp", "es"] },
  { id: "french", label: "French", pattern: /\bfrench\b/, tokens: ["f", "fr"] },
  { id: "german", label: "German", pattern: /\bgerman\b/, tokens: ["d", "de"] },
  { id: "dutch", label: "Dutch", pattern: /\bdutch\b/, tokens: ["nl"] },
  { id: "italian", label: "Italian", pattern: /\bitalian\b/, tokens: ["it", "ita"] },
  { id: "portuguese", label: "Portuguese", pattern: /\bportuguese\b/, tokens: ["pt"] },
  { id: "swedish", label: "Swedish", pattern: /\bswedish\b/, tokens: ["sv"] },
  { id: "turkish", label: "Turkish", pattern: /\bturkish\b/, tokens: [] },
  { id: "greek", label: "Greek", pattern: /\bgreek\b/, tokens: [] },
  { id: "danish", label: "Danish", pattern: /\bdanish\b/, tokens: [] },
  { id: "norwegian", label: "Norwegian", pattern: /\bnorwegian\b/, tokens: [] },
  { id: "japanese", label: "Japanese", pattern: /\bjapanese\b/, tokens: ["jp"] },
  { id: "arabic", label: "Arabic", pattern: /\barabic\b/, tokens: ["ar"] },
  { id: "slovak", label: "Slovak", pattern: /\bslovak\b/, tokens: [] },
] as const;

export type NoticeId = (typeof NOTICE_OPTIONS)[number]["id"];
export type KeyRangeId = (typeof KEY_RANGES)[number]["id"];
export type YesNo = "yes" | "no";
export type BlackoutId = "none" | "has";

export type PeopleFilters = {
  statuses: PersonStatus[];
  tiers: Array<"A" | "B">;
  residences: string[];
  specialties: string[];
  languages: string[];
  minYears: number[];
  keyRanges: KeyRangeId[];
  opening: YesNo[];
  capex: YesNo[];
  notice: NoticeId[];
  blackout: BlackoutId[];
};

export const EMPTY_FILTERS: PeopleFilters = {
  statuses: [],
  tiers: [],
  residences: [],
  specialties: [],
  languages: [],
  minYears: [],
  keyRanges: [],
  opening: [],
  capex: [],
  notice: [],
  blackout: [],
};

const RESIDENCE_ALIASES: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "united states": "United States",
  america: "United States",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  england: "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  gb: "United Kingdom",
  uae: "UAE",
  "abu dhabi": "UAE",
  dubai: "UAE",
  spain: "Spain",
  france: "France",
  paris: "France",
  germany: "Germany",
  switzerland: "Switzerland",
  thailand: "Thailand",
  portugal: "Portugal",
  indonesia: "Indonesia",
  australia: "Australia",
  australian: "Australia",
  malaysia: "Malaysia",
  malasyia: "Malaysia",
  cyprus: "Cyprus",
  netherlands: "Netherlands",
  nl: "Netherlands",
  austria: "Austria",
  italy: "Italy",
};

export function toggleValue<T>(current: T[], value: T): T[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export function activeFilterCount(filters: PeopleFilters): number {
  return (
    filters.statuses.length +
    filters.tiers.length +
    filters.residences.length +
    filters.specialties.length +
    filters.languages.length +
    filters.minYears.length +
    filters.keyRanges.length +
    filters.opening.length +
    filters.capex.length +
    filters.notice.length +
    filters.blackout.length
  );
}

export function normalizeTier(tier: string | null): "A" | "B" | null {
  const letter = tier?.trim().charAt(0).toUpperCase();
  if (letter === "A" || letter === "B") return letter;
  return null;
}

export function parseYearsAsGm(value: string | null): number | null {
  if (!value) return null;
  const now = 2026;
  const fromDates = [...value.matchAll(/\b((?:19|20)\d{2})\b/g)]
    .map((match) => Number(match[1]))
    .filter((year) => year >= 1970 && year <= now)
    .map((year) => now - year);
  const fromCounts = [...value.matchAll(/\d+(?:\.\d+)?/g)]
    .map((match) => Number(match[0]))
    .filter((number) => number >= 1 && number <= 55);
  const years = [...fromDates, ...fromCounts];
  return years.length > 0 ? Math.max(...years) : null;
}

export function parseKeyRange(
  value: string | null,
): { min: number; max: number } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^(any|n\/a|na|projects|big box)$/i.test(trimmed)) return null;

  const numbers = [...value.matchAll(/\d+(?:\.\d+)?/g)]
    .map((match) => Number(match[0]))
    .filter((number) => number >= 1 && number <= 20000);
  if (numbers.length === 0) return null;

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const hasPlus = /\d[\d\s]*\+|\+\+|plus/i.test(value);
  const hasUpTo = /up to|max(?:imum)?/i.test(value);

  if (hasPlus && !/[–\-to]/i.test(value)) {
    return { min: max, max: Number.POSITIVE_INFINITY };
  }
  if (hasUpTo && numbers.length === 1) {
    return { min: 0, max };
  }
  return { min, max };
}

function rangesOverlap(
  left: { min: number; max: number },
  right: { min: number; max: number },
): boolean {
  return left.max >= right.min && left.min <= right.max;
}

export function experienceFlag(value: string | null): boolean | null {
  if (!value || !value.trim()) return null;
  const text = value.trim().toLowerCase();
  if (
    /no opening/.test(text) ||
    /^(0|no|n|none|n\/a|na)$/.test(text)
  ) {
    return false;
  }
  if (/^(y|yes)\b/.test(text) || /\byes\b/.test(text)) return true;
  const numbers = [...text.matchAll(/\d+/g)].map((match) => Number(match[0]));
  if (numbers.length > 0) {
    return numbers.some((number) => number > 0 && number < 1900);
  }
  return true;
}

export function parseNoticeDays(value: string | null): number | null {
  if (!value) return null;
  const text = value.toLowerCase();
  if (/case by case|depends|subject to calendar|tba|tbc/.test(text)) {
    return null;
  }
  if (
    !/\d/.test(text) &&
    !/(one|two|three|four|a)\s+(day|days|week|weeks|month|months)/.test(text) &&
    /(immediate|none|non\b|no notice|n\/a|\bna\b|open\b|available|minimum|directly)/.test(
      text,
    )
  ) {
    return 0;
  }

  const amounts: number[] = [];
  const unitDays = (unit: string, count: number) => {
    if (unit.startsWith("day")) return count;
    if (unit.startsWith("week")) return count * 7;
    return count * 30;
  };

  for (const match of text.matchAll(
    /(\d+)\s*(day|days|week|weeks|month|months|mth|mths)/g,
  )) {
    amounts.push(unitDays(match[2], Number(match[1])));
  }

  const words: Record<string, number> = {
    a: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
  };
  for (const match of text.matchAll(
    /\b(a|one|two|three|four)\s+(day|days|week|weeks|month|months)\b/g,
  )) {
    amounts.push(unitDays(match[2], words[match[1]]));
  }

  if (amounts.length === 0) {
    return null;
  }
  return Math.max(...amounts);
}

export function hasBlackoutDates(value: string | null): boolean | null {
  if (!value || !value.trim()) return null;
  const text = value.trim().toLowerCase();
  if (/^(tba|tbc|can be discussed)$/.test(text)) return null;
  if (
    /^(none|n\/a|na|no|no blackout dates)$/.test(text) ||
    /^none\b/.test(text)
  ) {
    return false;
  }
  return true;
}

export function residencesOf(person: Person): string[] {
  const raw = person.primaryResidence;
  if (!raw) return [];
  const cleaned = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\buntil\b.*$/i, " ")
    .replace(/\bfrom\b.*$/i, " ");
  const parts = cleaned.split(/[|/,&]+|\band\b/i);
  const found = new Set<string>();
  for (const part of parts) {
    const token = part.replace(/[-–].*$/, " ").trim().toLowerCase();
    if (!token || token.length < 2) continue;
    const mapped = RESIDENCE_ALIASES[token];
    if (mapped) {
      found.add(mapped);
      continue;
    }
    for (const [alias, label] of Object.entries(RESIDENCE_ALIASES)) {
      if (token.includes(alias)) found.add(label);
    }
  }
  return [...found];
}

function languageTokens(person: Person): { blob: string; tokens: string[] } {
  const blob = person.languages.join(" ").toLowerCase();
  const tokens = person.languages
    .flatMap((item) => item.split(/[/,;&]+|\band\b/i))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return { blob, tokens };
}

export function personHasLanguage(person: Person, languageId: string): boolean {
  const option = LANGUAGE_OPTIONS.find((item) => item.id === languageId);
  if (!option) return false;
  const { blob, tokens } = languageTokens(person);
  if (option.pattern.test(blob)) return true;
  return option.tokens.some((token) =>
    tokens.some((item) => item === token || item === `${token}.`),
  );
}

export function personHasSpecialty(person: Person, specialtyId: string): boolean {
  const option = SPECIALTY_OPTIONS.find((item) => item.id === specialtyId);
  if (!option || !person.specialty) return false;
  return option.pattern.test(person.specialty);
}

export function residenceOptions(people: Person[]): string[] {
  return [...new Set(people.flatMap(residencesOf))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function specialtyOptions(people: Person[]): (typeof SPECIALTY_OPTIONS)[number][] {
  return SPECIALTY_OPTIONS.filter((option) =>
    people.some((person) => personHasSpecialty(person, option.id)),
  );
}

export function languageOptions(people: Person[]): (typeof LANGUAGE_OPTIONS)[number][] {
  return LANGUAGE_OPTIONS.filter((option) =>
    people.some((person) => personHasLanguage(person, option.id)),
  );
}

export function personMatchesFilters(
  person: Person,
  filters: PeopleFilters,
): boolean {
  if (
    filters.statuses.length > 0 &&
    !filters.statuses.includes(person.status)
  ) {
    return false;
  }

  if (filters.tiers.length > 0) {
    const tier = normalizeTier(person.tier);
    if (!tier || !filters.tiers.includes(tier)) return false;
  }

  if (filters.residences.length > 0) {
    const residences = residencesOf(person);
    if (!filters.residences.some((value) => residences.includes(value))) {
      return false;
    }
  }

  if (
    filters.specialties.length > 0 &&
    !filters.specialties.some((value) => personHasSpecialty(person, value))
  ) {
    return false;
  }

  if (
    filters.languages.length > 0 &&
    !filters.languages.some((value) => personHasLanguage(person, value))
  ) {
    return false;
  }

  if (filters.minYears.length > 0) {
    const years = parseYearsAsGm(person.yearsAsGm);
    if (years == null || !filters.minYears.some((min) => years >= min)) {
      return false;
    }
  }

  if (filters.keyRanges.length > 0) {
    const keys = parseKeyRange(person.numberOfKeys);
    if (!keys) return false;
    const matches = filters.keyRanges.some((id) => {
      const range = KEY_RANGES.find((item) => item.id === id);
      return range ? rangesOverlap(keys, range) : false;
    });
    if (!matches) return false;
  }

  if (filters.opening.length > 0) {
    const flag = experienceFlag(person.openingExperience);
    if (flag == null) return false;
    const wanted = filters.opening.map((value) => value === "yes");
    if (!wanted.includes(flag)) return false;
  }

  if (filters.capex.length > 0) {
    const flag = experienceFlag(person.capexRefurbExperience);
    if (flag == null) return false;
    const wanted = filters.capex.map((value) => value === "yes");
    if (!wanted.includes(flag)) return false;
  }

  if (filters.notice.length > 0) {
    const days = parseNoticeDays(person.noticePeriod);
    if (days == null) return false;
    const matches = filters.notice.some((id) => {
      if (id === "immediate") return days <= 0;
      if (id === "twoWeeks") return days <= 14;
      if (id === "oneMonth") return days <= 31;
      return days > 31;
    });
    if (!matches) return false;
  }

  if (filters.blackout.length > 0) {
    const has = hasBlackoutDates(person.blackoutDates);
    if (has == null) return false;
    const wanted = filters.blackout.map((value) => value === "has");
    if (!wanted.includes(has)) return false;
  }

  return true;
}

export function filterChips(filters: PeopleFilters): {
  key: string;
  label: string;
  clear: (current: PeopleFilters) => PeopleFilters;
}[] {
  const chips: {
    key: string;
    label: string;
    clear: (current: PeopleFilters) => PeopleFilters;
  }[] = [];

  for (const status of filters.statuses) {
    chips.push({
      key: `status:${status}`,
      label: `Status: ${PERSON_STATUS_LABELS[status]}`,
      clear: (current) => ({
        ...current,
        statuses: current.statuses.filter((value) => value !== status),
      }),
    });
  }
  for (const tier of filters.tiers) {
    chips.push({
      key: `tier:${tier}`,
      label: `A/B: ${tier}`,
      clear: (current) => ({
        ...current,
        tiers: current.tiers.filter((value) => value !== tier),
      }),
    });
  }
  for (const residence of filters.residences) {
    chips.push({
      key: `residence:${residence}`,
      label: `Residence: ${residence}`,
      clear: (current) => ({
        ...current,
        residences: current.residences.filter((value) => value !== residence),
      }),
    });
  }
  for (const specialty of filters.specialties) {
    const option = SPECIALTY_OPTIONS.find((item) => item.id === specialty);
    chips.push({
      key: `specialty:${specialty}`,
      label: `Specialty: ${option?.label ?? specialty}`,
      clear: (current) => ({
        ...current,
        specialties: current.specialties.filter((value) => value !== specialty),
      }),
    });
  }
  for (const language of filters.languages) {
    const option = LANGUAGE_OPTIONS.find((item) => item.id === language);
    chips.push({
      key: `language:${language}`,
      label: `Language: ${option?.label ?? language}`,
      clear: (current) => ({
        ...current,
        languages: current.languages.filter((value) => value !== language),
      }),
    });
  }
  for (const years of filters.minYears) {
    chips.push({
      key: `years:${years}`,
      label: `Years as GM: ${years}+`,
      clear: (current) => ({
        ...current,
        minYears: current.minYears.filter((value) => value !== years),
      }),
    });
  }
  for (const range of filters.keyRanges) {
    const option = KEY_RANGES.find((item) => item.id === range);
    chips.push({
      key: `keys:${range}`,
      label: `Keys: ${option?.label ?? range}`,
      clear: (current) => ({
        ...current,
        keyRanges: current.keyRanges.filter((value) => value !== range),
      }),
    });
  }
  for (const value of filters.opening) {
    chips.push({
      key: `opening:${value}`,
      label: `Opening: ${value === "yes" ? "Yes" : "No"}`,
      clear: (current) => ({
        ...current,
        opening: current.opening.filter((item) => item !== value),
      }),
    });
  }
  for (const value of filters.capex) {
    chips.push({
      key: `capex:${value}`,
      label: `Capex: ${value === "yes" ? "Yes" : "No"}`,
      clear: (current) => ({
        ...current,
        capex: current.capex.filter((item) => item !== value),
      }),
    });
  }
  for (const value of filters.notice) {
    const option = NOTICE_OPTIONS.find((item) => item.id === value);
    chips.push({
      key: `notice:${value}`,
      label: `Notice: ${option?.label ?? value}`,
      clear: (current) => ({
        ...current,
        notice: current.notice.filter((item) => item !== value),
      }),
    });
  }
  for (const value of filters.blackout) {
    chips.push({
      key: `blackout:${value}`,
      label:
        value === "none" ? "Availability: No blackouts" : "Availability: Has blackouts",
      clear: (current) => ({
        ...current,
        blackout: current.blackout.filter((item) => item !== value),
      }),
    });
  }

  return chips;
}
