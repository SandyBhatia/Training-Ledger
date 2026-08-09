import { createClient } from "@/lib/supabase/server";
import ProgramView from "@/components/ProgramView";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: plan }, { data: logs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("plans").select("*").eq("user_id", user!.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("workout_logs").select("*").eq("user_id", user!.id),
  ]);
  return <ProgramView profile={profile} plan={plan} logs={logs || []} />;
}
