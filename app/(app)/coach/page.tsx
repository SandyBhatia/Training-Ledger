import { createClient } from "@/lib/supabase/server";
import CoachView from "@/components/CoachView";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: messages }, { data: profile }] = await Promise.all([
    supabase.from("coach_messages").select("*").eq("user_id", user!.id).order("created_at").limit(200),
    supabase.from("profiles").select("display_name").eq("id", user!.id).single(),
  ]);
  return <CoachView initial={messages || []} name={profile?.display_name || ""} />;
}
