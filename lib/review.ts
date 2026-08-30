/* Bi-weekly review.
   Recommendations come from measured numbers — waist, weight, adherence —
   never from photographs. Two-week windows so measurement noise averages out. */

export type Checkin = { week: number; metrics: Record<string, string>; feel?: string };

export type Review = {
  ready: boolean;
  reason?: string;
  fromWeek: number;
  toWeek: number;
  waistChange: number | null;
  weightChange: number | null;
  adherencePct: number | null;
  verdict: string;
  headline: string;
  actions: string[];
  tone: "good" | "steady" | "adjust";
  /** Recurring themes found in the user's own check-in notes. */
  noteFlags: { theme: string; weeks: number[]; message: string }[];
  /** True when the honest answer is "nothing needs changing". */
  doNothing: boolean;
};

/* Measurement noise floors. Below these, a change is indistinguishable from
   tape placement, time of day, hydration and food in the gut. Calling such a
   change "progress" (or "a stall") is how apps manufacture false patterns. */
export const NOISE = { waistIn: 0.3, weightLb: 1.5, sleepHrs: 0.4, rhrBpm: 3, steps: 800 };

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

/** Compare the latest check-in against one roughly two weeks earlier. */
export function buildReview(
  checkins: Checkin[],
  goalType: string | undefined,
  adherencePct: number | null
): Review {
  const withData = checkins
    .filter((c) => num(c.metrics?.waist) !== null || num(c.metrics?.weight) !== null)
    .sort((a, b) => a.week - b.week);

  const noteFlags = scanNotes(checkins);
  const empty: Review = {
    ready: false, fromWeek: 0, toWeek: 0, waistChange: null, weightChange: null,
    adherencePct, verdict: "", headline: "", actions: [], tone: "steady",
    noteFlags, doNothing: false,
  };

  if (withData.length < 2) {
    return { ...empty, reason: "Log at least two check-ins — a baseline and one about two weeks later — and your first review will appear here." };
  }

  const latest = withData[withData.length - 1];
  // nearest earlier check-in at least 2 weeks back, else the earliest we have
  const earlier =
    [...withData].reverse().find((c) => latest.week - c.week >= 2) ?? withData[0];

  if (earlier.week === latest.week) {
    return { ...empty, reason: "Your check-ins are less than two weeks apart. Log another in a week or two for a meaningful comparison." };
  }

  const waistA = num(earlier.metrics?.waist), waistB = num(latest.metrics?.waist);
  const wtA = num(earlier.metrics?.weight), wtB = num(latest.metrics?.weight);
  const waistChange = waistA !== null && waistB !== null ? +(waistB - waistA).toFixed(1) : null;
  const weightChange = wtA !== null && wtB !== null ? +(wtB - wtA).toFixed(1) : null;
  const weeks = latest.week - earlier.week;

  const fatLoss = ["fat_loss", "recomp"].includes(goalType || "recomp");
  const actions: string[] = [];
  let headline = "", verdict = "", tone: Review["tone"] = "steady";
  let doNothing = false;

  // Adherence dominates: no point changing the plan if it isn't being followed.
  if (adherencePct !== null && adherencePct < 70) {
    tone = "adjust";
    headline = "Consistency first — don't change the plan yet";
    verdict = `You've completed about ${adherencePct}% of scheduled sessions over this block. Before adjusting calories or training, the most valuable change is getting sessions in. A plan followed 60% of the time will always look like it isn't working.`;
    actions.push("Aim for 80%+ session completion over the next two weeks before changing anything else.");
    actions.push("If the schedule is unrealistic, reduce days per week rather than repeatedly missing.");
    actions.push("Use the skip-and-shift option instead of abandoning a week.");
    return { ready: true, fromWeek: earlier.week, toWeek: latest.week, waistChange, weightChange, adherencePct, verdict, headline, actions, tone, noteFlags, doNothing: false };
  }

  // Noise gate: below the measurement floor, say so plainly rather than
  // inventing a trend or declaring a plateau off a tenth of an inch.
  const waistNoise = waistChange !== null && Math.abs(waistChange) < NOISE.waistIn;
  const weightNoise = weightChange !== null && Math.abs(weightChange) < NOISE.weightLb;
  if (waistNoise && (weightChange === null || weightNoise) && (adherencePct === null || adherencePct >= 70)) {
    doNothing = true;
    tone = "steady";
    headline = "Too small to call — keep going";
    verdict = `Your waist moved ${Math.abs(waistChange!)} in over ${weeks} weeks. That's within normal measurement variation — tape placement, time of day, hydration and food in the gut all move it that much. This isn't progress or a plateau; it's noise. The honest answer is that nothing needs changing yet.`;
    actions.push("Change nothing this fortnight. You're still inside the window where the plan needs time to show a result.");
    actions.push("Keep measuring the same way each time: same spot, first thing, before food, relaxed.");
    actions.push("If it's still flat at the next review, that's when a single adjustment is warranted.");
    actions.push("Take your photos in the same spot, same light, same time of day — that's what makes them comparable.");
    return { ready: true, fromWeek: earlier.week, toWeek: latest.week, waistChange, weightChange, adherencePct, verdict, headline, actions, tone, noteFlags, doNothing };
  }

  if (fatLoss) {
    if (waistChange !== null) {
      const perWeek = waistChange / weeks;
      if (waistChange <= -0.4) {
        tone = "good";
        headline = "Fat loss is on track";
        verdict = `Your waist is down ${Math.abs(waistChange)} in over ${weeks} weeks. That's a real trend, not noise. Whatever you're doing with food and training is working — the correct action is to change nothing.`;
        actions.push("Hold your current calories and training. Don't accelerate — this pace protects muscle.");
        actions.push("Keep protein at target; it's what keeps the loss coming from fat.");
      } else if (waistChange < -0.1) {
        tone = "steady";
        headline = "Slow but genuine progress";
        verdict = `Waist down ${Math.abs(waistChange)} in over ${weeks} weeks (${Math.abs(perWeek).toFixed(2)} in/week). That's slower than ideal but it is moving in the right direction.`;
        actions.push("Give it another two weeks before changing anything — this pace compounds.");
        actions.push("Tighten the things that slip first: added sugar, restaurant meals, and post-meal walks.");
      } else if (waistChange <= NOISE.waistIn) {
        tone = "adjust";
        headline = "Stalled — time for one small change";
        verdict = `Your waist hasn't moved meaningfully over ${weeks} weeks. That's long enough to call it a plateau rather than measurement noise, so one adjustment is warranted.`;
        actions.push("Change ONE thing only: either reduce daily calories by about 150, or add two 20-minute Zone 2 sessions per week.");
        actions.push("Check your food logging is honest for a week — under-logging is the usual culprit, especially oils and restaurant portions.");
        actions.push("Keep protein and training load unchanged so you don't lose muscle.");
      } else {
        tone = "adjust";
        headline = "Waist is up — worth a look";
        verdict = `Waist up ${waistChange} in over ${weeks} weeks. Before assuming fat gain, note that measurement technique, time of day, and a high-sodium or high-carb day all shift this.`;
        actions.push("Re-measure at the same spot, same morning routine, before food, for two consecutive days.");
        actions.push("If it holds, reduce daily calories by about 200 and keep protein where it is.");
        actions.push("Review sodium and alcohol — both drive short-term changes that look like fat.");
      }
    } else {
      headline = "Log your waist measurement";
      verdict = "Waist is the most useful single number for this goal — more than the scale, especially while you're building muscle. Add it at each check-in.";
      actions.push("Measure at the navel, relaxed, before breakfast.");
    }

    // Weight cross-check
    if (weightChange !== null && waistChange !== null) {
      if (weightChange >= 0 && waistChange <= -0.3) {
        actions.push("Weight is steady while your waist drops — that's recomposition. Ignore the scale; you're gaining muscle as you lose fat.");
      } else if (weightChange <= -2 * weeks / 2) {
        actions.push(`You're down ${Math.abs(weightChange)} lb in ${weeks} weeks, which is fast. Consider easing the deficit slightly to protect muscle.`);
      }
    }
  } else {
    // muscle / strength / general health
    if (weightChange !== null && weightChange > 0) {
      tone = "good";
      headline = "Gaining as intended";
      verdict = `Up ${weightChange} lb over ${weeks} weeks. Keep training progressively and hold protein high so the gain is mostly muscle.`;
      actions.push("Keep adding load or reps on the main lifts each week.");
      actions.push("Watch your waist — if it climbs faster than your lifts, trim calories slightly.");
    } else {
      tone = "adjust";
      headline = "Not much movement";
      verdict = `Weight is flat over ${weeks} weeks. For muscle gain that usually means calories are too low.`;
      actions.push("Add about 150–200 calories a day, mostly around training.");
      actions.push("Make sure the main lifts are actually progressing week to week.");
    }
  }

  actions.push(...recoveryNotes(earlier, latest, weeks));
  actions.push("Take your photos in the same spot, same light, same time of day — that's what makes them comparable.");

  return { ready: true, fromWeek: earlier.week, toWeek: latest.week, waistChange, weightChange, adherencePct, verdict, headline, actions, tone, noteFlags, doNothing: false };
}


