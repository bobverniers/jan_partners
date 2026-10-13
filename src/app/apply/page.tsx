import type { Metadata } from "next";
import { ApplicationForm } from "@/app/apply/application-form";

export const metadata: Metadata = {
  title: "Information | Bridge Hospitality Partners",
  description: "Submit your information to Bridge Hospitality Partners.",
};

export default function ApplyPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <ApplicationForm />
    </main>
  );
}
