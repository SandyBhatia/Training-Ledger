import { createClient } from "@/lib/supabase/server";
import WindView from "@/components/WindView";

export const dynamic = "force-dynamic";

export default async function WindPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: rows } = await supabase.from("wind_down").select("*").eq("user_id", user!.id);
  return <WindView rows={rows || []} />;
}
