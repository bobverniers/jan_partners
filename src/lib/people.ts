export const PERSON_STATUSES = ["new", "active", "inactive"] as const;

export type PersonStatus = (typeof PERSON_STATUSES)[number];

export type Person = {
  id: string;
  name: string;
  referenceNumber: string | null;
  cvUrl: string | null;
  cvFilePath: string | null;
  cvFileName: string | null;
  primaryResidence: string | null;
  passports: string[];
  preferredLocations: string | null;
  noticePeriod: string | null;
  maximumDuration: string | null;
  mostRecentPosition: string | null;
  previousAssignments: string[];
  yearsAsGm: string | null;
  specialty: string | null;
  numberOfKeys: string | null;
  openingExperience: string | null;
  capexRefurbExperience: string | null;
  languages: string[];
  linkedinUrl: string | null;
  email: string | null;
  phone: string | null;
  personalStatus: string | null;
  blackoutDates: string | null;
  enrolmentDate: string | null;
  notes: string | null;
  status: PersonStatus;
  tier: string | null;
  hasCv: boolean | null;
  hasContract: boolean | null;
  hasTracking: boolean | null;
  hasReferences: boolean | null;
  owner: string | null;
  recruiter: string | null;
  consultancy: string | null;
  dropboxComments: string | null;
};

export type PersonRow = {
  id: string;
  name: string;
  reference_number: string | null;
  cv_url: string | null;
  cv_file_path: string | null;
  cv_file_name: string | null;
  primary_residence: string | null;
  passports: string[] | null;
  preferred_locations: string | null;
  notice_period: string | null;
  maximum_duration: string | null;
  most_recent_position: string | null;
  previous_assignments: string[] | null;
  years_as_gm: string | null;
  specialty: string | null;
  number_of_keys: string | null;
  opening_experience: string | null;
  capex_refurb_experience: string | null;
  languages: string[] | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  personal_status: string | null;
  blackout_dates: string | null;
  enrolment_date: string | null;
  notes: string | null;
  status: PersonStatus;
  tier: string | null;
  has_cv: boolean | null;
  has_contract: boolean | null;
  has_tracking: boolean | null;
  has_references: boolean | null;
  owner: string | null;
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

function splitPersonName(name: string): {
  last: string;
  given: string;
  suffixes: string;
} {
  const trimmed = name.trim();
  if (!trimmed) {
    return { last: "", given: "", suffixes: "" };
  }

  if (trimmed.includes(",")) {
    const [last, ...rest] = trimmed.split(",");
    return { last: last.trim(), given: rest.join(",").trim(), suffixes: "" };
  }

  const parts = trimmed.split(/\s+/);
  let lastIndex = parts.length - 1;
  while (
    lastIndex > 0 &&
    NAME_SUFFIXES.has(parts[lastIndex].toLowerCase().replace(/,/g, ""))
  ) {
    lastIndex -= 1;
  }

  return {
    last: parts[lastIndex] ?? "",
    given: parts.slice(0, lastIndex).join(" "),
    suffixes: parts.slice(lastIndex + 1).join(" "),
  };
}

export function lastNameSortValue(name: string): string {
  const { last, given, suffixes } = splitPersonName(name);
  return [last, given, suffixes].filter(Boolean).join(" ");
}

export function lastNameFirst(name: string): string {
  const { last, given, suffixes } = splitPersonName(name);
  if (!last) {
    return "";
  }

  const first = [given, suffixes].filter(Boolean).join(" ");
  return first ? `${last}, ${first}` : last;
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
    referenceNumber: row.reference_number,
    cvUrl: row.cv_url,
    cvFilePath: row.cv_file_path,
    cvFileName: row.cv_file_name,
    primaryResidence: row.primary_residence,
    passports: asStringList(row.passports),
    preferredLocations: row.preferred_locations,
    noticePeriod: row.notice_period,
    maximumDuration: row.maximum_duration,
    mostRecentPosition: row.most_recent_position,
    previousAssignments: asStringList(row.previous_assignments),
    yearsAsGm: row.years_as_gm,
    specialty: row.specialty,
    numberOfKeys: row.number_of_keys,
    openingExperience: row.opening_experience,
    capexRefurbExperience: row.capex_refurb_experience,
    languages: asStringList(row.languages),
    linkedinUrl: row.linkedin_url,
    email: row.email,
    phone: row.phone,
    personalStatus: row.personal_status,
    blackoutDates: row.blackout_dates,
    enrolmentDate: row.enrolment_date,
    notes: row.notes,
    status: row.status,
    tier: row.tier,
    hasCv: row.has_cv,
    hasContract: row.has_contract,
    hasTracking: row.has_tracking,
    hasReferences: row.has_references,
    owner: row.owner,
    recruiter: row.recruiter,
    consultancy: row.consultancy,
    dropboxComments: row.dropbox_comments,
  };
}

export function toUpdatePayload(person: Person): Omit<PersonRow, "id"> {
  return {
    name: person.name,
    reference_number: person.referenceNumber,
    cv_url: person.cvUrl,
    cv_file_path: person.cvFilePath,
    cv_file_name: person.cvFileName,
    primary_residence: person.primaryResidence,
    passports: asStringList(person.passports),
    preferred_locations: person.preferredLocations,
    notice_period: person.noticePeriod,
    maximum_duration: person.maximumDuration,
    most_recent_position: person.mostRecentPosition,
    previous_assignments: asStringList(person.previousAssignments),
    years_as_gm: person.yearsAsGm,
    specialty: person.specialty,
    number_of_keys: person.numberOfKeys,
    opening_experience: person.openingExperience,
    capex_refurb_experience: person.capexRefurbExperience,
    languages: asStringList(person.languages),
    linkedin_url: person.linkedinUrl,
    email: person.email,
    phone: person.phone,
    personal_status: person.personalStatus,
    blackout_dates: person.blackoutDates,
    enrolment_date: person.enrolmentDate,
    notes: person.notes,
    status: person.status,
    tier: person.tier,
    has_cv: person.hasCv,
    has_contract: person.hasContract,
    has_tracking: person.hasTracking,
    has_references: person.hasReferences,
    owner: person.owner,
    recruiter: person.recruiter,
    consultancy: person.consultancy,
    dropbox_comments: person.dropboxComments,
  };
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
    person.referenceNumber,
    person.mostRecentPosition,
    person.primaryResidence,
    person.specialty,
    person.linkedinUrl,
    person.cvUrl,
    person.cvFileName,
    asStringList(person.languages).join(" "),
    asStringList(person.passports).join(" "),
    asStringList(person.previousAssignments).join(" "),
    person.notes,
    person.owner,
    person.recruiter,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}
