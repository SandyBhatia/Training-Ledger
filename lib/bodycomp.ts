/* Body composition.

   Two sources, in priority order:
   1. A measured reading from a gym scale (BIA) or DEXA, if the user logs one.
   2. The US Navy tape estimate (Hodgdon & Beckett, 1984) from waist, neck
      and height — always available, needs only a tape measure.

   Both are estimates. Navy runs ±3–4% against DEXA and is most accurate in
   the 15–30% band for men; BIA scales can be out by considerably more and
   swing with hydration. So everything here is framed as a trend, never as a
   precise truth, and the app says so. */

export type BodyComp = {
  bodyFatPct: number | null;
  leanMassLb: number | null;
  fatMassLb: number | null;
  source: "measured" | "navy" | null;
  note: string | null;
};

const log10 = (n: number) => Math.log(n) / Math.LN10;
const CM_PER_IN = 2.54;

/** US Navy tape formula. Waist and neck in inches, height in inches. */
export function navyBodyFat(opts: {
  sex?: string; waistIn?: number | null; neckIn?: number | null;
  hipIn?: number | null; heightIn?: number | null;
}): number | null {
  const { sex, waistIn, neckIn, hipIn, heightIn } = opts;
  if (!waistIn || !neckIn || !heightIn) return null;
  const female = (sex || "").toLowerCase() === "female";

  if (female) {
    if (!hipIn) return null;
    const inner = waistIn + hipIn - neckIn;
    if (inner <= 0) return null;
    const bf = 163.205 * log10(inner) - 97.684 * log10(heightIn) - 78.387;
    return clamp(bf);
  }
  const inner = waistIn - neckIn;
  if (inner <= 0) return null;
  const bf = 86.010 * log10(inner) - 70.041 * log10(heightIn) + 36.76;
  return clamp(bf);
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.max(3, Math.min(60, +n.toFixed(1))) : null) as number | null;

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

/** Resolve body composition for one check-in, preferring a measured reading. */
export function bodyCompFor(
  metrics: Record<string, string> | undefined,
  profile: { sex?: string; height_cm?: number } | undefined
): BodyComp {
  const empty: BodyComp = { bodyFatPct: null, leanMassLb: null, fatMassLb: null, source: null, note: null };
  if (!metrics) return empty;

  const weight = num(metrics.weight);
  const measured = num(metrics.bf_measured);
  const heightIn = profile?.height_cm ? profile.height_cm / CM_PER_IN : null;

  let bf: number | null = null;
  let source: BodyComp["source"] = null;
  let note: string | null = null;

  if (measured !== null) {
    bf = measured;
    source = "measured";
    note = "From your logged scale or scan reading.";
  } else {
    bf = navyBodyFat({
      sex: profile?.sex,
      waistIn: num(metrics.waist),
      neckIn: num(metrics.neck),
      hipIn: num(metrics.hips),
      heightIn,
    });
    if (bf !== null) { source = "navy"; note = "Estimated from your waist, neck and height (Navy tape method, ±3–4%)."; }
  }

  if (bf === null) return { ...empty, note: "Add your neck measurement to estimate body fat from your waist." };

  const fatMassLb = weight !== null ? +(weight * (bf / 100)).toFixed(1) : null;
  const leanMassLb = weight !== null && fatMassLb !== null ? +(weight - fatMassLb).toFixed(1) : null;
  return { bodyFatPct: bf, leanMassLb, fatMassLb, source, note };
}

/* ---------------- target projection ---------------- */

export type Projection = {
  ok: boolean;
  targetWeightLb: number | null;
  toLoseLb: number | null;
  weeksMin: number | null;
  weeksMax: number | null;
  etaText: string | null;
  verdict: string;
  realistic: boolean;
};

/** What does a target body fat % actually mean in pounds and weeks?
    Assumes lean mass is held — which is the whole point of the programme. */
