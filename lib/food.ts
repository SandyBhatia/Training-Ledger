import type { Macros } from "./types";

export type NutTarget = { kcal: number; p: number; c: number; f: number; fiber: number; sugar: number; sodium: number; satfat: number };
export const DEFAULT_TARGET: NutTarget = { kcal: 2000, p: 130, c: 200, f: 60, fiber: 30, sugar: 35, sodium: 2000, satfat: 20 };

/* ---- Local food database: instant, consistent, offline. AI is the fallback. ----
   Values are per the stated serving and are reasonable reference estimates. */
export const FOOD_DB = [
  // --- Indian breads & grains ---
  { n: "chapati", a: ["roti", "phulka"], s: "1 medium", kcal: 104, p: 3, c: 20, f: 2, fiber: 3, sugar: 0, sodium: 120, satfat: 0 },
  { n: "paratha", a: ["prantha", "plain paratha"], s: "1 medium", kcal: 210, p: 5, c: 27, f: 9, fiber: 3, sugar: 1, sodium: 300, satfat: 4 },
  { n: "missi roti", a: [], s: "1 medium", kcal: 145, p: 6, c: 22, f: 4, fiber: 4, sugar: 1, sodium: 260, satfat: 1 },
  { n: "naan", a: ["butter naan"], s: "1 piece", kcal: 290, p: 8, c: 45, f: 9, fiber: 2, sugar: 3, sodium: 480, satfat: 4 },
  { n: "white rice", a: ["chawal", "steamed rice", "rice"], s: "1 cup cooked", kcal: 205, p: 4, c: 45, f: 0, fiber: 1, sugar: 0, sodium: 2, satfat: 0 },
  { n: "brown rice", a: [], s: "1 cup cooked", kcal: 216, p: 5, c: 45, f: 2, fiber: 4, sugar: 0, sodium: 10, satfat: 0 },
  { n: "idli", a: [], s: "2 pieces", kcal: 116, p: 4, c: 24, f: 1, fiber: 2, sugar: 0, sodium: 260, satfat: 0 },
  { n: "plain dosa", a: ["dosa", "masala dosa", "mysore dosa"], s: "1 medium", kcal: 168, p: 4, c: 29, f: 4, fiber: 2, sugar: 1, sodium: 300, satfat: 1 },
  { n: "millet dosa", a: ["ragi dosa"], s: "1 medium", kcal: 150, p: 5, c: 26, f: 3, fiber: 4, sugar: 0, sodium: 280, satfat: 0 },
  { n: "poha", a: [], s: "1 cup", kcal: 250, p: 5, c: 45, f: 6, fiber: 3, sugar: 2, sodium: 400, satfat: 1 },
  { n: "upma", a: [], s: "1 cup", kcal: 250, p: 6, c: 40, f: 8, fiber: 3, sugar: 2, sodium: 450, satfat: 2 },
  { n: "steel-cut oats", a: ["oats", "oatmeal"], s: "1 cup cooked", kcal: 166, p: 6, c: 28, f: 4, fiber: 4, sugar: 1, sodium: 5, satfat: 1 },
  { n: "sourdough bread", a: ["sourdough", "bread slice"], s: "1 slice", kcal: 120, p: 4, c: 23, f: 1, fiber: 1, sugar: 1, sodium: 240, satfat: 0 },
  { n: "whole wheat bread", a: ["multigrain bread"], s: "1 slice", kcal: 82, p: 4, c: 14, f: 1, fiber: 2, sugar: 1, sodium: 145, satfat: 0 },
  { n: "quinoa", a: [], s: "1 cup cooked", kcal: 222, p: 8, c: 39, f: 4, fiber: 5, sugar: 2, sodium: 13, satfat: 0 },
  { n: "pasta", a: ["spaghetti", "penne"], s: "1 cup cooked", kcal: 220, p: 8, c: 43, f: 1, fiber: 3, sugar: 1, sodium: 5, satfat: 0 },

  // --- Dals, legumes, curries ---
  { n: "dal", a: ["daal", "moong dal", "masoor dal", "toor dal", "mixed dal", "dal tadka"], s: "1 katori (150g)", kcal: 150, p: 9, c: 20, f: 4, fiber: 6, sugar: 2, sodium: 400, satfat: 1 },
  { n: "dal makhani", a: ["dal bukhara"], s: "1 katori", kcal: 330, p: 11, c: 25, f: 20, fiber: 7, sugar: 3, sodium: 700, satfat: 10 },
  { n: "rajma", a: ["kidney beans"], s: "1 katori", kcal: 210, p: 12, c: 30, f: 4, fiber: 9, sugar: 3, sodium: 450, satfat: 1 },
  { n: "chole", a: ["chana masala", "chickpea curry", "chana"], s: "1 katori", kcal: 240, p: 11, c: 33, f: 7, fiber: 9, sugar: 4, sodium: 520, satfat: 1 },
  { n: "kadhi", a: [], s: "1 katori", kcal: 190, p: 7, c: 16, f: 11, fiber: 2, sugar: 4, sodium: 500, satfat: 4 },
  { n: "sambar", a: [], s: "1 katori", kcal: 140, p: 7, c: 19, f: 4, fiber: 5, sugar: 3, sodium: 480, satfat: 1 },
  { n: "sprouts", a: ["moong sprouts", "sprout salad"], s: "1 cup", kcal: 90, p: 8, c: 14, f: 1, fiber: 5, sugar: 3, sodium: 15, satfat: 0 },
  { n: "roasted chana", a: ["chana murmura", "bhuna chana"], s: "30 g", kcal: 110, p: 6, c: 18, f: 2, fiber: 5, sugar: 1, sodium: 80, satfat: 0 },
  { n: "soya chunks", a: ["soy chunks", "meal maker"], s: "50 g dry", kcal: 170, p: 26, c: 16, f: 1, fiber: 6, sugar: 2, sodium: 10, satfat: 0 },
  { n: "black beans", a: [], s: "1 cup", kcal: 227, p: 15, c: 41, f: 1, fiber: 15, sugar: 0, sodium: 2, satfat: 0 },
  { n: "lentil soup", a: [], s: "1 bowl", kcal: 180, p: 12, c: 28, f: 2, fiber: 9, sugar: 3, sodium: 500, satfat: 0 },
  { n: "hummus", a: [], s: "2 tbsp", kcal: 70, p: 2, c: 6, f: 5, fiber: 2, sugar: 0, sodium: 130, satfat: 1 },

  // --- Paneer / tofu / dairy / eggs ---
  { n: "paneer", a: ["cottage cheese cubes"], s: "70 g", kcal: 200, p: 13, c: 3, f: 15, fiber: 0, sugar: 2, sodium: 25, satfat: 9 },
  { n: "low fat paneer", a: [], s: "70 g", kcal: 130, p: 16, c: 3, f: 6, fiber: 0, sugar: 2, sodium: 25, satfat: 4 },
  { n: "paneer tikka", a: ["tandoori paneer", "grilled paneer"], s: "6 pieces", kcal: 270, p: 17, c: 8, f: 19, fiber: 1, sugar: 3, sodium: 480, satfat: 10 },
  { n: "palak paneer", a: ["dhaba paneer", "paneer butter masala", "shahi paneer"], s: "1 katori", kcal: 320, p: 14, c: 12, f: 24, fiber: 4, sugar: 4, sodium: 650, satfat: 12 },
  { n: "tofu", a: [], s: "100 g", kcal: 144, p: 17, c: 3, f: 9, fiber: 2, sugar: 1, sodium: 15, satfat: 1 },
  { n: "greek yogurt", a: ["plain greek yogurt"], s: "150 g", kcal: 100, p: 15, c: 6, f: 2, fiber: 0, sugar: 5, sodium: 55, satfat: 1 },
  { n: "curd", a: ["dahi", "yogurt"], s: "1 katori", kcal: 100, p: 6, c: 8, f: 5, fiber: 0, sugar: 7, sodium: 70, satfat: 3 },
  { n: "buttermilk", a: ["chaas", "lassi salted"], s: "1 glass", kcal: 60, p: 3, c: 6, f: 2, fiber: 0, sugar: 5, sodium: 250, satfat: 1 },
  { n: "milk", a: ["low fat milk", "whole milk"], s: "1 cup", kcal: 120, p: 8, c: 12, f: 5, fiber: 0, sugar: 12, sodium: 105, satfat: 3 },
  { n: "soy milk", a: ["fortified soy milk"], s: "1 cup", kcal: 100, p: 7, c: 8, f: 4, fiber: 1, sugar: 6, sodium: 90, satfat: 1 },
  { n: "milk tea", a: ["chai", "tea with milk"], s: "1 cup no sugar", kcal: 60, p: 3, c: 5, f: 3, fiber: 0, sugar: 5, sodium: 40, satfat: 2 },
  { n: "whole egg", a: ["egg", "boiled egg"], s: "1 large", kcal: 72, p: 6, c: 0, f: 5, fiber: 0, sugar: 0, sodium: 70, satfat: 2 },
  { n: "egg white", a: [], s: "1 large", kcal: 17, p: 4, c: 0, f: 0, fiber: 0, sugar: 0, sodium: 55, satfat: 0 },
  { n: "egg bhurji", a: ["scrambled eggs", "omelette"], s: "2 eggs", kcal: 220, p: 14, c: 3, f: 17, fiber: 1, sugar: 1, sodium: 320, satfat: 5 },
  { n: "cheese", a: ["cheddar", "cheese slice"], s: "1 slice / 20g", kcal: 80, p: 5, c: 1, f: 7, fiber: 0, sugar: 0, sodium: 180, satfat: 4 },
  { n: "whey protein", a: ["protein shake", "protein scoop"], s: "1 scoop", kcal: 120, p: 24, c: 3, f: 1, fiber: 0, sugar: 2, sodium: 60, satfat: 1 },

  // --- Chicken / fish / meat (for family members who eat it) ---
  { n: "grilled chicken breast", a: ["chicken breast", "chicken"], s: "100 g", kcal: 165, p: 31, c: 0, f: 4, fiber: 0, sugar: 0, sodium: 74, satfat: 1 },
  { n: "chicken curry", a: ["butter chicken"], s: "1 katori", kcal: 320, p: 22, c: 8, f: 22, fiber: 2, sugar: 4, sodium: 700, satfat: 8 },
  { n: "fish", a: ["salmon", "grilled fish"], s: "100 g", kcal: 208, p: 22, c: 0, f: 13, fiber: 0, sugar: 0, sodium: 60, satfat: 3 },
  { n: "eggs benedict", a: [], s: "1 serving", kcal: 450, p: 20, c: 25, f: 30, fiber: 1, sugar: 3, sodium: 900, satfat: 12 },

  // --- Vegetables & salads ---
  { n: "mixed sabzi", a: ["sabzi", "bhindi sabzi", "mixed vegetable"], s: "1 katori", kcal: 120, p: 3, c: 12, f: 7, fiber: 4, sugar: 4, sodium: 350, satfat: 1 },
  { n: "kachumber salad", a: ["salad", "green salad", "kachumber"], s: "1 bowl", kcal: 45, p: 2, c: 8, f: 0, fiber: 3, sugar: 4, sodium: 15, satfat: 0 },
  { n: "sauteed greens", a: ["palak", "spinach", "greens"], s: "1 cup", kcal: 60, p: 3, c: 6, f: 3, fiber: 3, sugar: 1, sodium: 200, satfat: 0 },
  { n: "avocado", a: [], s: "1/2 medium", kcal: 160, p: 2, c: 9, f: 15, fiber: 7, sugar: 1, sodium: 7, satfat: 2 },
  { n: "avocado toast", a: [], s: "1 slice", kcal: 280, p: 6, c: 32, f: 16, fiber: 8, sugar: 2, sodium: 250, satfat: 2 },
  { n: "vegetable soup", a: [], s: "1 bowl", kcal: 90, p: 3, c: 15, f: 2, fiber: 3, sugar: 5, sodium: 600, satfat: 0 },

  // --- Fruits & nuts ---
  { n: "apple", a: [], s: "1 medium", kcal: 95, p: 0, c: 25, f: 0, fiber: 4, sugar: 19, sodium: 2, satfat: 0 },
  { n: "banana", a: [], s: "1 medium", kcal: 105, p: 1, c: 27, f: 0, fiber: 3, sugar: 14, sodium: 1, satfat: 0 },
  { n: "papaya", a: [], s: "1 cup", kcal: 62, p: 1, c: 16, f: 0, fiber: 3, sugar: 11, sodium: 12, satfat: 0 },
  { n: "guava", a: [], s: "1 medium", kcal: 68, p: 3, c: 14, f: 1, fiber: 5, sugar: 9, sodium: 3, satfat: 0 },
  { n: "orange", a: [], s: "1 medium", kcal: 62, p: 1, c: 15, f: 0, fiber: 3, sugar: 12, sodium: 0, satfat: 0 },
  { n: "berries", a: ["blueberries", "strawberries"], s: "1 cup", kcal: 60, p: 1, c: 14, f: 0, fiber: 4, sugar: 9, sodium: 1, satfat: 0 },
  { n: "almonds", a: [], s: "10 pieces", kcal: 70, p: 3, c: 2, f: 6, fiber: 1, sugar: 0, sodium: 0, satfat: 0 },
  { n: "walnuts", a: [], s: "5 halves", kcal: 65, p: 1, c: 1, f: 6, fiber: 1, sugar: 0, sodium: 0, satfat: 1 },
  { n: "peanuts", a: [], s: "30 g", kcal: 170, p: 7, c: 6, f: 14, fiber: 3, sugar: 1, sodium: 5, satfat: 2 },
  { n: "makhana", a: ["fox nuts", "roasted makhana"], s: "30 g", kcal: 105, p: 3, c: 22, f: 0, fiber: 2, sugar: 0, sodium: 5, satfat: 0 },
  { n: "flaxseed", a: ["alsi", "ground flaxseed"], s: "1 tbsp", kcal: 55, p: 2, c: 3, f: 4, fiber: 3, sugar: 0, sodium: 3, satfat: 0 },

  // --- Snacks, sweets & the things that breach targets ---
  { n: "rusk", a: ["toast rusk"], s: "1 piece", kcal: 60, p: 1, c: 11, f: 1, fiber: 0, sugar: 3, sodium: 60, satfat: 1 },
  { n: "ajwain biscuit", a: ["biscuit", "cookie"], s: "2 pieces", kcal: 100, p: 1, c: 14, f: 4, fiber: 0, sugar: 4, sodium: 105, satfat: 2 },
  { n: "besan ladoo", a: ["ladoo", "laddu"], s: "1 piece", kcal: 185, p: 4, c: 22, f: 9, fiber: 1, sugar: 15, sodium: 15, satfat: 5 },
  { n: "gulab jamun", a: [], s: "1 piece", kcal: 150, p: 2, c: 22, f: 6, fiber: 0, sugar: 19, sodium: 40, satfat: 3 },
  { n: "jaggery", a: ["gur"], s: "1 tsp", kcal: 38, p: 0, c: 10, f: 0, fiber: 0, sugar: 10, sodium: 3, satfat: 0 },
  { n: "honey", a: [], s: "1 tsp", kcal: 21, p: 0, c: 6, f: 0, fiber: 0, sugar: 6, sodium: 0, satfat: 0 },
  { n: "sugar", a: ["white sugar"], s: "1 tsp", kcal: 16, p: 0, c: 4, f: 0, fiber: 0, sugar: 4, sodium: 0, satfat: 0 },
  { n: "samosa", a: [], s: "1 piece", kcal: 260, p: 4, c: 30, f: 14, fiber: 3, sugar: 2, sodium: 420, satfat: 5 },
  { n: "dahi bhalla", a: ["dahi vada", "chaat"], s: "1 plate", kcal: 300, p: 9, c: 40, f: 12, fiber: 3, sugar: 12, sodium: 750, satfat: 4 },
  { n: "pickle", a: ["achar"], s: "1 tbsp", kcal: 30, p: 0, c: 2, f: 2, fiber: 0, sugar: 1, sodium: 600, satfat: 0 },
  { n: "potato chips", a: ["crisps"], s: "30 g", kcal: 160, p: 2, c: 15, f: 10, fiber: 1, sugar: 0, sodium: 170, satfat: 3 },
  { n: "filter coffee with sugar", a: ["coffee with sugar"], s: "1 cup", kcal: 90, p: 3, c: 12, f: 3, fiber: 0, sugar: 10, sodium: 40, satfat: 2 },
  { n: "black coffee", a: ["coffee", "espresso"], s: "1 cup", kcal: 5, p: 0, c: 1, f: 0, fiber: 0, sugar: 0, sodium: 5, satfat: 0 },
  { n: "chamomile tea", a: ["herbal tea", "green tea"], s: "1 cup", kcal: 2, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, sodium: 2, satfat: 0 },
  { n: "pizza slice", a: ["pizza"], s: "1 slice", kcal: 285, p: 12, c: 36, f: 10, fiber: 2, sugar: 4, sodium: 640, satfat: 5 },
  { n: "burger", a: [], s: "1 regular", kcal: 350, p: 15, c: 35, f: 17, fiber: 2, sugar: 6, sodium: 500, satfat: 6 },
  { n: "french fries", a: ["fries"], s: "medium", kcal: 340, p: 4, c: 44, f: 17, fiber: 4, sugar: 0, sodium: 260, satfat: 3 },
  { n: "ghee", a: ["butter"], s: "1 tsp", kcal: 45, p: 0, c: 0, f: 5, fiber: 0, sugar: 0, sodium: 1, satfat: 3 },
  { n: "olive oil", a: ["cooking oil", "oil"], s: "1 tsp", kcal: 40, p: 0, c: 0, f: 5, fiber: 0, sugar: 0, sodium: 0, satfat: 1 },
];

