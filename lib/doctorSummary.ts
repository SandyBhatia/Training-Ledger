/* Doctor-visit preparation.
   Escalating to a clinician shouldn't be a dead end — the useful version
   hands the person an organised timeline instead of just "see your doctor".
   Everything here is assembled from data the user already entered; nothing
   is inferred or diagnosed. */

import { conditionLabel } from "./conditions";

type Checkin = { week: number; metrics: Record<string, string>; feel?: string; saved_at?: string };

export function buildDoctorSummary(opts: {
  profile: any;
  checkins: Checkin[];
  plan: any;
  adherencePct: number | null;
  sessionsDone: number;
}) {
  const { profile, checkins, plan, adherencePct, sessionsDone } = opts;
  const L: string[] = [];
  const age = profile?.birth_date
    ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / 3.15576e10)
    : null;

  L.push("SUMMARY FOR MY DOCTOR");
  L.push(`Prepared ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}`);
  L.push("");
  L.push("ABOUT ME");
  if (profile?.display_name) L.push(`Name: ${profile.display_name}`);
  if (age) L.push(`Age: ${age}`);
  if (profile?.sex) L.push(`Sex: ${profile.sex}`);
  if (profile?.height_cm) L.push(`Height: ${profile.height_cm} cm`);
  if (profile?.weight_kg) L.push(`Weight at start: ${profile.weight_kg} kg`);

  const conds = [
    ...(profile?.conditions || []).map((c: string) => conditionLabel(c)),
    ...(profile?.conditions_other ? [profile.conditions_other] : []),
  ];
  L.push("");
  L.push("CONDITIONS I'VE RECORDED");
  L.push(conds.length ? conds.map((c) => `- ${c}`).join("\n") : "- None recorded");

  L.push("");
  L.push("MEDICATIONS");
  L.push(profile?.medications ? `- ${profile.medications}` : "- None recorded");
  if (profile?.resting_bp) {
    L.push("");
    L.push(`RESTING BLOOD PRESSURE (self-recorded): ${profile.resting_bp}`);
  }

  // Measurement timeline
  const withData = [...checkins]
    .filter((c) => Object.values(c.metrics || {}).some((v) => v))
    .sort((a, b) => a.week - b.week);

  if (withData.length) {
    L.push("");
    L.push("MEASUREMENTS OVER TIME (self-measured at home)");
    const cols = ["weight", "waist", "sleep_hrs", "rhr"];
    L.push("Week      " + ["weight", "waist", "sleep", "rest HR"].map((c) => c.padEnd(10)).join(""));
    for (const c of withData) {
      const label = (c.week === 0 ? "Baseline" : `Week ${c.week}`).padEnd(10);
      L.push(label + cols.map((k) => String(c.metrics?.[k] ?? "—").padEnd(10)).join(""));
    }
    const first = withData[0], last = withData[withData.length - 1];
    const d = (k: string) => {
      const a = parseFloat(first.metrics?.[k] ?? ""), b = parseFloat(last.metrics?.[k] ?? "");
      return Number.isFinite(a) && Number.isFinite(b) ? +(b - a).toFixed(1) : null;
    };
    const dw = d("weight"), dwa = d("waist");
    if (dw !== null) L.push(`Change in weight: ${dw > 0 ? "+" : ""}${dw} lb`);
    if (dwa !== null) L.push(`Change in waist: ${dwa > 0 ? "+" : ""}${dwa} in`);
  }

  // What I've been doing
  L.push("");
  L.push("WHAT I'VE BEEN DOING");
  if (plan?.start_date) L.push(`- Structured training programme started ${plan.start_date}`);
  L.push(`- ${sessionsDone} sessions completed${adherencePct !== null ? ` (${adherencePct}% of those scheduled)` : ""}`);
  if (plan?.workout?.days_per_week) L.push(`- Training ${plan.workout.days_per_week} days per week`);
  const t = plan?.nutrition?.targets;
  if (t?.kcal) L.push(`- Following a nutrition plan of roughly ${t.kcal} kcal and ${t.protein_g} g protein per day`);

  // How I've been feeling — the user's own words, verbatim
  const notes = withData.filter((c) => (c.feel || "").trim());
  if (notes.length) {
    L.push("");
    L.push("HOW I'VE BEEN FEELING (my own notes)");
    for (const c of notes.slice(-6)) {
      L.push(`- ${c.week === 0 ? "Baseline" : `Week ${c.week}`}: ${c.feel!.trim()}`);
    }
  }

  L.push("");
  L.push("QUESTIONS I'D LIKE TO ASK");
  const qs: string[] = [];
  const has = (id: string) => (profile?.conditions || []).includes(id);
  const meds = (profile?.medications || "").toLowerCase();

  if (has("hypertension") || /statin|olmesartan|amlodipine|losartan|hctz|lisinopril/.test(meds))
    qs.push("Is my blood pressure well enough controlled for the training I'm doing?");
  if (/statin|rosuvastatin|atorvastatin|simvastatin/.test(meds))
    qs.push("I'm on a statin — is the muscle soreness I get after training normal, or should it be checked?");
  if (has("high_cholesterol")) qs.push("Should my lipid panel be rechecked to see whether the diet and training changes are working?");
  if (has("prediabetes") || has("type2_diabetes")) qs.push("Should my HbA1c be rechecked now, and what would you want it to be?");
  if (has("menopause")) qs.push("Should my vitamin D, calcium or bone density be assessed?");
  if (has("sleep_apnea") || notes.some((c) => /sleep|tired|exhaust/i.test(c.feel || "")))
    qs.push("My sleep has been poor for a while — is it worth investigating (including a sleep apnea screen)?");
  qs.push("Are there any limits I should observe with my current medications and this level of exercise?");
  qs.push("Is there anything in my history that should change how I train or eat?");
  L.push(qs.map((q) => `- ${q}`).join("\n"));

  L.push("");
  L.push("---");
  L.push("Prepared from data I recorded in a personal fitness app. Measurements are self-taken at home and are not clinical readings. This is not a medical record.");

  return L.join("\n");
}
