export const PERSON_STATUSES = ["new", "active", "inactive"] as const;

export const RECRUITERS = [
  "Belinda",
  "Liz",
  "Mark",
  "Philip",
  "Maray",
  "Direct",
] as const;

export function canonicalRecruiter(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return (
    RECRUITERS.find((name) => name.toLowerCase() === trimmed.toLowerCase()) ??
    null
  );
}

export type PersonStatus = (typeof PERSON_STATUSES)[number];

export type Person = {
  id: string;
  name: string;
  cvUrl: string | null;
  cvFilePath: string | null;
  cvFileName: string | null;
  primaryResidence: string | null;
  passports: string[];
  preferredLocations: string | null;
  yearsAsGm: string | null;
  specialty: string | null;
  openingExperience: string | null;
  capexRefurbExperience: string | null;
  languages: string[];
  linkedinUrl: string | null;
  email: string | null;
  phone: string | null;
  status: PersonStatus;
  hasReferences: boolean | null;
  recruiter: string | null;
  consultancy: string | null;
  dropboxComments: string | null;
};

export type PersonRow = {
  id: string;
  name: string;
  cv_url: string | null;
  cv_file_path: string | null;
  cv_file_name: string | null;
  primary_residence: string | null;
  passports: string[] | null;
  preferred_locations: string | null;
  years_as_gm: string | null;
  specialty: string | null;
  opening_experience: string | null;
  capex_refurb_experience: string | null;
  languages: string[] | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  status: PersonStatus;
  has_references: boolean | null;
  recruiter: string | null;
  consultancy: string | null;
  dropbox_comments: string | null;
};

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  new: "New",
  active: "Active",
  inactive: "Inactive",
};

const NAME_SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v"]);

function isFullyUppercase(word: string): boolean {
  const letters = word.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  return letters.length >= 2 && letters === letters.toUpperCase();
}

function titleCaseWord(word: string): string {
  if (!isFullyUppercase(word)) return word;
  const suffix = word.toLowerCase().replace(/\./g, "");
  if (NAME_SUFFIXES.has(suffix)) return word.toUpperCase();
  return word
    .toLowerCase()
    .replace(
      /(^|[^a-zà-öø-ÿ])([a-zà-öø-ÿ])/g,
      (_, boundary: string, letter: string) => boundary + letter.toUpperCase(),
    );
}

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}

export function asStringList(
  value: string[] | string | null | undefined,
): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function splitPersonName(name: string): { last: string; given: string } {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { last: "", given: "" };
  }

  if (trimmed.includes(",")) {
    const [lastPart, ...rest] = trimmed.split(",");
    const givenWords = titleCaseWords(rest.join(",").trim())
      .split(" ")
      .filter(Boolean);
    const lastWords = titleCaseWords(lastPart.trim()).split(" ").filter(Boolean);
    if (givenWords.length === 0) {
      return { last: lastWords.join(" "), given: "" };
    }
    return {
      given: givenWords[0],
      last: [...givenWords.slice(1), ...lastWords].join(" "),
    };
  }

  const parts = trimmed.split(" ").map(titleCaseWord);
  if (parts.length === 1) {
    return { last: parts[0], given: "" };
  }

  return {
    last: parts.slice(1).join(" "),
    given: parts[0],
  };
}

export function lastNameSortValue(name: string): string {
  const { last, given } = splitPersonName(name);
  return [last, given].filter(Boolean).join(" ");
}

export function lastNameFirst(name: string): string {
  const { last, given } = splitPersonName(name);
  if (!last) {
    return "";
  }

  return given ? `${last}, ${given}` : last;
}

export function specialtyLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const city = /\bcity\b/i.test(trimmed);
  const resort = /\bresorts?\b/i.test(trimmed);
  if (/\bboth\b/i.test(trimmed) || (city && resort)) return "Both";
  if (city) return "City";
  if (resort) return "Resort";
  return null;
}

