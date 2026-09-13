import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendPush, pushReady } from "@/lib/push";
import { detectLapse, inTravelWindow } from "@/lib/travel";
import { keyOf } from "@/lib/schedule";

export const runtime = "nodejs";
export const maxDuration = 60;

/* Runs on a schedule (Vercel Cron). Finds people who haven't logged for two
   days and sends one gentle nudge. Deliberately conservative: at most one
   nudge every three days per person, never during a declared travel window
   or an eased period, and never more than twice for the same lapse. */

function admin() {
  // Service-role client: cron has no user session. Bypasses RLS by design,
  // so this route is protected by CRON_SECRET below.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "missing_service_role_key" }, { status: 500 });
  }
  if (!pushReady()) return NextResponse.json({ error: "push_not_configured" }, { status: 500 });

  const db = admin();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name, eased_until, nudges_enabled, last_nudge_at")
    .eq("onboarded", true)
    .eq("nudges_enabled", true);

  let sent = 0, skipped = 0;

  for (const p of profiles || []) {
    // Don't nudge during an eased period — we already agreed to back off.
    if (p.eased_until && keyOf(today) <= p.eased_until) { skipped++; continue; }
    // At most one nudge every three days.
    if (p.last_nudge_at && Date.now() - new Date(p.last_nudge_at).getTime() < 3 * 86400000) { skipped++; continue; }

    const [{ data: logs }, { data: windows }, { data: food }] = await Promise.all([
      db.from("workout_logs").select("log_date").eq("user_id", p.id).eq("done", true),
      db.from("travel_windows").select("start_date, end_date").eq("user_id", p.id),
      db.from("food_log").select("log_date").eq("user_id", p.id).order("log_date", { ascending: false }).limit(1),
    ]);

    // Any activity counts as being present — logging food is engagement too.
    const keys = [...(logs || []).map((l) => l.log_date), ...(food || []).map((f) => f.log_date)];
    const lapse = detectLapse(keys, today);
    if (!lapse.shouldAsk) { skipped++; continue; }
    if (inTravelWindow(today, windows || [])) { skipped++; continue; }

    const { data: subs } = await db
      .from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", p.id);
    if (!subs?.length) { skipped++; continue; }

    const name = p.display_name ? `${p.display_name}, ` : "";
    const body = lapse.gapDays >= 5
      ? `${name}it's been ${lapse.gapDays} days. No judgement — tell me what's going on and I'll reshape the week so you land something.`
      : `${name}two quiet days. Travelling, or just a rough patch? I can shrink this week so you still get a session in.`;

    for (const s of subs) {
      const r = await sendPush(s, { title: "Training Ledger", body, url: "/today" });
      if (r.gone) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      if (r.ok) sent++;
    }

    await db.from("profiles").update({ last_nudge_at: new Date().toISOString() }).eq("id", p.id);
    await db.from("nudges").insert({ user_id: p.id, gap_days: lapse.gapDays, responded: false });
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
