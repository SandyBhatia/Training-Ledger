import { createClient } from "@/lib/supabase/server";
import SettingsView from "@/components/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: plan }, { count }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("plans").select("*").eq("user_id", user!.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("workout_logs").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
  ]);
  return <SettingsView profile={profile} plan={plan} logCount={count || 0} />;
}
