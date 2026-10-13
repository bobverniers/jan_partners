import {
  PERSON_STATUS_LABELS,
  consultancyLabel,
  placeLabels,
  specialtyLabel,
  type Person,
} from "@/lib/people";

export const BLANK_FILTER = "Blank";

export const YEAR_OPTIONS = [5, 10, 15, 20] as const;

const LANGUAGE_OPTIONS: {
  label: string;
  pattern: RegExp;
  tokens: readonly string[];
}[] = [
  { label: "English", pattern: /\benglish\b|\beng\b|\buk\b/i, tokens: ["e"] },
  { label: "Spanish", pattern: /\bspanish\b/i, tokens: ["sp", "es"] },
  { label: "French", pattern: /\bfrench\b/i, tokens: ["f", "fr"] },
  { label: "German", pattern: /\bgerman\b/i, tokens: ["d", "de"] },
  { label: "Dutch", pattern: /\bdutch\b|\bflemish\b/i, tokens: ["nl"] },
  { label: "Italian", pattern: /\bitalian\b/i, tokens: ["it", "ita"] },
  { label: "Portuguese", pattern: /\bportuguese\b/i, tokens: ["pt"] },
  { label: "Swedish", pattern: /\bswedish\b/i, tokens: ["sv"] },
  { label: "Norwegian", pattern: /\bnorwegian\b/i, tokens: [] },
  { label: "Danish", pattern: /\bdanish\b/i, tokens: [] },
  { label: "Finnish", pattern: /\bfinnish\b/i, tokens: [] },
  { label: "Icelandic", pattern: /\bicelandic\b/i, tokens: [] },
  { label: "Greek", pattern: /\bgreek\b/i, tokens: [] },
  { label: "Turkish", pattern: /\bturkish\b/i, tokens: [] },
  { label: "Russian", pattern: /\brussian\b/i, tokens: [] },
  { label: "Ukrainian", pattern: /\bukrainian\b/i, tokens: [] },
  { label: "Polish", pattern: /\bpolish\b/i, tokens: [] },
  { label: "Czech", pattern: /\bczech\b/i, tokens: [] },
  { label: "Slovak", pattern: /\bslovak\b/i, tokens: [] },
  { label: "Hungarian", pattern: /\bhungarian\b/i, tokens: [] },
  { label: "Romanian", pattern: /\bromanian\b/i, tokens: [] },
  { label: "Bulgarian", pattern: /\bbulgarian\b/i, tokens: [] },
  { label: "Croatian", pattern: /\bcroatian\b/i, tokens: [] },
  { label: "Serbian", pattern: /\bserbian\b/i, tokens: [] },
  { label: "Slovenian", pattern: /\bslovenian\b|\bslovene\b/i, tokens: [] },
  { label: "Albanian", pattern: /\balbanian\b/i, tokens: [] },
  { label: "Mandarin", pattern: /\bmandarin\b/i, tokens: [] },
  { label: "Cantonese", pattern: /\bcantonese\b/i, tokens: [] },
  { label: "Chinese", pattern: /\bchinese\b/i, tokens: [] },
  { label: "Japanese", pattern: /\bjapanese\b/i, tokens: ["jp"] },
  { label: "Korean", pattern: /\bkorean\b/i, tokens: [] },
  { label: "Thai", pattern: /\bthai\b/i, tokens: [] },
  { label: "Vietnamese", pattern: /\bvietnamese\b/i, tokens: [] },
  { label: "Indonesian", pattern: /\bindonesian\b/i, tokens: [] },
  { label: "Malay", pattern: /\bmalay\b/i, tokens: [] },
  { label: "Hindi", pattern: /\bhindi\b/i, tokens: [] },
  { label: "Urdu", pattern: /\burdu\b/i, tokens: [] },
  { label: "Bengali", pattern: /\bbengali\b/i, tokens: [] },
  { label: "Tamil", pattern: /\btamil\b/i, tokens: [] },
  { label: "Tagalog", pattern: /\btagalog\b|\bfilipino\b/i, tokens: [] },
  { label: "Arabic", pattern: /\barabic\b/i, tokens: ["ar"] },
  { label: "Hebrew", pattern: /\bhebrew\b/i, tokens: [] },
  { label: "Persian", pattern: /\bpersian\b|\bfarsi\b/i, tokens: [] },
  { label: "Swahili", pattern: /\bswahili\b/i, tokens: [] },
  { label: "Afrikaans", pattern: /\bafrikaans\b/i, tokens: [] },
  { label: "Catalan", pattern: /\bcatalan\b/i, tokens: [] },
];