const PLACE_FILLER =
  /^(open|willing|flexible|anywhere|everywhere|somewhere|nowhere|any|all|none|no|yes|prefer|preferred|preference|preferences|available|currently|presently|now|based|basing|living|live|lives|lived|located|location|locations|residing|resident|residence|relocation|relocate|relocating|worldwide|global|international|remote|tbd|na|various|multiple|other|others|etc|please|would|like|liked|work|working|works|in|a|an|for|with|my|i|am|im|i'm|looking|happy|consider|considering|considered|destination|destinations|place|places|hotel|hotels|resort|resorts|only|also|very|really|can|could|should|want|wants|wanted|ideally|possibly|maybe|perhaps|not|but|at|near|around|within|throughout|across|over|under|be|been|being|to|from|on|by|as|is|are|was|were|this|that|these|those|some|more|most|either|neither|just|still|already|always|never|here|there|where|when|while|which|who|what|how|if|then|than|so|too|into|onto|upon|per|via|about|above|after|before|during|until|since|between|among|including|include|includes|especially|mainly|mostly|primarily|preferably|home|abroad|overseas|locally|region|regions|area|areas|country|countries|world|negotiable|depends|depending|opportunity|opportunities|position|positions|role|roles|family|lifestyle|life|quality|great|good|best|love|loved|enjoy|wife|husband|children|kids|child|school|schools|end|start|starting|beginning|move|moving|moved|happy|relocate)$/i;

const PLACE_TIME =
  /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|onwards|onward)$/i;

const PLACE_CONNECTOR =
  /^(of|de|del|da|di|la|le|les|el|al|van|von|der|den|dos|das|do|du|es|st|saint|san|santa|são|sao|the)$/i;

const PLACE_ALIASES: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "united states": "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  uae: "UAE",
  "united arab emirates": "UAE",
  eu: "Europe",
  australian: "Australia",
  malasyia: "Malaysia",
  malasya: "Malaysia",
};

function placeAliasKey(value: string): string {
  return value.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

function formatPlace(value: string): string {
  const alias = PLACE_ALIASES[placeAliasKey(value)];
  if (alias) return alias;

  return value
    .split(/\s+/)
    .map((word, index) => {
      const bare = word.replace(/^[.'’]+|[.'’]+$/g, "");
      if (index > 0 && PLACE_CONNECTOR.test(bare)) return bare.toLowerCase();
      const letters = bare.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
      if (!letters) return word;
      if (letters.length <= 3 && letters === letters.toUpperCase()) {
        return word.toUpperCase();
      }
      if (letters === letters.toLowerCase() || letters === letters.toUpperCase()) {
        return bare.charAt(0).toUpperCase() + bare.slice(1).toLowerCase();
      }
      return word;
    })
    .join(" ");
}

function placeWords(value: string): string[] {
  return value
    .replace(/[()[\]{}]/g, " ")
    .replace(/\b\d[\d./-]*\b/g, " ")
    .replace(/[^\p{L}\s.'’-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^[.'’]+|[.'’]+$/g, ""))
    .filter(Boolean);
}

function keepPlaceWords(words: string[]): string[] {
  let start = 0;
  let end = words.length;
  const filler = (word: string) => PLACE_FILLER.test(word) || PLACE_TIME.test(word);
  const edge = (word: string) => /^(the|of)$/i.test(word);
  while (start < end && (filler(words[start]) || edge(words[start]))) start += 1;
  while (end > start && (filler(words[end - 1]) || edge(words[end - 1]))) end -= 1;
  return words.slice(start, end).filter((word) => !filler(word) || PLACE_CONNECTOR.test(word));
}

export function placeLabels(value: string | null | undefined): string[] {
  const trimmed = value?.trim();
  if (!trimmed) return [];

  const found = new Map<string, string>();
  const notes = [...trimmed.matchAll(/\(([^)]*)\)/g)].map((match) => match[1]);
  const chunks = [trimmed.replace(/\([^)]*\)/g, " "), ...notes].flatMap((part) =>
    part.split(/\n|[,;|/&]+|\s+[-–—]\s+|\band\b|\bor\b|\bbut\b/i),
  );

  for (const chunk of chunks) {
    const words = keepPlaceWords(placeWords(chunk));
    if (words.length === 0 || words.length > 4) continue;
    const label = formatPlace(words.join(" "));
    if (label.length < 2) continue;
    const key = placeAliasKey(label);
    if (!found.has(key)) found.set(key, label);
  }

  return [...found.values()];
}

export function standardResidence(
  value: string | null | undefined,
): string | null {
  const labels = placeLabels(value);
  return labels.length > 0 ? labels.join(", ") : null;
}

export function consultancyLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^(n|no)$/i.test(trimmed)) return "No";
  if (/^(y|yes)$/i.test(trimmed)) return "Yes";
  return trimmed;
}

