"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { CV_ACCEPT, uploadNewCvFile, validateCvFile } from "@/lib/cv-storage";
import { createSupabaseClient } from "@/lib/supabase/client";

type YesNo = "" | "Yes" | "No";
type Specialty = "" | "City" | "Resort" | "Both";

const inputClass =
  "mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10";

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function linkedInLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function Question({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-900">{label}</span>
      {children}
    </label>
  );
}

function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-zinc-900">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset ${
              value === option
                ? "bg-bhp-navy text-white ring-bhp-navy"
                : "bg-white text-zinc-700 ring-zinc-200"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ApplicationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [residence, setResidence] = useState("");
  const [passports, setPassports] = useState("");
  const [preferredLocations, setPreferredLocations] = useState("");
  const [position, setPosition] = useState("");
  const [assignments, setAssignments] = useState("");
  const [years, setYears] = useState("");
  const [specialty, setSpecialty] = useState<Specialty>("");
  const [keys, setKeys] = useState("");
  const [opening, setOpening] = useState("");
  const [capex, setCapex] = useState<YesNo>("");
  const [languages, setLanguages] = useState("");
  const [consultancy, setConsultancy] = useState<YesNo>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const profileLink = linkedInLink(linkedin);
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!profileLink) {
      setError("Please enter a LinkedIn profile link.");
      return;
    }
    if (cv) {
      const invalid = validateCvFile(cv);
      if (invalid) {
        setError(invalid);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const id = crypto.randomUUID();
    let cvFilePath: string | null = null;
    let cvFileName: string | null = null;

    if (cv) {
      const uploaded = await uploadNewCvFile(id, cv);
      if (uploaded.error || !uploaded.path) {
        setSubmitting(false);
        setError(uploaded.error ?? "Could not upload the CV.");
        return;
      }
      cvFilePath = uploaded.path;
      cvFileName = uploaded.fileName;
    }

    const { error: saveError } = await createSupabaseClient()
      .from("people")
      .insert({
        id,
        name: trimmedName,
        email: blankToNull(email),
        phone: blankToNull(phone),
        linkedin_url: profileLink,
        cv_file_path: cvFilePath,
        cv_file_name: cvFileName,
        primary_residence: blankToNull(residence),
        passports: lines(passports),
        preferred_locations: blankToNull(preferredLocations),
        most_recent_position: blankToNull(position),
        previous_assignments: lines(assignments),
        years_as_gm: blankToNull(years),
        specialty: specialty || null,
        number_of_keys: blankToNull(keys),
        opening_experience: blankToNull(opening),
        capex_refurb_experience: capex || null,
        languages: lines(languages),
        consultancy: consultancy || null,
      });

    setSubmitting(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className="mt-8 text-sm text-zinc-700">
        Thank you. Your application has been received.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <Question label="What is your full name?">
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
          autoComplete="name"
        />
      </Question>
      <Question label="What is your email address?">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
          autoComplete="email"
        />
      </Question>
      <Question label="What is your phone number?">
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={inputClass}
          autoComplete="tel"
        />
      </Question>
      <Question label="What is your LinkedIn profile?">
        <input
          required
          type="url"
          inputMode="url"
          value={linkedin}
          onChange={(event) => setLinkedin(event.target.value)}
          className={inputClass}
          placeholder="https://www.linkedin.com/in/..."
        />
      </Question>
      <div>
        <span className="text-sm font-medium text-zinc-900">
          Please upload your CV
        </span>
        <div className="mt-2 flex h-11 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-1.5">
          <input
            ref={cvInputRef}
            type="file"
            accept={CV_ACCEPT}
            className="sr-only"
            onChange={(event) => setCv(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => cvInputRef.current?.click()}
            className="h-8 shrink-0 rounded-md bg-bhp-navy px-3 text-sm font-medium text-white hover:bg-bhp-navy-deep"
          >
            Choose file
          </button>
          <span className="min-w-0 truncate text-sm text-zinc-500">
            {cv ? cv.name : "No file chosen"}
          </span>
        </div>
        <span className="mt-1 block text-xs text-zinc-500">
          PDF, Word, or image. Maximum 10 MB.
        </span>
      </div>
      <Question label="Where do you currently live?">
        <input
          value={residence}
          onChange={(event) => setResidence(event.target.value)}
          className={inputClass}
        />
      </Question>
      <Question label="Which passports do you hold?">
        <textarea
          value={passports}
          onChange={(event) => setPassports(event.target.value)}
          className={`${inputClass} min-h-20`}
          placeholder="One per line"
        />
      </Question>
      <Question label="Which locations do you prefer to work?">
        <textarea
          value={preferredLocations}
          onChange={(event) => setPreferredLocations(event.target.value)}
          className={`${inputClass} min-h-20`}
        />
      </Question>
      <Question label="What is your most recent position?">
        <input
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          className={inputClass}
        />
      </Question>
      <Question label="What previous assignments have you held?">
        <textarea
          value={assignments}
          onChange={(event) => setAssignments(event.target.value)}
          className={`${inputClass} min-h-24`}
          placeholder="One per line"
        />
      </Question>
      <Question label="How many years have you worked as a general manager?">
        <input
          value={years}
          onChange={(event) => setYears(event.target.value)}
          className={inputClass}
        />
      </Question>
      <ChoiceGroup
        legend="Is your specialty city hotels, resorts, or both?"
        name="specialty"
        value={specialty}
        options={["City", "Resort", "Both"] as const}
        onChange={setSpecialty}
      />
      <Question label="How many hotel keys have you managed?">
        <input
          value={keys}
          onChange={(event) => setKeys(event.target.value)}
          className={inputClass}
        />
      </Question>
      <Question label="What opening experience do you have?">
        <textarea
          value={opening}
          onChange={(event) => setOpening(event.target.value)}
          className={`${inputClass} min-h-20`}
        />
      </Question>
      <ChoiceGroup
        legend="Do you have capex or refurbishment experience?"
        name="capex"
        value={capex}
        options={["Yes", "No"] as const}
        onChange={setCapex}
      />
      <Question label="Which languages do you speak?">
        <textarea
          value={languages}
          onChange={(event) => setLanguages(event.target.value)}
          className={`${inputClass} min-h-20`}
          placeholder="One per line"
        />
      </Question>
      <ChoiceGroup
        legend="Do you have your own consultancy?"
        name="consultancy"
        value={consultancy}
        options={["Yes", "No"] as const}
        onChange={setConsultancy}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-lg bg-bhp-navy text-sm font-medium text-white hover:bg-bhp-navy-deep disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Submit application"}
      </button>
    </form>
  );
}
