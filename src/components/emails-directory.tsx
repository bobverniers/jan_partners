"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export function EmailsDirectory({
  emails,
  loadError,
}: {
  emails: string[];
  loadError?: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(emails));
  const [copiedCount, setCopiedCount] = useState<number | null>(null);
  const [copyError, setCopyError] = useState(false);

  const selectedEmails = useMemo(
    () => emails.filter((email) => selected.has(email)),
    [emails, selected],
  );

  function toggle(email: string) {
    setCopiedCount(null);
    setCopyError(false);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  }

  function selectAll() {
    setCopiedCount(null);
    setCopyError(false);
    setSelected(new Set(emails));
  }

  function deselectAll() {
    setCopiedCount(null);
    setCopyError(false);
    setSelected(new Set());
  }

  async function copySelected() {
    setCopyError(false);
    if (selectedEmails.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedEmails.join(", "));
      setCopiedCount(selectedEmails.length);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
            >
              ← Hotel Managers
            </Link>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-bhp-navy">
              Emails
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedEmails.length} of {emails.length} selected
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={selectAll}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={copySelected}
              disabled={selectedEmails.length === 0}
              className="h-10 rounded-lg bg-bhp-navy px-3 text-sm font-medium text-white hover:bg-bhp-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copiedCount != null ? `Copied ${copiedCount}` : "Copy selected"}
            </button>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Could not load emails from the database. {loadError}
          </div>
        ) : null}

        {copyError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Could not copy to the clipboard. Select the addresses below and copy
            them manually.
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {emails.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-zinc-500">
              No email addresses in the database.
            </p>
          ) : (
            <ul>
              {emails.map((email) => (
                <li key={email} className="border-b border-zinc-100 last:border-0">
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-zinc-900 hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={selected.has(email)}
                      onChange={() => toggle(email)}
                      className="size-4 rounded border-zinc-300 text-bhp-navy focus:ring-bhp-navy/20"
                    />
                    <span className="break-all">{email}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
