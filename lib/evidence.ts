/* ============================================================
   EVIDENCE CORPUS

   Curated guidance from named, authoritative sources, so the app's
   recommendations rest on citable guidelines rather than model recall.

   Each entry carries a confidence tier, because the alternative — presenting
   settled science and marketing claims in the same voice — is the failure
   this corpus exists to prevent.

     settled    strong guideline or well-replicated trial evidence
     probable   reasonable support, less certain or less replicated
     weak       commonly marketed, thin evidence; say so plainly

   Relevant entries are injected into the prompt at generation time and made
   available to the coach conversation, so guidance is grounded and cited.
   Reviewed against 2026 editions. Guidelines change — re-verify annually.
   ============================================================ */

export type Tier = "settled" | "probable" | "weak";

export type Evidence = {
  id: string;
  topics: string[];          // condition ids from lib/conditions.ts, plus general tags
  tier: Tier;
  claim: string;             // what to act on
  detail?: string;           // the number or mechanism worth knowing
  source: string;            // who says so
};

export const EVIDENCE: Evidence[] = [
  /* ---------------- glucose, insulin resistance, prediabetes ---------------- */
  {
    id: "ada-weight-target",
    topics: ["prediabetes", "type2_diabetes", "obesity", "fat_loss"],
    tier: "settled",
    claim: "Aim for 5–7% of starting body weight. This is the single most effective lifestyle lever for preventing progression from prediabetes to type 2 diabetes.",
    detail: "The 2026 Standards raised this target; 7–10% is achievable with dietitian support. Weight-loss supplements are explicitly not recommended.",
    source: "ADA Standards of Care in Diabetes — 2026, §3 and §8",
  },
  {
    id: "ada-activity-minimum",
    topics: ["prediabetes", "type2_diabetes", "general"],
    tier: "settled",
    claim: "At least 150 minutes a week of moderate activity, such as brisk walking.",
    detail: "For maintaining weight loss long term the target rises to 200–300 min/week.",
    source: "ADA Standards of Care in Diabetes — 2026, §3 and §8",
  },
  {
    id: "muscle-glucose-disposal",
    topics: ["prediabetes", "type2_diabetes", "insulin_resistance", "general"],
    tier: "settled",
    claim: "Resistance training is a primary metabolic intervention, not just a physique one. Skeletal muscle is where roughly 80% of glucose disposal happens.",
    detail: "Resistance training has been shown to improve insulin sensitivity by around 48% by clamp measurement; a meta-analysis of more than 8,500 people with type 2 diabetes found HbA1c reductions of about 0.57%.",
    source: "J Clin Endocrinol Metab (2025), 'Tailoring Exercise Prescription for Effective Diabetes Glucose Management'",
  },
  {
    id: "acsm-ada-resistance-dose",
    topics: ["prediabetes", "type2_diabetes", "general"],
    tier: "settled",
    claim: "Resistance training on at least 2–3 non-consecutive days a week.",
    detail: "Begin at moderate intensity (10–15 reps per set) and add weight only once the target reps can be completed without reaching failure. Move to 6–8 reps once technique is secure.",
    source: "ACSM and ADA joint position statement; ACSM consensus on exercise in type 2 diabetes",
  },
  {
    id: "exercise-insulin-window",
    topics: ["prediabetes", "type2_diabetes", "insulin_resistance"],
    tier: "settled",
    claim: "Spread activity across the week rather than concentrating it — the insulin-sensitivity benefit of a single session fades within days.",
    detail: "Improvements in insulin sensitivity after activity last roughly 2–72 hours, which is why no more than two consecutive days should pass without movement.",
    source: "ACSM Consensus Statement, Exercise/Physical Activity in Individuals with Type 2 Diabetes",
  },
  {
    id: "postmeal-walking",
    topics: ["prediabetes", "type2_diabetes", "insulin_resistance", "general"],
    tier: "settled",
    claim: "Walk after your largest meals. This blunts the post-meal glucose peak substantially and is the highest-return habit for the effort involved.",
    detail: "30 minutes of brisk post-meal walking significantly reduced glucose peaks across meals of differing carbohydrate content; shorter bouts of 10–15 minutes also help. Post-meal spikes predict cardiometabolic risk better than fasting glucose.",
    source: "Nutrients (2022), 'The Effects of Postprandial Walking on the Glucose Response after Meals with Different Characteristics'",
  },
  {
    id: "ada-eating-pattern",
    topics: ["prediabetes", "type2_diabetes", "general"],
    tier: "settled",
    claim: "Build meals around non-starchy vegetables, whole fruit, legumes, lean protein, whole grains, nuts and seeds. Mediterranean-style and lower-carbohydrate patterns both have evidence for preventing type 2 diabetes.",
    detail: "No single macronutrient split is required — adherence matters more than the pattern chosen.",
    source: "ADA Standards of Care in Diabetes — 2026, §5",
  },
  {
    id: "protein-during-deficit",
    topics: ["prediabetes", "obesity", "fat_loss", "general"],
    tier: "settled",
    claim: "When losing weight deliberately, protect protein intake. Losing muscle alongside fat worsens the metabolic picture you are trying to improve.",
    detail: "The 2026 Standards specifically flag preventing protein insufficiency and micronutrient deficiency during intentional weight loss.",
    source: "ADA Standards of Care in Diabetes — 2026, §8",
  },

  /* ---------------- lipids ---------------- */
  {
    id: "soluble-fibre-ldl",
    topics: ["high_cholesterol", "general"],
    tier: "settled",
    claim: "Soluble viscous fibre lowers LDL. Oats, barley, psyllium, legumes, apples and citrus are the practical sources.",
    detail: "Beta-glucan, psyllium and pectin bind bile acids, forcing the liver to draw on circulating cholesterol to replace them.",
    source: "Established mechanism; consistent across dietary fibre trials",
  },
  {
    id: "fibre-diversity-cardiometabolic",
    topics: ["high_cholesterol", "prediabetes", "gut", "general"],
    tier: "probable",
    claim: "Variety of fibre sources matters, not just total grams.",
    detail: "In adults at cardiometabolic risk, increasing fibre diversity in a daily bread lowered total cholesterol by 0.42 mmol/L and LDL by 0.36 mmol/L, and improved insulin and HOMA, versus a control bread.",
    source: "Gut Microbes (2022), 'Increasing the diversity of dietary fibers in a daily-consumed bread'",
  },
  {
    id: "sat-unsat-shift",
    topics: ["high_cholesterol", "heart_disease", "general"],
    tier: "settled",
    claim: "Replace saturated fat with unsaturated rather than simply eating less fat — nuts, seeds, olive oil, avocado and oily fish in place of butter, ghee, cream and fried food.",
    source: "AHA/ACC cholesterol management guidance; Dietary Guidelines for Americans",
  },

  /* ---------------- menopause ---------------- */
  {
    id: "menopause-resistance",
    topics: ["menopause", "osteoporosis"],
    tier: "settled",
    claim: "Resistance training becomes more important through and after menopause, not less. Falling oestrogen is associated with loss of muscle mass and function and may accelerate sarcopenia.",
    detail: "Training in postmenopausal women improves strength, body composition, fitness and function; higher weekly training volume appears particularly useful for maintaining muscle.",
    source: "ACSM resistance training position stand (2026 update); reviews of resistance training in postmenopausal women",
  },
  {
    id: "menopause-undereating",
    topics: ["menopause"],
    tier: "settled",
    claim: "Do not respond to menopausal body-composition change by eating steadily less. Under-eating costs muscle and bone at exactly the point both are already under pressure.",
    detail: "Protein, calcium and vitamin D intake all warrant attention; vitamin D status is worth checking with a clinician.",
    source: "Menopause Society guidance; ACSM resistance training position stand",
  },
  {
    id: "menopause-glucose",
    topics: ["menopause", "prediabetes", "insulin_resistance"],
    tier: "probable",
    claim: "The menopause transition itself shifts body composition and insulin sensitivity, so a rising A1c at this stage is not simply a diet failure.",
    detail: "This means the standard 'just lose weight' advice fits poorly for women already at a healthy weight — the lever is muscle and activity more than restriction.",
    source: "ACSM resistance training position stand (2026 update), menopause section",
  },

  /* ---------------- hypertension ---------------- */
  {
    id: "bp-valsalva",
    topics: ["hypertension", "heart_disease"],
    tier: "settled",
    claim: "Exhale through the hard part of every repetition. Breath-holding under load (the Valsalva manoeuvre) produces sharp blood-pressure spikes.",
    detail: "Prefer seated and supported pressing, avoid maximal grinding sets, and skip resistance training entirely if resting blood pressure is 180/110 or higher.",
    source: "ACSM guidelines for exercise testing and prescription, special populations",
  },
  {
    id: "bp-aerobic",
    topics: ["hypertension"],
    tier: "settled",
    claim: "Regular aerobic training lowers blood pressure independently of weight loss.",
    source: "ACSM and AHA physical activity guidance",
  },

  /* ---------------- gut health ---------------- */
  {
    id: "fermented-foods",
    topics: ["gut", "general"],
    tier: "probable",
    claim: "Fermented foods — yoghurt, kefir, kimchi, idli, dosa batter, kanji — are the better-supported route to microbiome diversity, ahead of supplements.",
    detail: "In a randomised trial, a high-fermented-food diet consistently increased microbiota diversity and reduced 19 inflammatory markers over ten weeks. A high-fibre diet alone did not increase diversity, though it did enhance carbohydrate-metabolising capacity.",
    source: "Cell (2021) Wastyk et al., replicated in later citizen-science RCT",
  },
  {
    id: "probiotic-supplements",
    topics: ["gut"],
    tier: "weak",
    claim: "Most specific probiotic supplement claims are not well supported. Food-based fermented sources are the better default.",
    detail: "Effects are strain-specific and rarely generalise; the supplement market runs well ahead of the evidence.",
    source: "Consensus position; see fermented-food trial data above for what is actually supported",
  },
  {
    id: "gut-detox",
    topics: ["gut"],
    tier: "weak",
    claim: "Gut cleanses, detoxes and 'metabolism boosters' have no credible evidence. Do not recommend them.",
    source: "No supporting guideline; ADA explicitly advises against supplements for weight loss",
  },

  /* ---------------- training generally ---------------- */
  {
    id: "acsm-hypertrophy-range",
    topics: ["general", "muscle"],
    tier: "settled",
    claim: "Muscle can be built across a wide range of loads provided effort is sufficient; total weekly volume matters more than hitting one 'magic' rep range.",
    detail: "This matters practically: dumbbells, bands, machines or bodyweight can all deliver a genuine stimulus when a barbell is unavailable.",
    source: "ACSM resistance training position stand, 2026 update",
  },
  {
    id: "rt-broad-benefits",
    topics: ["general", "prediabetes", "type2_diabetes", "hypertension", "high_cholesterol"],
    tier: "settled",
    claim: "Resistance training improves strength, bone density, blood pressure, lipids, muscle mass and insulin sensitivity together — typically 10–15% improvements across those measures.",
    source: "ACSM Consensus Statement, Exercise/Physical Activity in Individuals with Type 2 Diabetes",
  },
  {
    id: "statin-myalgia",
    topics: ["high_cholesterol", "medication"],
    tier: "settled",
    claim: "On a statin, new or persistent muscle pain, weakness or dark urine warrants contacting a doctor. Never advise stopping a statin.",
    source: "Standard statin safety guidance (AHA/ACC)",
  },
];