export function uniqueEmails(
  values: Array<string | null | undefined>,
): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];

  for (const value of values) {
    const email = value?.trim();
    if (!email || email === "—") {
      continue;
    }

    const key = email.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    emails.push(email);
  }

  return emails.sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}

export function mapPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    cvUrl: row.cv_url,
    cvFilePath: row.cv_file_path,
    cvFileName: row.cv_file_name,
    primaryResidence: standardResidence(row.primary_residence),
    passports: asStringList(row.passports),
    preferredLocations: row.preferred_locations,
    yearsAsGm: row.years_as_gm,
    specialty: row.specialty,
    openingExperience: row.opening_experience,
    capexRefurbExperience: row.capex_refurb_experience,
    languages: asStringList(row.languages),
    linkedinUrl: row.linkedin_url,
    email: row.email,
    phone: row.phone,
    status: row.status,
    hasReferences: row.has_references,
    recruiter: canonicalRecruiter(row.recruiter),
    consultancy: row.consultancy,
    dropboxComments: row.dropbox_comments,
  };
}

export function toUpdatePayload(person: Person): Omit<PersonRow, "id"> {
  return {
    name: person.name,
    cv_url: person.cvUrl,
    cv_file_path: person.cvFilePath,
    cv_file_name: person.cvFileName,
    primary_residence: person.primaryResidence,
    passports: asStringList(person.passports),
    preferred_locations: person.preferredLocations,
    years_as_gm: person.yearsAsGm,
    specialty: person.specialty,
    opening_experience: person.openingExperience,
    capex_refurb_experience: person.capexRefurbExperience,
    languages: asStringList(person.languages),
    linkedin_url: person.linkedinUrl,
    email: person.email,
    phone: person.phone,
    status: person.status,
    has_references: person.hasReferences,
    recruiter: person.recruiter,
    consultancy: person.consultancy,
    dropbox_comments: person.dropboxComments,
  };
}

export async function clearUnknownRecruiters(supabase: {
  from: (table: "people") => {
    select: (columns: "id, recruiter") => {
      not: (
        column: "recruiter",
        operator: "is",
        value: null,
      ) => PromiseLike<{
        data: { id: string; recruiter: string | null }[] | null;
        error: { message: string } | null;
      }>;
    };
    update: (values: { recruiter: string | null }) => {
      in: (
        column: "id",
        values: string[],
      ) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
}): Promise<string | null> {
  const { data, error } = await supabase
    .from("people")
    .select("id, recruiter")
    .not("recruiter", "is", null);

  if (error) return error.message;
  if (!data) return null;

  const groups = new Map<string | null, string[]>();
  for (const row of data) {
    const canonical = canonicalRecruiter(row.recruiter);
    if (canonical === row.recruiter) continue;
    const ids = groups.get(canonical) ?? [];
    ids.push(row.id);
    groups.set(canonical, ids);
  }

  for (const [recruiter, ids] of groups) {
    for (let index = 0; index < ids.length; index += 200) {
      const { error: updateError } = await supabase
        .from("people")
        .update({ recruiter })
        .in("id", ids.slice(index, index + 200));
      if (updateError) return updateError.message;
    }
  }

  return null;
}

export function personMatchesQuery(person: Person, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    person.name,
    person.email,
    person.phone,
    person.primaryResidence,
    person.specialty,
    person.linkedinUrl,
    person.cvUrl,
    person.cvFileName,
    asStringList(person.languages).join(" "),
    asStringList(person.passports).join(" "),
    person.recruiter,
    person.dropboxComments,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}
