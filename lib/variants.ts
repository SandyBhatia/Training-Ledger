/* Exercise variants.

   Swapping mid-session has to be possible — a squat rack is busy, a shoulder
   is cranky, the hotel has dumbbells only. Refusing to bend is how a plan
   gets abandoned rather than adjusted.

   Variants are grouped by movement pattern so a swap keeps the training
   effect of the day intact. */

export type Variant = { name: string; kit: "gym" | "dumbbell" | "bodyweight" | "machine" | "cable" };

const PATTERNS: Record<string, { match: string[]; variants: Variant[] }> = {
  squat: {
    match: ["squat", "leg press", "hack", "lunge", "step up", "step-up", "split squat", "goblet"],
    variants: [
      { name: "Back Squat", kit: "gym" },
      { name: "Front Squat", kit: "gym" },
      { name: "Hack Squat", kit: "machine" },
      { name: "Leg Press", kit: "machine" },
      { name: "DB Goblet Squat", kit: "dumbbell" },
      { name: "DB Bulgarian Split Squat", kit: "dumbbell" },
      { name: "Walking Lunge", kit: "dumbbell" },
      { name: "Bodyweight Squat", kit: "bodyweight" },
    ],
  },
  hinge: {
    match: ["deadlift", "romanian", "rdl", "hinge", "good morning", "hip thrust", "glute bridge", "back extension"],
    variants: [
      { name: "Trap-Bar Deadlift", kit: "gym" },
      { name: "Romanian Deadlift", kit: "gym" },
      { name: "DB Romanian Deadlift", kit: "dumbbell" },
      { name: "Hip Thrust", kit: "gym" },
      { name: "Cable Pull-Through", kit: "cable" },
      { name: "Back Extension", kit: "machine" },
      { name: "Single-Leg RDL", kit: "dumbbell" },
      { name: "Glute Bridge", kit: "bodyweight" },
    ],
  },
  horizontal_push: {
    match: ["bench", "chest press", "push-up", "push up", "pushup", "chest fly", "pec deck", "dip"],
    variants: [
      { name: "Barbell Bench Press", kit: "gym" },
      { name: "DB Bench Press", kit: "dumbbell" },
      { name: "Incline DB Press", kit: "dumbbell" },
      { name: "Machine Chest Press", kit: "machine" },
      { name: "Cable Chest Press", kit: "cable" },
      { name: "Push-ups", kit: "bodyweight" },
      { name: "Incline Push-ups", kit: "bodyweight" },
      { name: "Assisted Dips", kit: "machine" },
    ],
  },
  vertical_push: {
    match: ["overhead press", "shoulder press", "military", "pike push", "lateral raise", "arnold"],
    variants: [
      { name: "Seated Overhead Press", kit: "gym" },
      { name: "Seated DB Shoulder Press", kit: "dumbbell" },
      { name: "Machine Shoulder Press", kit: "machine" },
      { name: "Arnold Press", kit: "dumbbell" },
      { name: "DB Lateral Raise", kit: "dumbbell" },
      { name: "Cable Lateral Raise", kit: "cable" },
      { name: "Pike Push-ups", kit: "bodyweight" },
    ],
  },
  horizontal_pull: {
    match: ["row", "chest-supported", "seated cable row", "face pull", "inverted"],
    variants: [
      { name: "Chest-Supported Row", kit: "gym" },
      { name: "Seated Cable Row", kit: "cable" },
      { name: "DB Bent-Over Row", kit: "dumbbell" },
      { name: "Single-Arm DB Row", kit: "dumbbell" },
      { name: "Machine Row", kit: "machine" },
      { name: "Inverted Row", kit: "bodyweight" },
      { name: "Cable Face Pull", kit: "cable" },
    ],
  },
  vertical_pull: {
    match: ["pull-up", "pull up", "pullup", "chin-up", "lat pulldown", "pulldown", "pullover"],
    variants: [
      { name: "Pull-ups", kit: "bodyweight" },
      { name: "Assisted Pull-ups", kit: "machine" },
      { name: "Lat Pulldown", kit: "machine" },
      { name: "Neutral-Grip Pulldown", kit: "machine" },
      { name: "Chin-ups", kit: "bodyweight" },
      { name: "DB Pullover", kit: "dumbbell" },
      { name: "Band-Assisted Pull-ups", kit: "bodyweight" },
    ],
  },
  hamstring: {
    match: ["leg curl", "hamstring curl", "nordic"],
    variants: [
      { name: "Seated Leg Curl", kit: "machine" },
      { name: "Lying Leg Curl", kit: "machine" },
      { name: "DB Leg Curl", kit: "dumbbell" },
      { name: "Slider Leg Curl", kit: "bodyweight" },
      { name: "Nordic Curl (assisted)", kit: "bodyweight" },
      { name: "Single-Leg RDL", kit: "dumbbell" },
    ],
  },
  calf: {
    match: ["calf"],
    variants: [
      { name: "Standing Calf Raise", kit: "machine" },
      { name: "Seated Calf Raise", kit: "machine" },
      { name: "DB Standing Calf Raise", kit: "dumbbell" },
      { name: "Single-Leg Calf Raise", kit: "bodyweight" },
      { name: "Leg Press Calf Raise", kit: "machine" },
    ],
  },
  biceps: {
    match: ["curl", "biceps", "bicep"],
    variants: [
      { name: "DB Biceps Curl", kit: "dumbbell" },
      { name: "Cable Curl", kit: "cable" },
      { name: "Hammer Curl", kit: "dumbbell" },
      { name: "Incline DB Curl", kit: "dumbbell" },
      { name: "Preacher Curl", kit: "machine" },
      { name: "Band Curl", kit: "bodyweight" },
    ],
  },
  triceps: {
    match: ["triceps", "tricep", "pushdown", "skull", "overhead extension", "kickback"],
    variants: [
      { name: "Cable Triceps Pushdown", kit: "cable" },
      { name: "Rope Pushdown", kit: "cable" },
      { name: "DB Overhead Triceps Extension", kit: "dumbbell" },
      { name: "Skull Crushers", kit: "gym" },
      { name: "Close-Grip Push-ups", kit: "bodyweight" },
      { name: "Bench Dips", kit: "bodyweight" },
    ],
  },
  core: {
    match: ["plank", "crunch", "leg raise", "dead bug", "pallof", "ab wheel", "hanging knee", "bicycle", "side plank", "mountain climber"],
    variants: [
      { name: "Hanging Leg Raise", kit: "gym" },
      { name: "Cable Crunch", kit: "cable" },
      { name: "Plank", kit: "bodyweight" },
      { name: "Side Plank", kit: "bodyweight" },
      { name: "Dead Bug", kit: "bodyweight" },
      { name: "Pallof Press", kit: "cable" },
      { name: "Ab Wheel Rollout", kit: "bodyweight" },
      { name: "Bicycle Crunch", kit: "bodyweight" },
    ],
  },
};

/** Which movement pattern does this exercise belong to? */
export function patternOf(name: string): string | null {
  const n = (name || "").toLowerCase();
  let best: string | null = null, bestLen = 0;
  for (const [key, def] of Object.entries(PATTERNS)) {
    for (const m of def.match) {
      if (n.includes(m) && m.length > bestLen) { best = key; bestLen = m.length; }
    }
  }
  return best;
}

/** Alternatives that train the same thing, current exercise excluded. */
export function variantsFor(name: string, limit = 6): Variant[] {
  const pattern = patternOf(name);
  if (!pattern) return [];
  const n = (name || "").toLowerCase();
  return PATTERNS[pattern].variants
    .filter((v) => !n.includes(v.name.toLowerCase()) && !v.name.toLowerCase().includes(n))
    .slice(0, limit);
}

export const KIT_LABEL: Record<Variant["kit"], string> = {
  gym: "barbell", dumbbell: "dumbbell", bodyweight: "bodyweight", machine: "machine", cable: "cable",
};
