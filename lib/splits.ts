/* Split styles and the exercise library.

   Different people want different structures, and imposing one is how a plan
   stops feeling like theirs. Four options, plus a custom builder where the
   user picks the muscle groups for each day and the generator fills in the
   exercises — which they can then swap individually. */

export type SplitStyle = "auto" | "upper_lower" | "ppl" | "full_body" | "custom";

export const SPLIT_STYLES: { id: SplitStyle; label: string; blurb: string; bestFor: string }[] = [
  { id: "auto", label: "Let the plan decide", blurb: "Built around your days, equipment and goal.", bestFor: "Most people" },
  { id: "upper_lower", label: "Upper / Lower", blurb: "Alternating upper-body and lower-body days.", bestFor: "4–6 days a week" },
  { id: "ppl", label: "Push / Pull / Legs", blurb: "Pressing, pulling, and legs on separate days.", bestFor: "5–6 days a week" },
  { id: "full_body", label: "Full body", blurb: "Every session hits everything.", bestFor: "2–4 days a week, or travel-heavy" },
  { id: "custom", label: "Custom — I'll choose", blurb: "Pick the muscle groups for each day yourself.", bestFor: "You know what you want" },
];

export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "quads" | "hamstrings" | "glutes" | "calves" | "core" | "cardio" | "mobility";

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string; region: "upper" | "lower" | "other" }[] = [
  { id: "chest", label: "Chest", region: "upper" },
  { id: "back", label: "Back", region: "upper" },
  { id: "shoulders", label: "Shoulders", region: "upper" },
  { id: "biceps", label: "Biceps", region: "upper" },
  { id: "triceps", label: "Triceps", region: "upper" },
  { id: "forearms", label: "Forearms & grip", region: "upper" },
  { id: "quads", label: "Quads", region: "lower" },
  { id: "hamstrings", label: "Hamstrings", region: "lower" },
  { id: "glutes", label: "Glutes", region: "lower" },
  { id: "calves", label: "Calves", region: "lower" },
  { id: "core", label: "Core", region: "other" },
  { id: "cardio", label: "Conditioning", region: "other" },
  { id: "mobility", label: "Mobility", region: "other" },
];

export type LibExercise = {
  name: string;
  groups: MuscleGroup[];
  kit: "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "band";
  compound?: boolean;
};

/* A browsable library so "custom" means something concrete. Exercise names
   and their primary muscles — no fabricated numbers here, just movements. */
