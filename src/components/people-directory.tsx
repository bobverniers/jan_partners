"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  PERSON_STATUS_LABELS,
  PERSON_STATUSES,
  personMatchesQuery,
  type Person,
  type PersonStatus,
} from "@/lib/people";
import {
  EMPTY_FILTERS,
  KEY_RANGES,
  NOTICE_OPTIONS,
  YEAR_OPTIONS,
  activeFilterCount,
  filterChips,
  languageOptions,
  personMatchesFilters,
  residenceOptions,
  specialtyOptions,
  toggleValue,
  type PeopleFilters,
} from "@/lib/people-filters";
import { PeopleProfileDrawer } from "@/components/people-profile-drawer";
import { SignOutButton } from "@/components/sign-out-button";
import { signedCvUrl } from "@/lib/cv-storage";

type SortKey =
  | "starred"
  | "name"
  | "reference"
  | "cv"
  | "residence"
  | "passports"
  | "preferredLocations"
  | "noticePeriod"
  | "maximumDuration"
  | "position"
  | "previousAssignments"
  | "yearsAsGm"
  | "specialty"
  | "keys"
  | "openingExperience"
  | "capex"
  | "languages"
  | "linkedin"
  | "email"
  | "phone"
  | "personalStatus"
  | "blackoutDates"
  | "enrolmentDate"
  | "notes"
  | "status"
  | "tier"
  | "hasCv"
  | "hasContract"
  | "hasTracking"
  | "hasReferences"
  | "owner"
  | "recruiter"
  | "consultancy"
  | "comments";

const TEXT_COL = "w-[52ch] max-w-[52ch]";