/* quantity-aware local lookup: "2 chapati" -> 2x chapati */
export function lookupLocal(desc: string): Macros | null {
  const raw = String(desc).toLowerCase().trim();
  const qMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(?:x\s*)?/);
  const qty = qMatch ? parseFloat(qMatch[1]) : 1;
  const text = raw.replace(/^(\d+(?:\.\d+)?)\s*(?:x\s*)?/, "").trim();

  let best: any = null; let bestLen = 0;
  for (const f of FOOD_DB) {
    for (const term of [f.n, ...(f.a || [])]) {
      if (text.includes(term) && term.length > bestLen) { best = f; bestLen = term.length; }
    }
  }
  if (!best) return null;
  const mul = (v: number) => Math.round((v || 0) * qty);
  return {
    item: qty === 1 ? best.n : `${qty} × ${best.n}`,
    serving: qty === 1 ? best.s : `${qty} × ${best.s}`,
    kcal: mul(best.kcal), p: mul(best.p), c: mul(best.c), f: mul(best.f),
    fiber: mul(best.fiber), sugar: mul(best.sugar), sodium: mul(best.sodium), satfat: mul(best.satfat),
    src: "db",
  };
}

/* ---- swap engine: what breached, and what to eat instead ---- */
export const SWAP_RULES: Record<string, any> = {
  sugar: {
    label: "Added sugar over target",
    why: "Sugar spikes matter most for your A1c — this is the highest-value thing to trim.",
    offenders: ["besan ladoo", "gulab jamun", "jaggery", "honey", "sugar", "filter coffee with sugar", "rusk", "ajwain biscuit", "dahi bhalla"],
    swaps: [
      "Plain Greek yogurt with cinnamon instead of curd with jaggery",
      "Black coffee or unsweetened filter coffee instead of the sugared version",
      "A guava, apple, or berries instead of a ladoo or mithai",
      "Roasted chana or makhana instead of rusk and biscuits",
    ],
  },
  sodium: {
    label: "Sodium over target",
    why: "You're on a BP medication — salt load is worth watching closely.",
    offenders: ["pickle", "naan", "samosa", "dahi bhalla", "pizza slice", "chicken curry", "dal makhani", "vegetable soup", "potato chips"],
    swaps: [
      "Skip or halve the pickle — it's one of the densest sodium sources on the plate",
      "Home dal tadka instead of restaurant dal makhani or bukhara",
      "Roti or chapati instead of naan",
      "Fresh kachumber salad instead of packaged or fried snacks",
    ],
  },
  satfat: {
    label: "Saturated fat over target",
    why: "You're managing cholesterol — shifting saturated to unsaturated fat is the lever.",
    offenders: ["dal makhani", "palak paneer", "paneer", "ghee", "cheese", "samosa", "butter chicken", "chicken curry", "pizza slice", "burger"],
    swaps: [
      "Grilled or tandoori paneer instead of creamy makhani/bukhara gravies",
      "Low-fat paneer or tofu instead of full-fat paneer",
      "Olive oil instead of ghee or butter for cooking",
      "Nuts, seeds, or avocado for your fat instead of cheese and cream",
    ],
  },
  kcal: {
    label: "Calories over target",
    why: "You're in a deliberate deficit — a consistent overshoot slows the week-10 goal.",
    offenders: ["paratha", "naan", "samosa", "french fries", "pizza slice", "burger", "dal makhani", "potato chips"],
    swaps: [
      "One chapati instead of a paratha (saves ~100 kcal)",
      "Half the rice, double the salad and dal",
      "Grilled protein instead of fried or gravy dishes",
      "Fruit and nuts at tea instead of fried or bakery snacks",
    ],
  },
  protein_low: {
    label: "Protein under target",
    why: "Protein is what protects your muscle while you're cutting — the one target to hit daily.",
    swaps: [
      "Add a scoop of whey or soy protein in milk — the easiest 24 g",
      "Greek yogurt (15 g) instead of regular curd (6 g)",
      "Add soya chunks, tofu, or extra rajma/chana to your main meal",
      "Extra egg whites at breakfast — 4 g each, almost no fat",
    ],
  },
  fiber_low: {
    label: "Fiber under target",
    why: "Soluble fiber lowers LDL and blunts blood-sugar spikes — a double win for you.",
    swaps: [
      "Add a katori of rajma, chole, or dal — 6–9 g each",
      "A tablespoon of ground flaxseed into curd or oats",
      "Guava or apple with the skin instead of juice",
      "Big kachumber salad with every main meal",
    ],
  },
};