export function projectToTarget(opts: {
  currentWeightLb: number | null;
  currentBfPct: number | null;
  targetBfPct: number | null;
  targetDate?: string | null;
}): Projection {
  const { currentWeightLb, currentBfPct, targetBfPct, targetDate } = opts;
  const none: Projection = { ok: false, targetWeightLb: null, toLoseLb: null, weeksMin: null, weeksMax: null, etaText: null, verdict: "", realistic: true };
  if (!currentWeightLb || currentBfPct === null || !targetBfPct) return none;

  const lean = currentWeightLb * (1 - currentBfPct / 100);
  const targetWeightLb = +(lean / (1 - targetBfPct / 100)).toFixed(1);
  const toLoseLb = +(currentWeightLb - targetWeightLb).toFixed(1);

  if (toLoseLb <= 0) {
    return { ...none, ok: true, targetWeightLb, toLoseLb,
      verdict: `You're already at or below ${targetBfPct}% by this estimate. The useful goal from here is building muscle, not losing more.`,
      realistic: true };
  }

  // Muscle-sparing rate: 0.5–1 lb per week.
  const weeksMax = Math.ceil(toLoseLb / 0.5);
  const weeksMin = Math.ceil(toLoseLb / 1.0);

  const eta = new Date();
  eta.setDate(eta.getDate() + weeksMin * 7);
  const etaLate = new Date();
  etaLate.setDate(etaLate.getDate() + weeksMax * 7);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const etaText = weeksMin === weeksMax ? fmt(eta) : `${fmt(eta)} to ${fmt(etaLate)}`;

  let verdict = `Reaching ${targetBfPct}% means losing roughly ${toLoseLb} lb of fat while holding your muscle — about ${weeksMin}–${weeksMax} weeks at a rate that spares muscle. Realistically ${etaText}.`;
  let realistic = true;

  if (targetDate) {
    const wanted = Math.round((new Date(targetDate).getTime() - Date.now()) / (7 * 86400000));
    if (wanted > 0 && wanted < weeksMin) {
      realistic = false;
      verdict = `Reaching ${targetBfPct}% means losing about ${toLoseLb} lb of fat. At a rate that protects muscle that takes ${weeksMin}–${weeksMax} weeks, but your target date is ${wanted} week${wanted === 1 ? "" : "s"} away. Going faster mostly costs muscle, so treat the date as a checkpoint rather than a deadline — ${etaText} is the honest arrival.`;
    }
  }
  if (targetBfPct < 10) {
    realistic = false;
    verdict += " Below 10% is competition-stage lean; it's hard to reach and harder to hold, and rarely worth the trade-offs outside a contest.";
  }

  return { ok: true, targetWeightLb, toLoseLb, weeksMin, weeksMax, etaText, verdict, realistic };
}

/* ---------------- lean-mass alarm ----------------
   The real failure mode of a cut: losing weight that isn't fat. */

export function leanMassCheck(prev: BodyComp, now: BodyComp): string | null {
  if (prev.leanMassLb === null || now.leanMassLb === null) return null;
  const d = +(now.leanMassLb - prev.leanMassLb).toFixed(1);
  // Lean mass swings with hydration and glycogen, so only speak beyond 2 lb.
  if (d <= -2) {
    return `Your lean mass is down ${Math.abs(d)} lb. Some of that is water, but a sustained drop means the deficit is too steep or protein is too low — ease the calories slightly and hit your protein target before anything else.`;
  }
  if (d >= 2) {
    return `Lean mass is up ${d} lb — a good sign the training is building muscle, not just burning calories.`;
  }
  return null;
}

/** Reference bands for men and women, for context rather than judgement. */
export function bfBand(bf: number, sex?: string): string {
  const female = (sex || "").toLowerCase() === "female";
  const bands = female
    ? [[14, "essential"], [21, "athletic"], [25, "fitness"], [32, "average"], [100, "above average"]]
    : [[6, "essential"], [14, "athletic"], [18, "fitness"], [25, "average"], [100, "above average"]];
  for (const [ceiling, label] of bands) if (bf < (ceiling as number)) return label as string;
  return "above average";
}