export const FILTER_FIELDS = [
  { key: "status", label: "Status" },
  { key: "residence", label: "Residence" },
  { key: "preferredLocations", label: "Preferred locations" },
  { key: "yearsAsGm", label: "Years as GM" },
  { key: "specialty", label: "Specialty" },
  { key: "capex", label: "Capex / refurb" },
  { key: "languages", label: "Languages" },
  { key: "hasReferences", label: "References" },
  { key: "recruiter", label: "Recruiter" },
  { key: "consultancy", label: "Consultancy" },
] as const;

export type FilterKey = (typeof FILTER_FIELDS)[number]["key"];

export type PeopleFilters = Record<FilterKey, string[]>;

export const EMPTY_FILTERS: PeopleFilters = {
  status: [],
  residence: [],
  preferredLocations: [],
  yearsAsGm: [],
  specialty: [],
  capex: [],
  languages: [],
  hasReferences: [],
  recruiter: [],
  consultancy: [],
};

function text(value: string | null | undefined): string[] {
  const trimmed = value?.trim();
  return trimmed ? [trimmed] : [];
}

function languageLabels(values: string[]): string[] {
  const found = new Set<string>();

  for (const raw of values) {
    const parts = raw
      .split(/\n|[,;/|]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    for (const part of parts) {
      const token = part.toLowerCase().replace(/\.$/, "");
      for (const option of LANGUAGE_OPTIONS) {
        if (option.pattern.test(part) || option.tokens.includes(token)) {
          found.add(option.label);
        }
      }
    }
  }

  return [...found];
}

export function parseYearsAsGm(value: string | null): number | null {
  if (!value) return null;
  const now = new Date().getFullYear();
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

function yearBuckets(person: Person): string[] {
  const years = parseYearsAsGm(person.yearsAsGm);
  if (years == null) return [];
  return YEAR_OPTIONS.filter((min) => years >= min).map((min) => `${min}+`);
}

function fieldIsBlank(person: Person, key: FilterKey): boolean {
  if (key === "yearsAsGm") return !person.yearsAsGm?.trim();
  if (key === "specialty") return !person.specialty?.trim();
  if (key === "languages") return !person.languages.some((item) => item.trim());
  if (key === "residence") return !person.primaryResidence?.trim();
  if (key === "preferredLocations") return !person.preferredLocations?.trim();
  return valuesForFilter(person, key).length === 0;
}

export function valuesForFilter(person: Person, key: FilterKey): string[] {
  switch (key) {
    case "status":
      return [PERSON_STATUS_LABELS[person.status]];
    case "residence":
      return placeLabels(person.primaryResidence);
    case "preferredLocations":
      return placeLabels(person.preferredLocations);
    case "yearsAsGm":
      return yearBuckets(person);
    case "specialty":
      return text(specialtyLabel(person.specialty));
    case "capex":
      return text(person.capexRefurbExperience);
    case "languages":
      return languageLabels(person.languages);
    case "hasReferences":
      if (person.hasReferences === true) return ["Yes"];
      if (person.hasReferences === false) return ["No"];
      return [];
    case "recruiter":
      return text(person.recruiter);
    case "consultancy":
      return text(consultancyLabel(person.consultancy));
  }
}

export function toggleValue<T>(current: T[], value: T): T[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export function activeFilterCount(filters: PeopleFilters): number {
  return FILTER_FIELDS.reduce(
    (total, field) => total + filters[field.key].length,
    0,
  );
}

export function filterOptions(people: Person[], key: FilterKey): string[] {
  const found = new Set<string>();
  let hasBlank = false;

  for (const person of people) {
    if (fieldIsBlank(person, key)) {
      hasBlank = true;
      continue;
    }
    for (const value of valuesForFilter(person, key)) found.add(value);
  }

  if (key === "specialty") {
    const options = ["City", "Resort", "Both"].filter((label) => found.has(label));
    if (hasBlank) options.unshift(BLANK_FILTER);
    return options;
  }

  const options = [...found].sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }),
  );
  if (hasBlank) options.unshift(BLANK_FILTER);
  return options;
}

export function personMatchesFilters(
  person: Person,
  filters: PeopleFilters,
): boolean {
  for (const field of FILTER_FIELDS) {
    const selected = filters[field.key];
    if (selected.length === 0) continue;

    const tokens = fieldIsBlank(person, field.key)
      ? [BLANK_FILTER]
      : valuesForFilter(person, field.key);
    if (!selected.some((value) => tokens.includes(value))) return false;
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

  for (const field of FILTER_FIELDS) {
    for (const value of filters[field.key]) {
      chips.push({
        key: `${field.key}:${value}`,
        label: `${field.label}: ${value}`,
        clear: (current) => ({
          ...current,
          [field.key]: current[field.key].filter((item) => item !== value),
        }),
      });
    }
  }

  return chips;
}
