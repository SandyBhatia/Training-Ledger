import { createClient } from "@/lib/supabase/server";
import TodayView from "@/components/TodayView";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: plan }, { data: logs }, { data: windows }, { data: food }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("plans").select("*").eq("user_id", user!.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("workout_logs").select("*").eq("user_id", user!.id),
    supabase.from("travel_windows").select("*").eq("user_id", user!.id),
    supabase.from("food_log").select("log_date").eq("user_id", user!.id).order("log_date", { ascending: false }).limit(1),
  ]);
  return <TodayView profile={profile} plan={plan} logs={logs || []} windows={windows || []} lastFood={food?.[0]?.log_date || null} />;
}
