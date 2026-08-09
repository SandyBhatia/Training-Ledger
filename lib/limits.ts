import { createClient } from "./supabase/server";

/** Usage caps. Generous for normal use; they exist to stop runaway API spend,
    not to ration honest users. Raise these freely. */
export const LIMITS = {
  PLANS_PER_30_DAYS: 5,
  AI_MACROS_PER_DAY: 100,
};

type Check = { ok: boolean; used: number; limit: number; message?: string };

/** Plan generations in the last 30 days (counted from stored plans). */
export async function checkPlanLimit(userId: string, allowance = 0): Promise<Check> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { count } = await supabase
    .from("plans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  const used = count || 0;
  const limit = LIMITS.PLANS_PER_30_DAYS + allowance;
  return used >= limit
    ? {
        ok: false, used, limit,
        message: `You've generated ${used} plans in the last 30 days, which is the current limit. Your existing plan still works — you can change the start date or restart it from Settings without generating a new one.`,
      }
    : { ok: true, used, limit };
}

/** AI-estimated food lookups today (local database hits don't count). */
export async function checkMacroLimit(userId: string): Promise<Check> {
  const supabase = await createClient();
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("food_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .eq("macros->>src", "ai");

  const used = count || 0;
  const limit = LIMITS.AI_MACROS_PER_DAY;
  return used >= limit
    ? {
        ok: false, used, limit,
        message: `You've used today's ${limit} AI food estimates. Common foods still work instantly from the built-in database — this only limits unusual items.`,
      }
    : { ok: true, used, limit };
}
