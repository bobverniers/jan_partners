import { type Person } from "@/lib/people";

export const YEAR_OPTIONS = [5, 10, 15, 20] as const;

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

export type PeopleFilters = {
  residences: string[];
  specialties: string[];
  languages: string[];
  minYears: number[];
};

export const EMPTY_FILTERS: PeopleFilters = {
  residences: [],
  specialties: [],
  languages: [],
  minYears: [],
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
    filters.residences.length +
    filters.specialties.length +
    filters.languages.length +
    filters.minYears.length
  );
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

  return chips;
}
