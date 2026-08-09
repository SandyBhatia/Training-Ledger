import { createClient } from "@/lib/supabase/server";
import CheckinView from "@/components/CheckinView";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: checkins }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("checkins").select("*").eq("user_id", user!.id).order("week"),
  ]);
  return <CheckinView profile={profile} checkins={checkins || []} />;
}
