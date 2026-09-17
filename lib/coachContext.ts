import { createClient } from "./supabase/server";
import { conditionLabel } from "./conditions";
import { evidenceFor, evidenceBlock } from "./evidence";
import { bodyCompFor, projectToTarget } from "./bodycomp";
import { resolveDay, todayIndex, keyOf, fmtDate } from "./schedule";
import { inTravelWindow, isEased, detectLapse } from "./travel";

/* Assemble everything the coach needs to answer usefully: who they are, what
   the plan says, what they've actually done, what they've told us, and the
   evidence relevant to their conditions. This is the difference between a
   chatbot and a coach with continuity. */

export async function buildCoachContext(userId: string): Promise<{ system: string; profile: any }> {
  const db = await createClient();
  const [{ data: profile }, { data: plan }, { data: logs }, { data: checkins }, { data: windows }, { data: food }] =
    await Promise.all([
      db.from("profiles").select("*").eq("id", userId).single(),
      db.from("plans").select("*").eq("user_id", userId).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("workout_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }).limit(40),
      db.from("checkins").select("*").eq("user_id", userId).order("week"),
      db.from("travel_windows").select("*").eq("user_id", userId),
      db.from("food_log").select("log_date, meal, descr, macros").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    ]);

  const L: string[] = [];
  const age = profile?.birth_date
    ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / 3.15576e10) : null;

  L.push(`You are this person's training and nutrition coach inside their own app. You have their full history below. You are NOT a doctor: never diagnose, never interpret a lab value, never tell them what a marker means. Their numbers shape your advice; you do not grade them.

HOW TO COACH:
- Be direct and specific. Use their actual data — name the session, the weight, the trend.
- Give the smallest useful next step, not a lecture. One change at a time.
- Say "I don't know" or "that's outside what I can help with" when true. Confident vagueness is the failure mode to avoid.
- If something needs a clinician — chest pain, very high blood pressure, persistent unexplained symptoms, anything about medication — say so plainly and stop.
- Don't moralise about missed sessions. Gaps are normal; help them land the next one.
- Keep replies short unless they ask for depth. This is a phone screen.`);

  L.push("\n=== WHO THEY ARE ===");
  if (profile?.display_name) L.push(`Name: ${profile.display_name}`);
  if (age) L.push(`Age: ${age}`);
  if (profile?.sex) L.push(`Sex: ${profile.sex}`);
  if (profile?.height_cm) L.push(`Height: ${profile.height_cm} cm`);
  const conds = [...(profile?.conditions || []).map(conditionLabel), ...(profile?.conditions_other ? [profile.conditions_other] : [])];
  if (conds.length) L.push(`Conditions they recorded: ${conds.join(", ")}`);
  if (profile?.medications) L.push(`Medications they recorded: ${profile.medications}`);
  if (profile?.resting_bp) L.push(`Resting BP they recorded: ${profile.resting_bp}`);
  if (profile?.goals) L.push(`Their goal in their words: "${profile.goals}"`);
  if (profile?.target_body_fat) L.push(`Target body fat: ${profile.target_body_fat}%`);
  if (profile?.equipment) L.push(`Equipment: ${profile.equipment}`);
  if (profile?.diet_style) L.push(`Diet: ${profile.diet_style}`);
  if (profile?.allergies) L.push(`Avoids: ${profile.allergies}`);

  /* ---- today ---- */
  if (plan) {
    const start = new Date((plan.start_date || keyOf(new Date())) + "T00:00:00");
    const split = plan.workout?.split || [];
    const perWeek = plan.workout?.days_per_week || 5;
    const modes: Record<string, any> = {};
    (logs || []).forEach((l) => { if (l.day_mode) modes[l.log_date] = l.day_mode; });
    const tIdx = todayIndex(start);
    const today = resolveDay(start, Math.max(0, tIdx), restDowOf(profile), modes, split.length, perWeek);
    L.push("\n=== TODAY ===");
    L.push(`Date: ${new Date().toDateString()}`);
    if (tIdx < 0) L.push(`Their programme starts ${fmtDate(start)}.`);
    else if (today.isWorkout) {
      const tpl = split[today.splitIndex!];
      L.push(`Scheduled: ${tpl?.title || "session"} (session ${today.seq! + 1}, training week ${today.week + 1})`);
      if (tpl?.exercises) L.push(`Exercises: ${tpl.exercises.map((e: any) => `${e.name} ${e.sets_reps}`).join("; ")}`);
    } else L.push("Scheduled: rest day.");

    const trip = inTravelWindow(new Date(), windows || []);
    if (trip) L.push(`They are travelling (${trip.label || "trip"} until ${trip.end_date}) — short hotel sessions apply.`);
    if (isEased(new Date(), profile?.eased_until)) L.push(`Their plan is currently eased until ${profile.eased_until} (reason: ${profile.eased_reason || "unspecified"}). Do not pile on.`);
  }

  /* ---- what they've actually done ---- */
  const done = (logs || []).filter((l) => l.done);
  L.push("\n=== WHAT THEY'VE ACTUALLY DONE ===");
  L.push(`Sessions logged: ${done.length}`);
  if (done.length) {
    L.push(`Most recent: ${done.slice(0, 6).map((l) => l.log_date).join(", ")}`);
    const withLoads = done.filter((l) => l.payload?.w && Object.keys(l.payload.w).length);
    if (withLoads.length) {
      L.push("Recent loads logged:");
      withLoads.slice(0, 4).forEach((l) => {
        const w = Object.entries(l.payload.w).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(", ");
        if (w) L.push(`  ${l.log_date}: ${w}`);
      });
    }
    const notes = done.filter((l) => l.payload?.notes).slice(0, 4);
    if (notes.length) { L.push("Recent session notes:"); notes.forEach((l) => L.push(`  ${l.log_date}: ${l.payload.notes}`)); }
  }
  const activity = [...done.map((l) => l.log_date), ...(food || []).map((f) => f.log_date)];
  const lapse = detectLapse(activity);
  if (lapse.shouldAsk) L.push(`NOTE: nothing logged for ${lapse.gapDays} days. Ask why gently if it's relevant; don't lead with it unless they raise it.`);

  /* ---- measurements ---- */
  const ck = (checkins || []).filter((c) => Object.values(c.metrics || {}).some((v) => v));
  if (ck.length) {
    L.push("\n=== MEASUREMENTS ===");
    ck.slice(-6).forEach((c) => {
      const m = c.metrics || {};
      const bits = ["weight", "waist", "neck", "sleep_hrs", "rhr", "steps"]
        .filter((k) => m[k]).map((k) => `${k} ${m[k]}`).join(", ");
      L.push(`  ${c.week === 0 ? "baseline" : `week ${c.week}`}: ${bits}${c.feel ? ` — "${c.feel}"` : ""}`);
    });
    const latest = ck[ck.length - 1];
    const comp = bodyCompFor(latest.metrics, profile);
    if (comp.bodyFatPct !== null) {
      L.push(`Estimated body fat: ${comp.bodyFatPct}% (${comp.source}), lean mass ${comp.leanMassLb} lb.`);
      const proj = projectToTarget({
        currentWeightLb: parseFloat(latest.metrics?.weight ?? "") || null,
        currentBfPct: comp.bodyFatPct,
        targetBfPct: profile?.target_body_fat ?? null,
        targetDate: profile?.target_date,
      });
      if (proj.ok && proj.verdict) L.push(`Target projection: ${proj.verdict}`);
    }
  }

  /* ---- nutrition ---- */
  const t = plan?.nutrition?.targets;
  if (t) L.push(`\n=== NUTRITION TARGETS ===\n${t.kcal} kcal, ${t.protein_g} g protein, ${t.fiber_g} g fibre per day.`);
  if (food?.length) {
    L.push("Recently logged food:");
    food.slice(0, 10).forEach((f) => L.push(`  ${f.log_date} ${f.meal}: ${f.descr}${f.macros?.kcal ? ` (${f.macros.kcal} kcal)` : ""}`));
  }

  L.push("\n" + evidenceBlock(evidenceFor(profile?.conditions || [], profile?.goal_type)));

  L.push(`\nEnd every substantive health recommendation with the understanding that this is general wellbeing guidance, not medical advice — but don't repeat a disclaimer in every message; once per conversation is enough unless the topic is clinical.`);

  return { system: L.join("\n"), profile };
}

function restDowOf(profile: any) {
  return typeof profile?.rest_dow === "number" ? profile.rest_dow : 0;
}
