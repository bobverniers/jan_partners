import { redirect } from "next/navigation";
import { PeopleDirectory } from "@/components/people-directory";
import {
  clearUnknownRecruiters,
  mapPerson,
  type PersonRow,
} from "@/lib/people";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/login");
  }

  const recruiterError = await clearUnknownRecruiters(supabase);
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("name");

  const people = ((data ?? []) as PersonRow[]).map(mapPerson);
  return (
    <PeopleDirectory
      people={people}
      loadError={error?.message ?? recruiterError}
    />
  );
}