/* ---------------------------------------------------------------
   Read the user's own words back.
   Notes are the richest signal in the app and were previously
   written and never looked at again. A theme that recurs across
   two or more check-ins is worth surfacing — a one-off is not. */

const NOTE_THEMES: { theme: string; terms: string[]; message: string }[] = [
  { theme: "Sleep", terms: ["sleep", "slept", "insomnia", "tired", "exhausted", "restless", "awake"],
    message: "Sleep has come up more than once. It limits both muscle gain and fat loss more than most people expect — and if it has run for months, it's worth raising with your doctor rather than training through." },
  { theme: "Joint or pain", terms: ["knee", "shoulder", "back pain", "elbow", "hip pain", "pain", "sore joint", "tweak", "twinge", "ache"],
    message: "You've mentioned discomfort in more than one check-in. Recurring pain is a signal to change the movement, not to push through it. If it persists or sharpens, get it looked at." },
  { theme: "Energy", terms: ["low energy", "no energy", "drained", "flat", "fatigue", "sluggish", "burnt out", "burned out"],
    message: "Low energy has recurred. Common causes are under-eating, poor sleep, or too much volume — check those before adding more training." },
  { theme: "Travel", terms: ["travel", "travelling", "traveling", "hotel", "trip", "on the road", "flight"],
    message: "Travel keeps disrupting the plan. Rather than losing those weeks, use the skip-and-shift option and the hotel variants — a reduced week beats an abandoned one." },
  { theme: "Motivation", terms: ["unmotivated", "motivation", "struggling", "hard to start", "skipped", "couldn't be bothered", "gave up", "lazy"],
    message: "Motivation has come up repeatedly. Motivation is weather — the fix is lowering the bar to starting, not trying harder. Shrink the commitment until it's too small to skip." },
  { theme: "Diet slipping", terms: ["ate out", "eating out", "overate", "binge", "snack", "sugar", "cheat", "takeaway", "restaurant"],
    message: "Food slipping has shown up more than once. Rather than willpower, remove the decision: pre-plan the meal, or don't keep the trigger food in the house." },
  { theme: "Stress", terms: ["stress", "stressed", "anxious", "anxiety", "overwhelmed", "work pressure"],
    message: "Stress has recurred in your notes. It affects sleep, appetite and recovery together — worth treating as a training variable, not a separate problem." },
];

