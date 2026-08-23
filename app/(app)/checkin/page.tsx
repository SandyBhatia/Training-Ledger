import { createClient } from "@/lib/supabase/server";
import CheckinView from "@/components/CheckinView";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: checkins }, { data: photos }, { data: logs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("checkins").select("*").eq("user_id", user!.id).order("week"),
    supabase.from("progress_photos").select("*").eq("user_id", user!.id),
    supabase.from("workout_logs").select("log_date, done, day_mode").eq("user_id", user!.id),
  ]);
  return <CheckinView profile={profile} checkins={checkins || []} photos={photos || []} logs={logs || []} />;
}
