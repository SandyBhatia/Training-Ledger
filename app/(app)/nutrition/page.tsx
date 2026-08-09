import { createClient } from "@/lib/supabase/server";
import NutritionView from "@/components/NutritionView";

export const dynamic = "force-dynamic";

export default async function NutritionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: plan }, { data: food }] = await Promise.all([
    supabase.from("plans").select("*").eq("user_id", user!.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("food_log").select("*").eq("user_id", user!.id).eq("log_date", today).order("created_at"),
  ]);
  return <NutritionView plan={plan} initialFood={food || []} initialDate={today} />;
}