function empty(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function joined(values: string[] | null | undefined): string {
  return values && values.length > 0 ? values.join(", ") : "—";
}

function isLongCell(text: string): boolean {
  if (!text || text === "—") return false;
  const words = text.trim().split(/\s+/);
  return words.length > 10 || text.length > 60;
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const display = empty(text);
  const long = isLongCell(display);

  return (
    <div>
      <p
        className={`break-words ${expanded || !long ? "" : "line-clamp-1"}`}
      >
        {display}
      </p>
      {long ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
          className="mt-1 text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

function yesNo(value: boolean | null): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function asHref(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "—" || trimmed.toLowerCase() === "yes") {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes("linkedin.com") || trimmed.includes(".")) {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }
  return null;
}

function LinkCell({ value }: { value: string | null }) {
  const href = asHref(value);
  if (!href) return <>{empty(value)}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
    >
      Open
    </a>
  );
}

function CvCell({ person }: { person: Person }) {
  async function openFile(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!person.cvFilePath) return;
    const { url } = await signedCvUrl(person.cvFilePath);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  if (person.cvFilePath) {
    return (
      <button
        type="button"
        onClick={openFile}
        className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
      >
        Open
      </button>
    );
  }

  return <LinkCell value={person.cvUrl} />;
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm ring-1 ring-inset ${
        selected
          ? "bg-zinc-900 text-white ring-zinc-900"
          : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: PersonStatus }) {
  const styles: Record<PersonStatus, string> = {
    new: "bg-sky-50 text-sky-700 ring-sky-200",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {PERSON_STATUS_LABELS[status]}
    </span>
  );
}

const COLUMNS: {
  key: SortKey;
  label: string;
  sticky?: boolean;
  stickyClass?: string;
  className?: string;
  sortValue: (person: Person) => string;
  render: (person: Person) => ReactNode;
}[] = [
  {
    key: "starred",
    label: "*",
    sticky: true,
    stickyClass: "left-0",
    className: "w-10 bg-white",
    sortValue: (person) => (person.starred ? "1" : "0"),
    render: (person) => (person.starred ? "★" : ""),
  },
  {
    key: "name",
    label: "Name",
    sticky: true,
    stickyClass: "left-10",
    className: `${TEXT_COL} bg-white font-medium text-zinc-900`,
    sortValue: (person) => person.name,
    render: (person) => <ExpandableText text={person.name} />,
  },
  {
    key: "reference",
    label: "Ref. #",
    className: "min-w-16",
    sortValue: (person) => person.referenceNumber ?? "",
    render: (person) => empty(person.referenceNumber),
  },
  {
    key: "status",
    label: "Status",
    className: "min-w-24",
    sortValue: (person) => PERSON_STATUS_LABELS[person.status],
    render: (person) => <StatusBadge status={person.status} />,
  },
  {
    key: "tier",
    label: "A/B",
    className: "min-w-14",
    sortValue: (person) => person.tier ?? "",
    render: (person) => empty(person.tier),
  },
  {
    key: "cv",
    label: "CV",
    className: "min-w-16",
    sortValue: (person) => person.cvFileName ?? person.cvUrl ?? "",
    render: (person) => <CvCell person={person} />,
  },
  {
    key: "residence",
    label: "Residence",
    className: TEXT_COL,
    sortValue: (person) => person.primaryResidence ?? "",
    render: (person) => <ExpandableText text={empty(person.primaryResidence)} />,
  },
  {
    key: "passports",
    label: "Passports",
    className: TEXT_COL,
    sortValue: (person) => joined(person.passports),
    render: (person) => <ExpandableText text={joined(person.passports)} />,
  },
  {
    key: "preferredLocations",
    label: "Preferred locations",
    className: TEXT_COL,
    sortValue: (person) => person.preferredLocations ?? "",
    render: (person) => (
      <ExpandableText text={empty(person.preferredLocations)} />
    ),
  },
  {
    key: "noticePeriod",
    label: "Notice",
    className: TEXT_COL,
    sortValue: (person) => person.noticePeriod ?? "",
    render: (person) => <ExpandableText text={empty(person.noticePeriod)} />,
  },
  {
    key: "maximumDuration",
    label: "Max duration",
    className: TEXT_COL,
    sortValue: (person) => person.maximumDuration ?? "",
    render: (person) => (
      <ExpandableText text={empty(person.maximumDuration)} />
    ),
  },
  {
    key: "position",
    label: "Most recent position",
    className: TEXT_COL,
    sortValue: (person) => person.mostRecentPosition ?? "",
    render: (person) => (
      <ExpandableText text={empty(person.mostRecentPosition)} />
    ),
  },
  {
    key: "previousAssignments",
    label: "Previous assignments",
    className: TEXT_COL,
    sortValue: (person) => joined(person.previousAssignments),
    render: (person) => (
      <ExpandableText text={joined(person.previousAssignments)} />
    ),
  },
  {
    key: "yearsAsGm",
    label: "Years as GM",
    className: TEXT_COL,
    sortValue: (person) => person.yearsAsGm ?? "",
    render: (person) => <ExpandableText text={empty(person.yearsAsGm)} />,
  },
  {
    key: "specialty",
    label: "Specialty",
    className: TEXT_COL,
    sortValue: (person) => person.specialty ?? "",
    render: (person) => <ExpandableText text={empty(person.specialty)} />,
  },
  {
    key: "keys",
    label: "Keys",
    className: TEXT_COL,
    sortValue: (person) => person.numberOfKeys ?? "",
    render: (person) => <ExpandableText text={empty(person.numberOfKeys)} />,
  },
  {
    key: "openingExperience",
    label: "Opening experience",
    className: TEXT_COL,
    sortValue: (person) => person.openingExperience ?? "",
    render: (person) => (
      <ExpandableText text={empty(person.openingExperience)} />
    ),
  },
  {
    key: "capex",
    label: "Capex / refurb",
    className: TEXT_COL,
    sortValue: (person) => person.capexRefurbExperience ?? "",
    render: (person) => (
      <ExpandableText text={empty(person.capexRefurbExperience)} />
    ),
  },
  {
    key: "languages",
    label: "Languages",
    className: TEXT_COL,
    sortValue: (person) => joined(person.languages),
    render: (person) => <ExpandableText text={joined(person.languages)} />,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    className: "min-w-24",
    sortValue: (person) => person.linkedinUrl ?? "",
    render: (person) => <LinkCell value={person.linkedinUrl} />,
  },
  {
    key: "email",
    label: "Email",
    className: TEXT_COL,
    sortValue: (person) => person.email ?? "",
    render: (person) => <ExpandableText text={empty(person.email)} />,
  },
  {
    key: "phone",
    label: "Phone",
    className: TEXT_COL,
    sortValue: (person) => person.phone ?? "",
    render: (person) => <ExpandableText text={empty(person.phone)} />,
  },
  {
    key: "personalStatus",
    label: "Personal status",
    className: TEXT_COL,
    sortValue: (person) => person.personalStatus ?? "",
    render: (person) => <ExpandableText text={empty(person.personalStatus)} />,
  },
  {
    key: "blackoutDates",
    label: "Blackout dates",
    className: TEXT_COL,
    sortValue: (person) => person.blackoutDates ?? "",
    render: (person) => <ExpandableText text={empty(person.blackoutDates)} />,
  },
  {
    key: "enrolmentDate",
    label: "Enrolment date",
    className: TEXT_COL,
    sortValue: (person) => person.enrolmentDate ?? "",
    render: (person) => <ExpandableText text={empty(person.enrolmentDate)} />,
  },
  {
    key: "notes",
    label: "Notes",
    className: TEXT_COL,
    sortValue: (person) => person.notes ?? "",
    render: (person) => <ExpandableText text={empty(person.notes)} />,
  },
  {
    key: "hasCv",
    label: "Has CV",
    className: "min-w-20",
    sortValue: (person) => yesNo(person.hasCv),
    render: (person) => yesNo(person.hasCv),
  },
  {
    key: "hasContract",
    label: "Contract",
    className: "min-w-24",
    sortValue: (person) => yesNo(person.hasContract),
    render: (person) => yesNo(person.hasContract),
  },
  {
    key: "hasTracking",
    label: "Tracking",
    className: "min-w-24",
    sortValue: (person) => yesNo(person.hasTracking),
    render: (person) => yesNo(person.hasTracking),
  },
  {
    key: "hasReferences",
    label: "References",
    className: "min-w-28",
    sortValue: (person) => yesNo(person.hasReferences),
    render: (person) => yesNo(person.hasReferences),
  },
  {
    key: "owner",
    label: "JK/JC",
    className: "min-w-20",
    sortValue: (person) => person.owner ?? "",
    render: (person) => empty(person.owner),
  },
  {
    key: "recruiter",
    label: "Recruiter",
    className: "min-w-28",
    sortValue: (person) => person.recruiter ?? "",
    render: (person) => empty(person.recruiter),
  },
  {
    key: "consultancy",
    label: "Consultancy",
    className: "min-w-28",
    sortValue: (person) => person.consultancy ?? "",
    render: (person) => empty(person.consultancy),
  },
  {
    key: "comments",
    label: "Comments",
    className: TEXT_COL,
    sortValue: (person) => person.dropboxComments ?? "",
    render: (person) => <ExpandableText text={empty(person.dropboxComments)} />,
  },
];

export function PeopleDirectory({
  people,
  loadError,
  userEmail,
}: {
  people: Person[];
  loadError?: string | null;
  userEmail?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<PeopleFilters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [createdPerson, setCreatedPerson] = useState<Person | null>(null);

  const selectedPerson =
    people.find((person) => person.id === selectedId) ??
    (createdPerson?.id === selectedId ? createdPerson : null);

  const residences = useMemo(() => residenceOptions(people), [people]);
  const specialties = useMemo(() => specialtyOptions(people), [people]);
  const languages = useMemo(() => languageOptions(people), [people]);
  const selectedFilterCount = activeFilterCount(filters);
  const activeChips = filterChips(filters);

  const visiblePeople = useMemo(() => {
    const filtered = people.filter((person) => {
      return (
        personMatchesQuery(person, query) &&
        personMatchesFilters(person, filters)
      );
    });

    const column = COLUMNS.find((item) => item.key === sortKey) ?? COLUMNS[1];

    return [...filtered].sort((a, b) => {
      const left = column.sortValue(a).toLowerCase();
      const right = column.sortValue(b).toLowerCase();
      const comparison = left.localeCompare(right, undefined, {
        numeric: true,
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [people, query, filters, sortKey, sortDirection]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  }

  function updateFilters<K extends keyof PeopleFilters>(
    key: K,
    value: PeopleFilters[K][number],
  ) {
    setFilters((current) => ({
      ...current,
      [key]: toggleValue(current[key] as PeopleFilters[K][number][], value),
    }));
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Hotel Managers
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {visiblePeople.length} of {people.length} people · scroll sideways
              for every spreadsheet column
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="people-search">
              Search people
            </label>
            <input
              id="people-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people..."
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 sm:w-72"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Filters
              {selectedFilterCount > 0 ? ` (${selectedFilterCount})` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setAdding(true);
              }}
              className="h-10 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              + Add person
            </button>
            {userEmail ? (
              <span className="hidden text-xs text-zinc-500 sm:inline">
                {userEmail}
              </span>
            ) : null}
            <SignOutButton />
          </div>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Could not load people from the database. {loadError}
          </div>
        ) : null}

        {filtersOpen ? (
          <div className="grid gap-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            <FilterGroup title="Status">
              {PERSON_STATUSES.map((status) => (
                <FilterChip
                  key={status}
                  selected={filters.statuses.includes(status)}
                  onClick={() => updateFilters("statuses", status)}
                >
                  {PERSON_STATUS_LABELS[status]}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup title="A/B">
              {(["A", "B"] as const).map((tier) => (
                <FilterChip
                  key={tier}
                  selected={filters.tiers.includes(tier)}
                  onClick={() => updateFilters("tiers", tier)}
                >
                  {tier}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup title="Residence">
              {residences.map((residence) => (
                <FilterChip
                  key={residence}
                  selected={filters.residences.includes(residence)}
                  onClick={() => updateFilters("residences", residence)}
                >
                  {residence}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup title="Specialty">
              {specialties.map((option) => (
                <FilterChip
                  key={option.id}
                  selected={filters.specialties.includes(option.id)}
                  onClick={() => updateFilters("specialties", option.id)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup title="Languages">
              {languages.map((option) => (
                <FilterChip
                  key={option.id}
                  selected={filters.languages.includes(option.id)}
                  onClick={() => updateFilters("languages", option.id)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup title="Years as GM">
              {YEAR_OPTIONS.map((years) => (
                <FilterChip
                  key={years}
                  selected={filters.minYears.includes(years)}
                  onClick={() => updateFilters("minYears", years)}
                >
                  {years}+
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup title="Keys">
              {KEY_RANGES.map((range) => (
                <FilterChip
                  key={range.id}
                  selected={filters.keyRanges.includes(range.id)}
                  onClick={() => updateFilters("keyRanges", range.id)}
                >
                  {range.label}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup title="Opening experience">
              <FilterChip
                selected={filters.opening.includes("yes")}
                onClick={() => updateFilters("opening", "yes")}
              >
                Yes
              </FilterChip>
              <FilterChip
                selected={filters.opening.includes("no")}
                onClick={() => updateFilters("opening", "no")}
              >
                No
              </FilterChip>
            </FilterGroup>
            <FilterGroup title="Capex / refurb">
              <FilterChip
                selected={filters.capex.includes("yes")}
                onClick={() => updateFilters("capex", "yes")}
              >
                Yes
              </FilterChip>
              <FilterChip
                selected={filters.capex.includes("no")}
                onClick={() => updateFilters("capex", "no")}
              >
                No
              </FilterChip>
            </FilterGroup>
            <FilterGroup title="Notice">
              {NOTICE_OPTIONS.map((option) => (
                <FilterChip
                  key={option.id}
                  selected={filters.notice.includes(option.id)}
                  onClick={() => updateFilters("notice", option.id)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup title="Availability">
              <FilterChip
                selected={filters.blackout.includes("none")}
                onClick={() => updateFilters("blackout", "none")}
              >
                No blackouts
              </FilterChip>
              <FilterChip
                selected={filters.blackout.includes("has")}
                onClick={() => updateFilters("blackout", "has")}
              >
                Has blackouts
              </FilterChip>
            </FilterGroup>
          </div>
        ) : null}

        {activeChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilters((current) => chip.clear(current))}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
              >
                {chip.label} ×
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Clear all
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-max min-w-full border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 py-3 whitespace-nowrap ${
                      column.sticky
                        ? `sticky z-30 bg-zinc-50 shadow-[1px_0_0_0_#e4e4e7] ${column.stickyClass ?? "left-0"}`
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1 hover:text-zinc-800"
                    >
                      {column.label}
                      {sortKey === column.key
                        ? sortDirection === "asc"
                          ? " ↑"
                          : " ↓"
                        : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePeople.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                    colSpan={COLUMNS.length}
                  >
                    No people match this search.
                  </td>
                </tr>
              ) : (
                visiblePeople.map((person) => {
                  const selected = person.id === selectedId;
                  return (
                    <tr
                      key={person.id}
                      onClick={(event) => {
                        if (
                          (event.target as HTMLElement).closest("a, button")
                        ) {
                          return;
                        }
                        setAdding(false);
                        setSelectedId(person.id);
                      }}
                      className={`group cursor-pointer border-b border-zinc-100 last:border-0 ${
                        selected
                          ? "bg-sky-50 hover:bg-sky-50"
                          : "hover:bg-zinc-50"
                      }`}
                    >
                      {COLUMNS.map((column) => (
                        <td
                          key={column.key}
                          className={`px-3 py-2 align-top text-zinc-600 ${column.className ?? ""} ${
                            column.sticky
                              ? `sticky z-20 shadow-[1px_0_0_0_#e4e4e7] ${column.stickyClass ?? "left-0"} ${
                                  selected
                                    ? "bg-sky-50"
                                    : "bg-white group-hover:bg-zinc-50"
                                }`
                              : ""
                          }`}
                        >
                          {column.render(person)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {adding || selectedPerson ? (
        <PeopleProfileDrawer
          person={adding ? null : selectedPerson}
          onClose={() => {
            setAdding(false);
            setSelectedId(null);
            setCreatedPerson(null);
          }}
          onCreated={(person) => {
            setAdding(false);
            setCreatedPerson(person);
            setSelectedId(person.id);
          }}
        />
      ) : null}
    </main>
  );
}
