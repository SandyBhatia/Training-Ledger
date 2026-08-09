export type Profile = {
  id?: string;
  display_name?: string;
  sex?: string;
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  conditions?: string[];
  conditions_other?: string;
  resting_bp?: string;
  medications?: string;
  goals?: string;
  goal_type?: string;
  target_date?: string;
  experience?: string;
  days_per_week?: number;
  session_minutes?: number;
  exercise_prefs?: string[];
  equipment?: string;
  diet_style?: string;
  allergies?: string;
  rest_dow?: number;
  start_date?: string;
  units?: string;
  onboarded?: boolean;
};

export type Macros = {
  item: string; serving: string;
  kcal: number; p: number; c: number; f: number;
  fiber: number; sugar: number; sodium: number; satfat: number;
  src?: "db" | "ai";
};

export type Exercise = { name: string; alt?: string; sets_reps: string; rest: string; note?: string };
export type SplitDay = { title: string; focus?: string; warmup?: string; exercises: Exercise[]; finisher?: string; cooldown?: string; note?: string };
export type Phase = { week: number; name: string; rpe: string; note: string; deload?: boolean };

export type WorkoutPlan = { days_per_week: number; split: SplitDay[]; phases: Phase[] };
export type NutritionPlan = {
  targets: { kcal: number; protein_g: number; carbs_g?: number; fat_g?: number; fiber_g: number; sugar_g?: number; sodium_mg?: number; satfat_g?: number };
  principles: string[];
  day_options: { slot: string; options: string[] }[];
};
export type Micros = { nutrient: string; target: string; why: string; sources: string }[];