export const EXERCISE_LIBRARY: LibExercise[] = [
  // chest
  { name: "Barbell Bench Press", groups: ["chest", "triceps"], kit: "barbell", compound: true },
  { name: "Incline Barbell Press", groups: ["chest", "shoulders"], kit: "barbell", compound: true },
  { name: "DB Bench Press", groups: ["chest", "triceps"], kit: "dumbbell", compound: true },
  { name: "Incline DB Press", groups: ["chest", "shoulders"], kit: "dumbbell", compound: true },
  { name: "Machine Chest Press", groups: ["chest"], kit: "machine", compound: true },
  { name: "Cable Fly", groups: ["chest"], kit: "cable" },
  { name: "Pec Deck", groups: ["chest"], kit: "machine" },
  { name: "Push-ups", groups: ["chest", "triceps", "core"], kit: "bodyweight", compound: true },
  { name: "Dips", groups: ["chest", "triceps"], kit: "bodyweight", compound: true },

  // back
  { name: "Pull-ups", groups: ["back", "biceps"], kit: "bodyweight", compound: true },
  { name: "Chin-ups", groups: ["back", "biceps"], kit: "bodyweight", compound: true },
  { name: "Lat Pulldown", groups: ["back", "biceps"], kit: "machine", compound: true },
  { name: "Barbell Row", groups: ["back", "biceps"], kit: "barbell", compound: true },
  { name: "Chest-Supported Row", groups: ["back"], kit: "machine", compound: true },
  { name: "Seated Cable Row", groups: ["back", "biceps"], kit: "cable", compound: true },
  { name: "Single-Arm DB Row", groups: ["back"], kit: "dumbbell", compound: true },
  { name: "Straight-Arm Pulldown", groups: ["back"], kit: "cable" },
  { name: "Face Pull", groups: ["back", "shoulders"], kit: "cable" },
  { name: "Inverted Row", groups: ["back", "biceps"], kit: "bodyweight", compound: true },

  // shoulders
  { name: "Seated Overhead Press", groups: ["shoulders", "triceps"], kit: "barbell", compound: true },
  { name: "Seated DB Shoulder Press", groups: ["shoulders", "triceps"], kit: "dumbbell", compound: true },
  { name: "Arnold Press", groups: ["shoulders"], kit: "dumbbell" },
  { name: "DB Lateral Raise", groups: ["shoulders"], kit: "dumbbell" },
  { name: "Cable Lateral Raise", groups: ["shoulders"], kit: "cable" },
  { name: "Rear Delt Fly", groups: ["shoulders", "back"], kit: "dumbbell" },
  { name: "Pike Push-ups", groups: ["shoulders", "triceps"], kit: "bodyweight" },
  { name: "Band Pull-Apart", groups: ["shoulders", "back"], kit: "band" },

  // arms
  { name: "DB Biceps Curl", groups: ["biceps"], kit: "dumbbell" },
  { name: "Hammer Curl", groups: ["biceps", "forearms"], kit: "dumbbell" },
  { name: "Cable Curl", groups: ["biceps"], kit: "cable" },
  { name: "Preacher Curl", groups: ["biceps"], kit: "machine" },
  { name: "Incline DB Curl", groups: ["biceps"], kit: "dumbbell" },
  { name: "Cable Triceps Pushdown", groups: ["triceps"], kit: "cable" },
  { name: "Rope Pushdown", groups: ["triceps"], kit: "cable" },
  { name: "DB Overhead Triceps Extension", groups: ["triceps"], kit: "dumbbell" },
  { name: "Skull Crushers", groups: ["triceps"], kit: "barbell" },
  { name: "Close-Grip Bench Press", groups: ["triceps", "chest"], kit: "barbell", compound: true },
  { name: "Bench Dips", groups: ["triceps"], kit: "bodyweight" },
  { name: "Farmer's Carry", groups: ["forearms", "core"], kit: "dumbbell" },
  { name: "Wrist Curl", groups: ["forearms"], kit: "dumbbell" },

  // quads
  { name: "Back Squat", groups: ["quads", "glutes"], kit: "barbell", compound: true },
  { name: "Front Squat", groups: ["quads"], kit: "barbell", compound: true },
  { name: "Hack Squat", groups: ["quads"], kit: "machine", compound: true },
  { name: "Leg Press", groups: ["quads", "glutes"], kit: "machine", compound: true },
  { name: "DB Goblet Squat", groups: ["quads", "glutes"], kit: "dumbbell", compound: true },
  { name: "Bulgarian Split Squat", groups: ["quads", "glutes"], kit: "dumbbell", compound: true },
  { name: "Walking Lunge", groups: ["quads", "glutes"], kit: "dumbbell", compound: true },
  { name: "Step-ups", groups: ["quads", "glutes"], kit: "dumbbell" },
  { name: "Leg Extension", groups: ["quads"], kit: "machine" },

  // hamstrings & glutes
  { name: "Trap-Bar Deadlift", groups: ["hamstrings", "glutes", "back"], kit: "barbell", compound: true },
  { name: "Romanian Deadlift", groups: ["hamstrings", "glutes"], kit: "barbell", compound: true },
  { name: "DB Romanian Deadlift", groups: ["hamstrings", "glutes"], kit: "dumbbell", compound: true },
  { name: "Seated Leg Curl", groups: ["hamstrings"], kit: "machine" },
  { name: "Lying Leg Curl", groups: ["hamstrings"], kit: "machine" },
  { name: "Nordic Curl", groups: ["hamstrings"], kit: "bodyweight" },
  { name: "Hip Thrust", groups: ["glutes"], kit: "barbell", compound: true },
  { name: "Glute Bridge", groups: ["glutes"], kit: "bodyweight" },
  { name: "Cable Pull-Through", groups: ["glutes", "hamstrings"], kit: "cable" },
  { name: "Back Extension", groups: ["hamstrings", "glutes", "back"], kit: "machine" },
  { name: "Banded Lateral Walk", groups: ["glutes"], kit: "band" },

  // calves
  { name: "Standing Calf Raise", groups: ["calves"], kit: "machine" },
  { name: "Seated Calf Raise", groups: ["calves"], kit: "machine" },
  { name: "DB Standing Calf Raise", groups: ["calves"], kit: "dumbbell" },
  { name: "Single-Leg Calf Raise", groups: ["calves"], kit: "bodyweight" },

  // core
  { name: "Hanging Leg Raise", groups: ["core"], kit: "bodyweight" },
  { name: "Cable Crunch", groups: ["core"], kit: "cable" },
  { name: "Plank", groups: ["core"], kit: "bodyweight" },
  { name: "Side Plank", groups: ["core"], kit: "bodyweight" },
  { name: "Dead Bug", groups: ["core"], kit: "bodyweight" },
  { name: "Pallof Press", groups: ["core"], kit: "cable" },
  { name: "Ab Wheel Rollout", groups: ["core"], kit: "bodyweight" },
  { name: "Bicycle Crunch", groups: ["core"], kit: "bodyweight" },
  { name: "Bird Dog", groups: ["core"], kit: "bodyweight" },

  // conditioning
  { name: "Incline Treadmill Walk", groups: ["cardio"], kit: "machine" },
  { name: "Rowing Machine", groups: ["cardio", "back"], kit: "machine" },
  { name: "Stationary Bike", groups: ["cardio"], kit: "machine" },
  { name: "Elliptical", groups: ["cardio"], kit: "machine" },
  { name: "Stair Climber", groups: ["cardio", "glutes"], kit: "machine" },
  { name: "Kettlebell Swing", groups: ["cardio", "glutes", "hamstrings"], kit: "dumbbell", compound: true },
];

