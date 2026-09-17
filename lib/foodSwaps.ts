/* Item-level food swaps.

   The category engine says "sugar is over target, here are some ideas".
   This says "you logged potato chaat — sweet potato chaat is the better
   version of that same dish". Specific beats generic, and a like-for-like
   swap is far likelier to actually get made than a lecture about macros. */

export type FoodSwap = {
  match: string[];      // what they logged
  from: string;         // display name
  to: string;           // the better version
  why: string;          // one line, concrete
  tags: string[];       // sugar | sodium | satfat | refined | protein | fibre
};

export const FOOD_SWAPS: FoodSwap[] = [
  // --- refined carbs → complex ---
  { match: ["potato chaat", "aloo chaat", "aloo tikki"], from: "Potato chaat", to: "Sweet potato chaat",
    why: "Sweet potato is a slower-releasing carb with more fibre — gentler on blood sugar, same dish.", tags: ["refined", "fibre"] },
  { match: ["white rice", "steamed rice", "chawal"], from: "White rice", to: "Brown rice, quinoa, or half rice + half dal",
    why: "Three to four times the fibre and a flatter glucose curve.", tags: ["refined", "fibre"] },
  { match: ["paratha"], from: "Paratha", to: "Chapati, or a stuffed paratha cooked dry without ghee",
    why: "Saves roughly 100 kcal and most of the saturated fat.", tags: ["satfat", "kcal"] },
  { match: ["naan", "butter naan"], from: "Naan", to: "Roti or tandoori roti",
    why: "Less refined flour, far less added fat and salt.", tags: ["refined", "sodium", "satfat"] },
  { match: ["white bread", "bread slice"], from: "White bread", to: "Whole-grain or sourdough",
    why: "More fibre, slower absorption.", tags: ["refined", "fibre"] },
  { match: ["poha", "upma"], from: "Poha / upma", to: "The same with added peanuts, sprouts or paneer",
    why: "On its own it's mostly carbohydrate — adding protein blunts the spike and keeps you full.", tags: ["protein"] },
  { match: ["cornflakes", "cereal"], from: "Breakfast cereal", to: "Steel-cut oats or Greek yogurt with fruit",
    why: "Most boxed cereal is refined and sweetened; oats bring beta-glucan, which lowers LDL.", tags: ["refined", "sugar", "fibre"] },

  // --- sugar ---
  { match: ["jaggery", "gur"], from: "Jaggery", to: "Cinnamon, or a few berries",
    why: "Jaggery is still sugar — it behaves the same way in your blood.", tags: ["sugar"] },
  { match: ["besan ladoo", "ladoo", "laddu", "gulab jamun", "barfi", "halwa", "mithai"], from: "Indian sweets",
    to: "A date with nuts, or fruit with curd", why: "Satisfies the same craving with fibre and far less added sugar.", tags: ["sugar"] },
  { match: ["filter coffee with sugar", "coffee with sugar", "sweet tea", "sugar"], from: "Sweetened drink",
    to: "The same drink unsweetened, or with cinnamon", why: "Liquid sugar is the easiest to remove and the least missed.", tags: ["sugar"] },
  { match: ["fruit juice", "orange juice", "mango juice"], from: "Fruit juice", to: "Whole fruit",
    why: "Juice strips the fibre and delivers the sugar all at once.", tags: ["sugar", "fibre"] },
  { match: ["rusk", "ajwain biscuit", "biscuit", "cookie"], from: "Biscuits and rusk",
    to: "Roasted chana, makhana, or a handful of nuts", why: "Refined flour and sugar with no protein — the classic tea-time trap.", tags: ["refined", "sugar", "protein"] },
  { match: ["honey"], from: "Honey", to: "Skip it, or halve the amount",
    why: "Nutritionally close to sugar despite the health halo.", tags: ["sugar"] },

  // --- saturated fat / creamy dishes ---
  { match: ["dal makhani", "dal bukhara"], from: "Dal makhani", to: "Dal tadka or moong dal",
    why: "Same protein, without the cream and butter — a large saturated-fat saving.", tags: ["satfat"] },
  { match: ["palak paneer", "paneer butter masala", "shahi paneer", "dhaba paneer", "malai kofta"],
    from: "Creamy paneer curry", to: "Tandoori paneer or paneer tikka",
    why: "Grilled instead of cream-based keeps the protein and drops the saturated fat.", tags: ["satfat"] },
  { match: ["paneer"], from: "Full-fat paneer", to: "Low-fat paneer or tofu",
    why: "More protein per calorie and much less saturated fat — tofu also helps LDL.", tags: ["satfat", "protein"] },
  { match: ["butter chicken", "chicken curry"], from: "Creamy chicken curry", to: "Tandoori or grilled chicken",
    why: "Keeps the protein, loses the cream.", tags: ["satfat"] },
  { match: ["ghee", "butter"], from: "Ghee or butter", to: "Olive oil or mustard oil for cooking",
    why: "Swapping saturated for unsaturated fat is one of the better-evidenced lipid moves.", tags: ["satfat"] },
  { match: ["cheese"], from: "Cheese", to: "A smaller amount of a stronger cheese, or avocado",
    why: "Same satisfaction, less saturated fat.", tags: ["satfat"] },

  // --- fried / sodium ---
  { match: ["samosa", "pakora", "vada", "bhajia"], from: "Fried snacks", to: "Baked or air-fried, or roasted chana",
    why: "Deep frying roughly doubles the calories for the same food.", tags: ["kcal", "satfat"] },
  { match: ["french fries", "fries", "potato chips", "crisps"], from: "Fries and crisps", to: "Roasted makhana or a handful of nuts",
    why: "Similar crunch, far less refined oil and salt.", tags: ["kcal", "sodium"] },
  { match: ["pickle", "achar"], from: "Pickle", to: "Fresh kachumber or a squeeze of lemon",
    why: "Pickle is one of the densest sodium sources on an Indian plate.", tags: ["sodium"] },
  { match: ["instant noodles", "maggi", "ramen"], from: "Instant noodles", to: "Whole-wheat noodles with egg or paneer and vegetables",
    why: "Adds protein and fibre, and avoids the very high sodium sachet.", tags: ["sodium", "protein"] },
  { match: ["papad"], from: "Papad", to: "Roasted papad, or skip",
    why: "Fried papad soaks up oil; roasting avoids it, though salt remains high.", tags: ["sodium"] },

  // --- protein upgrades ---
  { match: ["curd", "dahi", "yogurt"], from: "Regular curd", to: "Greek yogurt",
    why: "Roughly double the protein for the same volume.", tags: ["protein"] },
  { match: ["milk tea", "chai"], from: "Milk tea", to: "The same, but count it — or a protein-rich snack alongside",
    why: "Fine on its own; the issue is what usually accompanies it.", tags: ["protein"] },
  { match: ["salad"], from: "Plain salad", to: "The same salad with chana, paneer, tofu or egg",
    why: "Turns a side into something that actually holds you until the next meal.", tags: ["protein"] },
  { match: ["idli", "dosa"], from: "Idli or dosa", to: "The same with extra sambar and a protein side",
    why: "Fermented and steamed is a good base — it just needs protein alongside.", tags: ["protein"] },
];

export type MatchedSwap = FoodSwap & { logged: string };

/** Find item-level upgrades for what was actually logged today. */
export function swapsForEntries(entries: { item?: string; descr?: string; status?: string }[]): MatchedSwap[] {
  const out: MatchedSwap[] = [];
  const seen = new Set<string>();

  for (const e of entries) {
    const text = `${e.item || ""} ${e.descr || ""}`.toLowerCase();
    if (!text.trim()) continue;
    let best: FoodSwap | null = null, bestLen = 0;
    for (const s of FOOD_SWAPS) {
      for (const m of s.match) {
        if (text.includes(m) && m.length > bestLen) { best = s; bestLen = m.length; }
      }
    }
    if (best && !seen.has(best.to)) {
      seen.add(best.to);
      out.push({ ...best, logged: e.item || e.descr || "" });
    }
  }
  return out;
}
