"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  PERSON_STATUS_LABELS,
  PERSON_STATUSES,
  asStringList,
  toUpdatePayload,
  type Person,
  type PersonStatus,
} from "@/lib/people";
import {
  CV_ACCEPT,
  removeCvFiles,
  signedCvUrl,
  uploadCvFile,
  validateCvFile,
} from "@/lib/cv-storage";
import {
  TRACKING_SHEET_ACCEPT,
  parseTrackingSheet,
  validateTrackingSheetFile,
  type TrackingSheetValues,
} from "@/lib/tracking-sheet";
import { createSupabaseClient } from "@/lib/supabase/client";

type NullableFlag = "yes" | "no" | "";

type Draft = {
  name: string;
  referenceNumber: string;
  cvUrl: string;
  cvFilePath: string;
  cvFileName: string;
  primaryResidence: string;
  passports: string;
  preferredLocations: string;
  noticePeriod: string;
  maximumDuration: string;
  blackoutDates: string;
  mostRecentPosition: string;
  previousAssignments: string;
  yearsAsGm: string;
  specialty: string;
  numberOfKeys: string;
  openingExperience: string;
  capexRefurbExperience: string;
  languages: string;
  linkedinUrl: string;
  email: string;
  phone: string;
  personalStatus: string;
  enrolmentDate: string;
  notes: string;
  status: PersonStatus;
  tier: string;
  hasCv: NullableFlag;
  hasContract: NullableFlag;
  hasTracking: NullableFlag;
  hasReferences: NullableFlag;
  owner: string;
  recruiter: string;
  consultancy: string;
  dropboxComments: string;
};

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function flagFrom(value: boolean | null): NullableFlag {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function flagTo(value: NullableFlag): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function emptyPerson(): Person {
  return {
    id: "",
    name: "",
    referenceNumber: null,
    cvUrl: null,
    cvFilePath: null,
    cvFileName: null,
    primaryResidence: null,
    passports: [],
    preferredLocations: null,
    noticePeriod: null,
    maximumDuration: null,
    mostRecentPosition: null,
    previousAssignments: [],
    yearsAsGm: null,
    specialty: null,
    numberOfKeys: null,
    openingExperience: null,
    capexRefurbExperience: null,
    languages: [],
    linkedinUrl: null,
    email: null,
    phone: null,
    personalStatus: null,
    blackoutDates: null,
    enrolmentDate: null,
    notes: null,
    status: "new",
    tier: null,
    hasCv: null,
    hasContract: null,
    hasTracking: null,
    hasReferences: null,
    owner: null,
    recruiter: null,
    consultancy: null,
    dropboxComments: null,
  };
}

function personToDraft(person: Person): Draft {
  return {
    name: person.name,
    referenceNumber: person.referenceNumber ?? "",
    cvUrl: person.cvUrl ?? "",
    cvFilePath: person.cvFilePath ?? "",
    cvFileName: person.cvFileName ?? "",
    primaryResidence: person.primaryResidence ?? "",
    passports: asStringList(person.passports).join("\n"),
    preferredLocations: person.preferredLocations ?? "",
    noticePeriod: person.noticePeriod ?? "",
    maximumDuration: person.maximumDuration ?? "",
    blackoutDates: person.blackoutDates ?? "",
    mostRecentPosition: person.mostRecentPosition ?? "",
    previousAssignments: asStringList(person.previousAssignments).join("\n"),
    yearsAsGm: person.yearsAsGm ?? "",
    specialty: person.specialty ?? "",
    numberOfKeys: person.numberOfKeys ?? "",
    openingExperience: person.openingExperience ?? "",
    capexRefurbExperience: person.capexRefurbExperience ?? "",
    languages: asStringList(person.languages).join("\n"),
    linkedinUrl: person.linkedinUrl ?? "",
    email: person.email ?? "",
    phone: person.phone ?? "",
    personalStatus: person.personalStatus ?? "",
    enrolmentDate: person.enrolmentDate ?? "",
    notes: person.notes ?? "",
    status: person.status,
    tier: person.tier ?? "",
    hasCv: flagFrom(person.hasCv),
    hasContract: flagFrom(person.hasContract),
    hasTracking: flagFrom(person.hasTracking),
    hasReferences: flagFrom(person.hasReferences),
    owner: person.owner ?? "",
    recruiter: person.recruiter ?? "",
    consultancy: person.consultancy ?? "",
    dropboxComments: person.dropboxComments ?? "",
  };
}

function draftToPerson(person: Person, draft: Draft): Person {
  return {
    ...person,
    name: draft.name.trim(),
    referenceNumber: blankToNull(draft.referenceNumber),
    cvUrl: blankToNull(draft.cvUrl),
    cvFilePath: blankToNull(draft.cvFilePath),
    cvFileName: blankToNull(draft.cvFileName),
    primaryResidence: blankToNull(draft.primaryResidence),
    passports: parseList(draft.passports),
    preferredLocations: blankToNull(draft.preferredLocations),
    noticePeriod: blankToNull(draft.noticePeriod),
    maximumDuration: blankToNull(draft.maximumDuration),
    blackoutDates: blankToNull(draft.blackoutDates),
    mostRecentPosition: blankToNull(draft.mostRecentPosition),
    previousAssignments: parseList(draft.previousAssignments),
    yearsAsGm: blankToNull(draft.yearsAsGm),
    specialty: blankToNull(draft.specialty),
    numberOfKeys: blankToNull(draft.numberOfKeys),
    openingExperience: blankToNull(draft.openingExperience),
    capexRefurbExperience: blankToNull(draft.capexRefurbExperience),
    languages: parseList(draft.languages),
    linkedinUrl: blankToNull(draft.linkedinUrl),
    email: blankToNull(draft.email),
    phone: blankToNull(draft.phone),
    personalStatus: blankToNull(draft.personalStatus),
    enrolmentDate: blankToNull(draft.enrolmentDate),
    notes: blankToNull(draft.notes),
    status: draft.status,
    tier: blankToNull(draft.tier),
    hasCv: flagTo(draft.hasCv),
    hasContract: flagTo(draft.hasContract),
    hasTracking: flagTo(draft.hasTracking),
    hasReferences: flagTo(draft.hasReferences),
    owner: blankToNull(draft.owner),
    recruiter: blankToNull(draft.recruiter),
    consultancy: blankToNull(draft.consultancy),
    dropboxComments: blankToNull(draft.dropboxComments),
  };
}

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10";

function applyTrackingSheet(
  current: Draft,
  values: TrackingSheetValues,
): Draft {
  const next = { ...current };
  (Object.keys(values) as (keyof TrackingSheetValues)[]).forEach((key) => {
    const value = values[key];
    if (value) {
      next[key] = value;
    }
  });
  return next;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function FlagSelect({
  value,
  onChange,
}: {
  value: NullableFlag;
  onChange: (value: NullableFlag) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as NullableFlag)}
      className={inputClass}
    >
      <option value="">—</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

export function PeopleProfileDrawer({
  person,
  onClose,
  onCreated,
}: {
  person: Person | null;
  onClose: () => void;
  onCreated?: (person: Person) => void;
}) {
  const router = useRouter();
  const isNew = person === null;
  const [draft, setDraft] = useState<Draft>(() =>
    personToDraft(person ?? emptyPerson()),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removeStoredFile, setRemoveStoredFile] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [sheetInputKey, setSheetInputKey] = useState(0);
  const [sheetNotice, setSheetNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(personToDraft(person ?? emptyPerson()));
    setError(null);
    setSaved(false);
    setConfirmingDelete(false);
    setDeleting(false);
    setPendingFile(null);
    setRemoveStoredFile(false);
    setFileInputKey((current) => current + 1);
    setSheetInputKey((current) => current + 1);
    setSheetNotice(null);
  }, [person?.id, isNew]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function onTrackingSheet(file: File | null) {
    if (!file) return;

    const invalid = validateTrackingSheetFile(file);
    if (invalid) {
      setError(invalid);
      setSheetInputKey((current) => current + 1);
      return;
    }

    try {
      const parsed = parseTrackingSheet(await file.arrayBuffer());
      if (parsed.error || !parsed.values) {
        setError(parsed.error ?? "Could not read that tracking sheet.");
        setSheetNotice(null);
        setSheetInputKey((current) => current + 1);
        return;
      }

      const values = parsed.values;
      setDraft((current) => applyTrackingSheet(current, values));
      setError(null);
      setSaved(false);
      setSheetNotice(`Filled from ${file.name}. Review the form, then save.`);
    } catch {
      setError("Could not read that tracking sheet.");
      setSheetNotice(null);
    }

    setSheetInputKey((current) => current + 1);
  }

  async function persistCv(personId: string, nextPerson: Person) {
    if (pendingFile) {
      const uploaded = await uploadCvFile(personId, pendingFile);
      if (uploaded.error || !uploaded.path) {
        return {
          person: nextPerson,
          error: uploaded.error ?? "Could not upload the CV.",
        };
      }

      return {
        person: {
          ...nextPerson,
          cvFilePath: uploaded.path,
          cvFileName: uploaded.fileName,
          hasCv: true,
        },
        error: null as string | null,
      };
    }

    if (removeStoredFile) {
      const removeError = await removeCvFiles(personId);
      if (removeError) {
        return { person: nextPerson, error: removeError };
      }

      return {
        person: { ...nextPerson, cvFilePath: null, cvFileName: null },
        error: null as string | null,
      };
    }

    return { person: nextPerson, error: null as string | null };
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    let updated = draftToPerson(person ?? emptyPerson(), draft);
    const supabase = createSupabaseClient();

    if (isNew) {
      const { data, error: saveError } = await supabase
        .from("people")
        .insert(toUpdatePayload(updated))
        .select("id")
        .single();

      if (saveError || !data) {
        setSaving(false);
        setError(saveError?.message ?? "Could not add this person.");
        return;
      }

      const persisted = await persistCv(data.id, { ...updated, id: data.id });
      updated = persisted.person;

      if (persisted.error) {
        setSaving(false);
        setError(persisted.error);
        onCreated?.(updated);
        return;
      }

      if (updated.cvFilePath) {
        const { error: fileSaveError } = await supabase
          .from("people")
          .update({
            cv_file_path: updated.cvFilePath,
            cv_file_name: updated.cvFileName,
            has_cv: updated.hasCv,
          })
          .eq("id", data.id);

        if (fileSaveError) {
          setSaving(false);
          setError(fileSaveError.message);
          onCreated?.(updated);
          return;
        }
      }

      setSaving(false);
      router.refresh();
      onCreated?.(updated);
      return;
    }

    const persisted = await persistCv(person.id, updated);
    updated = persisted.person;

    if (persisted.error) {
      setSaving(false);
      setError(persisted.error);
      return;
    }

    const { error: saveError } = await supabase
      .from("people")
      .update(toUpdatePayload(updated))
      .eq("id", person.id);

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setDraft(personToDraft(updated));
    setPendingFile(null);
    setRemoveStoredFile(false);
    setFileInputKey((current) => current + 1);
    setSaved(true);
    router.refresh();
  }

  async function onDelete() {
    if (!person) return;

    setDeleting(true);
    setError(null);

    await removeCvFiles(person.id);

    const supabase = createSupabaseClient();
    const { error: deleteError } = await supabase
      .from("people")
      .delete()
      .eq("id", person.id);

    setDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
    onClose();
  }

  const displayedCvName = pendingFile?.name || draft.cvFileName;
  const canOpenCv = Boolean(pendingFile || draft.cvFilePath);

  async function onOpenCv() {
    if (pendingFile) {
      const objectUrl = URL.createObjectURL(pendingFile);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return;
    }

    if (!draft.cvFilePath) return;
    const { url, error: openError } = await signedCvUrl(draft.cvFilePath);
    if (openError || !url) {
      setError(openError ?? "Could not open the CV.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close profile"
        className="absolute inset-0 bg-zinc-900/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-[54rem] flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {isNew ? "Add person" : "Profile"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-900">
              {isNew ? "New person" : person.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={onSave}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Name
              </h3>
              {isNew ? (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3">
                  <p className="text-sm font-medium text-zinc-900">
                    Fill from tracking sheet
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Upload a BHP .xlsx for one person. The file is only used to
                    fill this form and is not stored.
                  </p>
                  <input
                    ref={sheetInputRef}
                    key={sheetInputKey}
                    type="file"
                    accept={TRACKING_SHEET_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void onTrackingSheet(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => sheetInputRef.current?.click()}
                    className="mt-3 h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Upload Excel
                  </button>
                  {sheetNotice ? (
                    <p className="mt-2 text-xs text-emerald-700">{sheetNotice}</p>
                  ) : null}
                </div>
              ) : null}
              <Field label="Name">
                <input
                  autoFocus={isNew}
                  className={inputClass}
                  value={draft.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                />
              </Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Contact
              </h3>
              <Field label="Email">
                <input
                  className={inputClass}
                  value={draft.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={draft.phone}
                  onChange={(event) => update("phone", event.target.value)}
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  className={inputClass}
                  value={draft.linkedinUrl}
                  onChange={(event) =>
                    update("linkedinUrl", event.target.value)
                  }
                />
              </Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">CV</h3>
              <div>
                <div className="flex gap-2">
                  <input
                    aria-label="CV link"
                    className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
                    value={draft.cvUrl}
                    onChange={(event) => update("cvUrl", event.target.value)}
                    placeholder="https://"
                  />
                  <input
                    ref={fileInputRef}
                    key={fileInputKey}
                    type="file"
                    accept={CV_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (!file) {
                        setPendingFile(null);
                        return;
                      }
                      const invalid = validateCvFile(file);
                      if (invalid) {
                        setError(invalid);
                        event.target.value = "";
                        return;
                      }
                      setError(null);
                      setPendingFile(file);
                      setRemoveStoredFile(false);
                      setSaved(false);
                      if (draft.hasCv !== "yes") {
                        update("hasCv", "yes");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 shrink-0 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    {displayedCvName ? "Replace file" : "Upload file"}
                  </button>
                </div>
                {displayedCvName ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-700">
                    <span className="min-w-0 break-all">
                      {displayedCvName}
                      {pendingFile ? " (not saved yet)" : ""}
                    </span>
                    {canOpenCv ? (
                      <button
                        type="button"
                        onClick={onOpenCv}
                        className="text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
                      >
                        Open
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFile(null);
                        setRemoveStoredFile(true);
                        setFileInputKey((current) => current + 1);
                        update("cvFilePath", "");
                        update("cvFileName", "");
                      }}
                      className="text-sm font-medium text-red-700 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-zinc-400">
                    Link or file · PDF, Word, or image · max 10 MB
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Profile
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ref. #">
                  <input
                    className={inputClass}
                    value={draft.referenceNumber}
                    onChange={(event) =>
                      update("referenceNumber", event.target.value)
                    }
                  />
                </Field>
                <Field label="Status">
                  <select
                    className={inputClass}
                    value={draft.status}
                    onChange={(event) =>
                      update("status", event.target.value as PersonStatus)
                    }
                  >
                    {PERSON_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {PERSON_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Primary residence">
                <input
                  className={inputClass}
                  value={draft.primaryResidence}
                  onChange={(event) =>
                    update("primaryResidence", event.target.value)
                  }
                />
              </Field>
              <Field label="Passports">
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={draft.passports}
                  onChange={(event) => update("passports", event.target.value)}
                  placeholder="One per line"
                />
              </Field>
              <Field label="Preferred locations / exclusions">
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={draft.preferredLocations}
                  onChange={(event) =>
                    update("preferredLocations", event.target.value)
                  }
                />
              </Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Availability
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Notice period">
                  <input
                    className={inputClass}
                    value={draft.noticePeriod}
                    onChange={(event) =>
                      update("noticePeriod", event.target.value)
                    }
                  />
                </Field>
                <Field label="Maximum duration">
                  <input
                    className={inputClass}
                    value={draft.maximumDuration}
                    onChange={(event) =>
                      update("maximumDuration", event.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Blackout dates">
                <input
                  className={inputClass}
                  value={draft.blackoutDates}
                  onChange={(event) =>
                    update("blackoutDates", event.target.value)
                  }
                />
              </Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Professional experience
              </h3>
              <Field label="Most recent position">
                <input
                  className={inputClass}
                  value={draft.mostRecentPosition}
                  onChange={(event) =>
                    update("mostRecentPosition", event.target.value)
                  }
                />
              </Field>
              <Field label="Previous senior assignments">
                <textarea
                  className={`${inputClass} min-h-24`}
                  value={draft.previousAssignments}
                  onChange={(event) =>
                    update("previousAssignments", event.target.value)
                  }
                  placeholder="One per line"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Years as GM">
                  <input
                    className={inputClass}
                    value={draft.yearsAsGm}
                    onChange={(event) =>
                      update("yearsAsGm", event.target.value)
                    }
                  />
                </Field>
                <Field label="Number of keys">
                  <input
                    className={inputClass}
                    value={draft.numberOfKeys}
                    onChange={(event) =>
                      update("numberOfKeys", event.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Specialty">
                <input
                  className={inputClass}
                  value={draft.specialty}
                  onChange={(event) => update("specialty", event.target.value)}
                />
              </Field>
              <Field label="Opening experience">
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={draft.openingExperience}
                  onChange={(event) =>
                    update("openingExperience", event.target.value)
                  }
                />
              </Field>
              <Field label="Capex / refurbishment">
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={draft.capexRefurbExperience}
                  onChange={(event) =>
                    update("capexRefurbExperience", event.target.value)
                  }
                />
              </Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Languages
              </h3>
              <Field label="Languages">
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={draft.languages}
                  onChange={(event) => update("languages", event.target.value)}
                  placeholder="One per line"
                />
              </Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                BHP / database
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Personal status">
                  <input
                    className={inputClass}
                    value={draft.personalStatus}
                    onChange={(event) =>
                      update("personalStatus", event.target.value)
                    }
                  />
                </Field>
                <Field label="Enrolment date">
                  <input
                    className={inputClass}
                    value={draft.enrolmentDate}
                    onChange={(event) =>
                      update("enrolmentDate", event.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Notes">
                <textarea
                  className={`${inputClass} min-h-24`}
                  value={draft.notes}
                  onChange={(event) => update("notes", event.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="A/B">
                  <input
                    className={inputClass}
                    value={draft.tier}
                    onChange={(event) => update("tier", event.target.value)}
                  />
                </Field>
                <Field label="JK/JC">
                  <input
                    className={inputClass}
                    value={draft.owner}
                    onChange={(event) => update("owner", event.target.value)}
                  />
                </Field>
                <Field label="Has CV">
                  <FlagSelect
                    value={draft.hasCv}
                    onChange={(value) => update("hasCv", value)}
                  />
                </Field>
                <Field label="Contract">
                  <FlagSelect
                    value={draft.hasContract}
                    onChange={(value) => update("hasContract", value)}
                  />
                </Field>
                <Field label="Tracking">
                  <FlagSelect
                    value={draft.hasTracking}
                    onChange={(value) => update("hasTracking", value)}
                  />
                </Field>
                <Field label="References">
                  <FlagSelect
                    value={draft.hasReferences}
                    onChange={(value) => update("hasReferences", value)}
                  />
                </Field>
                <Field label="Recruiter">
                  <input
                    className={inputClass}
                    value={draft.recruiter}
                    onChange={(event) =>
                      update("recruiter", event.target.value)
                    }
                  />
                </Field>
                <Field label="Consultancy">
                  <input
                    className={inputClass}
                    value={draft.consultancy}
                    onChange={(event) =>
                      update("consultancy", event.target.value)
                    }
                  />
                </Field>
              </div>
              <Field label="Comments">
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={draft.dropboxComments}
                  onChange={(event) =>
                    update("dropboxComments", event.target.value)
                  }
                />
              </Field>
            </section>
          </div>

          <div className="border-t border-zinc-200 px-5 py-4">
            {error ? (
              <p className="mb-3 text-sm text-red-600">{error}</p>
            ) : null}
            {saved ? (
              <p className="mb-3 text-sm text-emerald-700">Saved.</p>
            ) : null}
            {confirmingDelete && !isNew ? (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Delete {person.name}? This cannot be undone.
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              {!isNew ? (
                confirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    className="h-10 rounded-lg px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                  >
                    Keep person
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSaved(false);
                      setConfirmingDelete(true);
                    }}
                    disabled={saving}
                    className="h-10 rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                {confirmingDelete && !isNew ? (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className="h-10 rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete person"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving || deleting}
                    className="h-10 rounded-lg bg-bhp-navy px-4 text-sm font-medium text-white hover:bg-bhp-navy-deep disabled:opacity-50"
                  >
                    {saving
                      ? pendingFile
                        ? "Uploading..."
                        : isNew
                          ? "Adding..."
                          : "Saving..."
                      : isNew
                        ? "Add person"
                        : "Save"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}