export const MEALS = [
  { id: "breakfast", label: "Breakfast", time: "8–9 am" },
  { id: "lunch", label: "Lunch", time: "12:30–1:30" },
  { id: "afternoon", label: "Afternoon snacks", time: "2–3 pm" },
  { id: "evening", label: "Evening snacks", time: "5–6 pm" },
  { id: "dinner", label: "Dinner", time: "7–8 pm" },
  { id: "other", label: "Other / night", time: "" },
];
export const mealOf = (e: any): string => (MEALS.some((m) => m.id === e.meal) ? e.meal : "other");

export function analyzeDay(tot: any, entries: any[], NUT_TARGET: NutTarget = DEFAULT_TARGET) {
  const flags: any[] = [];
  const ok = entries.filter((e: any) => e.status === "ok");
  const names = ok.map((e: any) => String(e.item || "").toLowerCase());
  // which meal contributed most of a given nutrient
  const worstMeal = (field: string) => {
    const by: Record<string, number> = {};
    ok.forEach((e: any) => { const m = mealOf(e); by[m] = (by[m] || 0) + (e[field] || 0); });
    const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
    if (!top || !top[1]) return null;
    const meal = MEALS.find((m) => m.id === top[0]);
    return meal ? { label: meal.label, amount: Math.round(top[1]) } : null;
  };
  const pushOver = (key: string, val: number, target: number, field: string) => {
    if (val > target) {
      const rule = SWAP_RULES[key];
      const hits = (rule.offenders || []).filter((o: string) => names.some((n: string) => n.includes(o)));
      flags.push({ key, ...rule, over: true, val, target, culprits: hits.slice(0, 4), worst: worstMeal(field) });
    }
  };
  pushOver("kcal", tot.kcal, NUT_TARGET.kcal, "kcal");
  pushOver("sugar", tot.sugar, NUT_TARGET.sugar, "sugar");
  pushOver("sodium", tot.sodium, NUT_TARGET.sodium, "sodium");
  pushOver("satfat", tot.satfat, NUT_TARGET.satfat, "satfat");
  // "under" flags only once the day has real food logged
  if (tot.kcal > 800) {
    if (tot.p < NUT_TARGET.p) flags.push({ key: "protein_low", ...SWAP_RULES.protein_low, over: false, val: tot.p, target: NUT_TARGET.p, culprits: [] });
    if (tot.fiber < NUT_TARGET.fiber) flags.push({ key: "fiber_low", ...SWAP_RULES.fiber_low, over: false, val: tot.fiber, target: NUT_TARGET.fiber, culprits: [] });
  }
  return flags;
}