export function exercisesFor(group: MuscleGroup): LibExercise[] {
  return EXERCISE_LIBRARY.filter((e) => e.groups[0] === group || e.groups.includes(group));
}

/** Sensible starting templates when someone picks "custom" and needs a nudge. */
export const CUSTOM_PRESETS: Record<number, MuscleGroup[][]> = {
  3: [["chest", "shoulders", "triceps"], ["back", "biceps"], ["quads", "hamstrings", "glutes", "core"]],
  4: [["chest", "triceps"], ["back", "biceps"], ["quads", "calves"], ["shoulders", "hamstrings", "core"]],
  5: [["chest", "triceps"], ["back", "biceps"], ["quads", "calves"], ["shoulders", "core"], ["hamstrings", "glutes", "cardio"]],
  6: [["chest", "triceps"], ["back", "biceps"], ["quads", "calves"], ["shoulders", "core"], ["hamstrings", "glutes"], ["cardio", "core", "mobility"]],
};

export function describeSplit(style: SplitStyle, days: number, custom?: MuscleGroup[][]): string {
  if (style === "custom" && custom?.length) {
    return custom.map((d, i) => `Day ${i + 1}: ${d.map((g) => MUSCLE_GROUPS.find((m) => m.id === g)?.label || g).join(", ")}`).join(" · ");
  }
  const s = SPLIT_STYLES.find((x) => x.id === style);
  return s ? `${s.label} across ${days} days` : `${days} days`;
}
