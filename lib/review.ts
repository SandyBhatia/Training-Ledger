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
};

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

  const empty: Review = {
    ready: false, fromWeek: 0, toWeek: 0, waistChange: null, weightChange: null,
    adherencePct, verdict: "", headline: "", actions: [], tone: "steady",
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

  // Adherence dominates: no point changing the plan if it isn't being followed.
  if (adherencePct !== null && adherencePct < 70) {
    tone = "adjust";
    headline = "Consistency first — don't change the plan yet";
    verdict = `You've completed about ${adherencePct}% of scheduled sessions over this block. Before adjusting calories or training, the most valuable change is getting sessions in. A plan followed 60% of the time will always look like it isn't working.`;
    actions.push("Aim for 80%+ session completion over the next two weeks before changing anything else.");
    actions.push("If the schedule is unrealistic, reduce days per week rather than repeatedly missing.");
    actions.push("Use the skip-and-shift option instead of abandoning a week.");
    return { ready: true, fromWeek: earlier.week, toWeek: latest.week, waistChange, weightChange, adherencePct, verdict, headline, actions, tone };
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
      } else if (waistChange <= 0.1) {
        tone = "adjust";
        headline = "Stalled — time for one small change";
        verdict = `Your waist hasn't moved over ${weeks} weeks. That's long enough to call it a plateau rather than noise, so one adjustment is warranted.`;
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

  actions.push("Take your photos in the same spot, same light, same time of day — that's what makes them comparable.");

  return { ready: true, fromWeek: earlier.week, toWeek: latest.week, waistChange, weightChange, adherencePct, verdict, headline, actions, tone };
}
