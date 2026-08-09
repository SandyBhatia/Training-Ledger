// Medical conditions offered in onboarding. Grouped so the list stays scannable.
// "other" free-text is always available — this list is a convenience, not a limit.

export type ConditionGroup = { group: string; items: { id: string; label: string }[] };

export const CONDITION_GROUPS: ConditionGroup[] = [
  {
    group: "Heart & circulation",
    items: [
      { id: "hypertension", label: "High blood pressure" },
      { id: "high_cholesterol", label: "High / borderline cholesterol" },
      { id: "heart_disease", label: "Heart disease" },
      { id: "arrhythmia", label: "Arrhythmia / irregular heartbeat" },
      { id: "low_bp", label: "Low blood pressure" },
      { id: "varicose", label: "Varicose veins / circulation issues" },
    ],
  },
  {
    group: "Metabolic & hormonal",
    items: [
      { id: "prediabetes", label: "Prediabetes / raised A1c" },
      { id: "type2_diabetes", label: "Type 2 diabetes" },
      { id: "type1_diabetes", label: "Type 1 diabetes" },
      { id: "hypothyroid", label: "Hypothyroidism" },
      { id: "hyperthyroid", label: "Hyperthyroidism" },
      { id: "pcos", label: "PCOS" },
      { id: "menopause", label: "Menopause / perimenopause" },
      { id: "obesity", label: "Obesity" },
      { id: "fatty_liver", label: "Fatty liver" },
    ],
  },
  {
    group: "Joints, bones & muscles",
    items: [
      { id: "arthritis", label: "Arthritis" },
      { id: "osteoporosis", label: "Osteoporosis / low bone density" },
      { id: "back_pain", label: "Chronic back pain" },
      { id: "knee_issues", label: "Knee problems" },
      { id: "shoulder_issues", label: "Shoulder problems" },
      { id: "hip_issues", label: "Hip problems" },
      { id: "joint_replacement", label: "Joint replacement" },
      { id: "hernia", label: "Hernia" },
    ],
  },
  {
    group: "Respiratory",
    items: [
      { id: "asthma", label: "Asthma" },
      { id: "copd", label: "COPD" },
      { id: "sleep_apnea", label: "Sleep apnea" },
    ],
  },
  {
    group: "Digestive & other",
    items: [
      { id: "ibs", label: "IBS" },
      { id: "acid_reflux", label: "Acid reflux / GERD" },
      { id: "celiac", label: "Celiac disease" },
      { id: "lactose", label: "Lactose intolerance" },
      { id: "kidney", label: "Kidney disease" },
      { id: "anemia", label: "Anemia" },
      { id: "migraine", label: "Migraines" },
      { id: "thyroid_nodules", label: "Thyroid nodules" },
    ],
  },
];

export const ALL_CONDITIONS = CONDITION_GROUPS.flatMap((g) => g.items);
export const conditionLabel = (id: string) =>
  ALL_CONDITIONS.find((c) => c.id === id)?.label ?? id;

export const GOAL_TYPES = [
  { id: "fat_loss", label: "Lose fat / lean out" },
  { id: "muscle", label: "Build muscle" },
  { id: "recomp", label: "Body recomposition (both)" },
  { id: "strength", label: "Get stronger" },
  { id: "endurance", label: "Build endurance" },
  { id: "health", label: "General health & markers" },
  { id: "mobility", label: "Mobility & pain-free movement" },
];

export const EXERCISE_PREFS = [
  { id: "weights", label: "Weight training" },
  { id: "machines", label: "Machines" },
  { id: "cardio_steady", label: "Steady cardio (Zone 2)" },
  { id: "intervals", label: "Intervals / HIIT" },
  { id: "walking", label: "Walking" },
  { id: "running", label: "Running" },
  { id: "cycling", label: "Cycling" },
  { id: "swimming", label: "Swimming" },
  { id: "yoga", label: "Yoga / stretching" },
  { id: "pilates", label: "Pilates / core" },
  { id: "sports", label: "Sports" },
  { id: "bodyweight", label: "Bodyweight training" },
];

export const EQUIPMENT = [
  { id: "full_gym", label: "Full gym" },
  { id: "home_db", label: "Home dumbbells / bands" },
  { id: "bodyweight", label: "Bodyweight only" },
  { id: "mixed_travel", label: "Mixed — travel often (gym + hotel)" },
];

export const DIET_STYLES = [
  { id: "veg", label: "Vegetarian" },
  { id: "veg_egg", label: "Vegetarian + eggs" },
  { id: "vegan", label: "Vegan" },
  { id: "nonveg", label: "Non-vegetarian" },
  { id: "pescatarian", label: "Pescatarian" },
];
