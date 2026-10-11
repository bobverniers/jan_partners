import type { Metadata } from "next";
import { ApplicationForm } from "@/app/apply/application-form";

export const metadata: Metadata = {
  title: "Apply | Bridge Hospitality Partners",
  description: "Submit an application to Bridge Hospitality Partners.",
};

export default function ApplyPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-bhp-navy">
        Application
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-bhp-navy">
        Tell us about your experience
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        No account is needed. Submit the form and we will review it.
      </p>
      <ApplicationForm />
    </main>
  );
}