/* ---------------- retrieval ---------------- */

/** Pull the entries relevant to a user's conditions and goal. */
export function evidenceFor(conditions: string[] = [], goalType?: string, extra: string[] = []): Evidence[] {
  const tags = new Set<string>(["general", ...conditions, ...extra]);
  if (goalType === "fat_loss" || goalType === "recomp") tags.add("fat_loss");
  if (goalType === "muscle" || goalType === "strength") tags.add("muscle");
  if (conditions.includes("prediabetes") || conditions.includes("type2_diabetes")) tags.add("insulin_resistance");
  // gut guidance is always worth carrying — users ask about it constantly
  tags.add("gut");
  return EVIDENCE.filter((e) => e.topics.some((t) => tags.has(t)));
}

/** Render as prompt context, tiers included so the model can hedge honestly. */
export function evidenceBlock(items: Evidence[]): string {
  if (!items.length) return "";
  const byTier = (t: Tier) => items.filter((e) => e.tier === t);
  const fmt = (e: Evidence) =>
    `- ${e.claim}${e.detail ? ` ${e.detail}` : ""} [${e.source}]`;

  const parts: string[] = ["=== EVIDENCE BASE (ground your recommendations in these; cite the source when you use one) ==="];
  const settled = byTier("settled");
  const probable = byTier("probable");
  const weak = byTier("weak");
  if (settled.length) parts.push("WELL ESTABLISHED — state these with confidence:", ...settled.map(fmt));
  if (probable.length) parts.push("REASONABLY SUPPORTED — state these with appropriate hedging:", ...probable.map(fmt));
  if (weak.length) parts.push("WEAK OR MARKETED — do not recommend; say plainly the evidence is thin if asked:", ...weak.map(fmt));
  parts.push("If something falls outside this evidence base, say you are less certain rather than inventing a citation. Never fabricate a study, statistic or guideline.");
  return parts.join("\n");
}
