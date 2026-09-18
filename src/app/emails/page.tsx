import { redirect } from "next/navigation";
import { EmailsDirectory } from "@/components/emails-directory";
import { uniqueEmails } from "@/lib/people";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/login");
  }

  const { data, error } = await supabase.from("people").select("email");
  const emails = uniqueEmails(
    ((data ?? []) as Array<{ email: string | null }>).map((row) => row.email),
  );

  return <EmailsDirectory emails={emails} loadError={error?.message ?? null} />;
}
