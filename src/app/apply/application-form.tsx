"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
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

const LANGUAGE_EXAMPLE = `Example:
English – Spoken: Fluent, Written: Fluent
Dutch – Spoken: Advanced, Written: Intermediate
Spanish – Spoken: Intermediate, Written: Basic`;

function LanguagesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const open = hover || pinned;

  useEffect(() => {
    if (!pinned) return;

    function closeIfOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setPinned(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPinned(false);
    }

    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [pinned]);

  return (
    <div ref={rootRef}>
      <div
        className="text-sm font-medium leading-5 text-zinc-900"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <label htmlFor="languages">
          Which languages do you speak, and what is your proficiency in each?
        </label>
        <button
          type="button"
          aria-label="Show an example"
          aria-expanded={open}
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full align-middle text-zinc-400 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setPinned((current) => !current)}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 9.25v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="6.25" r="0.8" fill="currentColor" />
          </svg>
        </button>
        {open ? (
          <span
            role="tooltip"
            className="mt-2 block whitespace-pre-line rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-sm font-normal leading-5 text-zinc-600"
          >
            {LANGUAGE_EXAMPLE}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm leading-5 text-zinc-500">
        Please list each language on a separate line and indicate your spoken and
        written proficiency (Basic, Intermediate, Advanced, or Fluent).
      </p>
      <textarea
        id="languages"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} min-h-20`}
      />
    </div>
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

function ApplyHeading({ title, text }: { title: string; text: string }) {
  return (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-bhp-navy">
        Application
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-bhp-navy">
        {title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">{text}</p>
    </>
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
  const [years, setYears] = useState("");
  const [specialty, setSpecialty] = useState<Specialty>("");
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
    const trimmedLinkedin = linkedin.trim();
    const profileLink = trimmedLinkedin ? linkedInLink(trimmedLinkedin) : null;
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (trimmedLinkedin && !profileLink) {
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
        years_as_gm: blankToNull(years),
        specialty: specialty || null,
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
      <ApplyHeading
        title="Thank you"
        text="We have received your application."
      />
    );
  }

  return (
    <>
      <ApplyHeading
        title="Tell us about your experience"
        text="No account is needed. Submit the form and we will review it."
      />
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <Question label="Full name">
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
          autoComplete="name"
        />
      </Question>
      <Question label="Email address">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
          autoComplete="email"
        />
      </Question>
      <Question label="Phone number">
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={inputClass}
          autoComplete="tel"
        />
      </Question>
      <Question label="LinkedIn profile">
        <input
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
      <Question label="Current Residence">
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
      <Question label="Preferred locations">
        <textarea
          value={preferredLocations}
          onChange={(event) => setPreferredLocations(event.target.value)}
          className={`${inputClass} min-h-20`}
        />
      </Question>
      <Question label="How many years have you worked as a General Manager?">
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
      <LanguagesField value={languages} onChange={setLanguages} />
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
    </>
  );
}