export function scanNotes(checkins: Checkin[]) {
  const out: { theme: string; weeks: number[]; message: string }[] = [];
  const recent = [...checkins].sort((a, b) => b.week - a.week).slice(0, 6);

  for (const t of NOTE_THEMES) {
    const weeks = recent
      .filter((c) => {
        const feel = (c.feel || "").toLowerCase();
        return feel && t.terms.some((term) => feel.includes(term));
      })
      .map((c) => c.week)
      .sort((a, b) => a - b);
    // two or more mentions = a pattern worth naming; one is just a bad week
    if (weeks.length >= 2) out.push({ theme: t.theme, weeks, message: t.message });
  }
  return out;
}


/* Sleep, resting heart rate and steps — read as raw signals, with the same
   noise discipline applied to the body measurements. Only speak when the
   change clears the floor or the absolute value is worth naming. */
function recoveryNotes(earlier: Checkin, latest: Checkin, weeks: number): string[] {
  const out: string[] = [];
  const g = (c: Checkin, k: string) => {
    const n = parseFloat(String(c.metrics?.[k] ?? ""));
    return Number.isFinite(n) ? n : null;
  };

  const sleepNow = g(latest, "sleep_hrs"), sleepThen = g(earlier, "sleep_hrs");
  if (sleepNow !== null) {
    if (sleepNow < 6.5) {
      out.push(`You're averaging ${sleepNow} hrs of sleep. That's the single biggest limiter on both fat loss and muscle gain — worth more than any change to your training or calories right now.`);
    } else if (sleepThen !== null && sleepNow - sleepThen >= NOISE.sleepHrs) {
      out.push(`Sleep is up ${(sleepNow - sleepThen).toFixed(1)} hrs a night since ${earlier.week === 0 ? "baseline" : `week ${earlier.week}`} — expect better sessions and easier appetite control.`);
    } else if (sleepThen !== null && sleepThen - sleepNow >= NOISE.sleepHrs) {
      out.push(`Sleep is down ${(sleepThen - sleepNow).toFixed(1)} hrs a night. If training has felt harder, this is the likeliest reason — protect it before adding volume.`);
    }
  }

  const rhrNow = g(latest, "rhr"), rhrThen = g(earlier, "rhr");
  if (rhrNow !== null && rhrThen !== null) {
    const d = rhrNow - rhrThen;
    if (d <= -NOISE.rhrBpm) {
      out.push(`Resting heart rate is down ${Math.abs(d)} bpm over ${weeks} weeks — a good sign your conditioning is improving.`);
    } else if (d >= NOISE.rhrBpm) {
      out.push(`Resting heart rate is up ${d} bpm. A few beats can be illness, poor sleep, alcohol or stress; if it stays elevated for a couple of weeks alongside fatigue, ease off and mention it to your doctor.`);
    }
  }

  const stepsNow = g(latest, "steps");
  if (stepsNow !== null && stepsNow < 6000) {
    out.push(`Daily steps are averaging ${Math.round(stepsNow)}. Outside your sessions you're fairly sedentary — walking after meals is the cheapest lever you have on both waistline and blood sugar.`);
  }
  return out;
}
