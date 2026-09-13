/* Travel mode and life-adjusted accountability.

   Two principles from the relapse-prevention literature drive this file:

   1. A lapse is not the damage — the "I've blown it, may as well quit"
      reaction is. So a day you genuinely couldn't train is recorded as an
      adjusted day, not a failure, and never breaks a streak.

   2. All-or-nothing thinking is what ends travel weeks. So a travel day
      still runs a session — a short, no-equipment version that keeps the
      sequence moving rather than pausing the programme. */

import { keyOf, addDays } from "./schedule";

export type DayMode = "rest" | "work" | "travel" | undefined;

export type TravelWindow = { start_date: string; end_date: string; label?: string };

/** Is this date inside a declared travel window? */
export function inTravelWindow(date: Date, windows: TravelWindow[]): TravelWindow | null {
  const k = keyOf(date);
  return windows.find((w) => k >= w.start_date && k <= w.end_date) || null;
}

/** The programme is "eased" for a period after the user says life got hard. */
export function isEased(date: Date, easedUntil?: string | null): boolean {
  if (!easedUntil) return false;
  return keyOf(date) <= easedUntil;
}

/* ---------------- minimum viable session ----------------
   10–15 minutes, hotel room, no equipment. Enough to preserve the identity
   of someone who trains, which is what actually survives a bad week. */

export type MiniSession = { title: string; note: string; blocks: string[]; minutes: number };

const MINI: Record<string, MiniSession> = {
  lower: {
    title: "Travel Lower",
    minutes: 12,
    note: "No equipment, quiet enough for a hotel room. This counts as your session.",
    blocks: [
      "Bodyweight squats — 3 × 15",
      "Reverse lunges — 3 × 10 each leg",
      "Glute bridges — 3 × 15",
      "Calf raises — 2 × 20",
      "Wall sit — 2 × 30 sec",
    ],
  },
  upper: {
    title: "Travel Upper",
    minutes: 12,
    note: "No equipment, quiet enough for a hotel room. This counts as your session.",
    blocks: [
      "Push-ups (or incline off the desk) — 3 × 10–15",
      "Pike push-ups — 3 × 8",
      "Chair or bed dips — 3 × 10",
      "Superman holds — 3 × 20 sec",
      "Doorway chest stretch — 30 sec each side",
    ],
  },
  core: {
    title: "Travel Core",
    minutes: 10,
    note: "Floor only. Breathe throughout — no breath-holding.",
    blocks: [
      "Plank — 3 × 30 sec",
      "Dead bug — 3 × 10 each side",
      "Side plank — 2 × 25 sec each side",
      "Bicycle crunches — 3 × 20",
      "Bird dog — 2 × 10 each side",
    ],
  },
  cardio: {
    title: "Travel Conditioning",
    minutes: 15,
    note: "Hotel corridor, stairwell, or a brisk walk outside. Keep it conversational.",
    blocks: [
      "5 min brisk walk or stair climb to warm up",
      "6 × (1 min brisk / 1 min easy)",
      "3 min easy walk to finish",
      "Optional: 10 min walk after your evening meal",
    ],
  },
};

/** Pick the travel equivalent of whatever session was scheduled. */
export function miniFor(splitTitle: string | undefined): MiniSession {
  const t = (splitTitle || "").toLowerCase();
  if (t.includes("lower") || t.includes("leg") || t.includes("quad") || t.includes("hinge")) return MINI.lower;
  if (t.includes("condition") || t.includes("cardio") || t.includes("zone")) return MINI.cardio;
  if (t.includes("core") || t.includes("pump") || t.includes("abs")) return MINI.core;
  return MINI.upper;
}

/* ---------------- life-adjusted adherence ----------------
   Adherence is measured against what was realistically askable, not against
   an ideal week the user never had a chance at. Days inside a travel window
   or an eased period still count when trained, and are excused when not. */

export type AdherenceInput = {
  scheduledKeys: string[];                 // session days up to today
  doneKeys: Set<string>;
  modes: Record<string, DayMode>;
  travelWindows: TravelWindow[];
  easedUntil?: string | null;
  start: Date;
};

export type Adherence = {
  pct: number | null;          // life-adjusted
  rawPct: number | null;       // unadjusted, for honesty
  done: number;
  expected: number;
  excused: number;
  label: string;
};

export function lifeAdjustedAdherence(i: AdherenceInput): Adherence {
  let done = 0, expected = 0, excused = 0;

  for (const k of i.scheduledKeys) {
    const d = new Date(k + "T00:00:00");
    const isDone = i.doneKeys.has(k);
    const mode = i.modes[k];
    const travelling = !!inTravelWindow(d, i.travelWindows) || mode === "travel";
    const eased = isEased(d, i.easedUntil);

    if (isDone) { done++; expected++; continue; }
    // Not done. Was it a day we could fairly have expected training?
    if (travelling || eased || mode === "rest") { excused++; continue; }
    expected++;
  }

  const pct = expected > 0 ? Math.round((done / expected) * 100) : null;
  const rawTotal = expected + excused;
  const rawPct = rawTotal > 0 ? Math.round((done / rawTotal) * 100) : null;

  let label = "";
  if (pct === null) label = "No sessions scheduled yet";
  else if (excused === 0) label = `${done} of ${expected} sessions`;
  else label = `${done} of ${expected} sessions · ${excused} day${excused === 1 ? "" : "s"} excused for travel or a lighter patch`;

  return { pct, rawPct, done, expected, excused, label };
}

/* ---------------- streak, forgiving version ----------------
   Travel days, eased days and declared rest days do not break a streak.
   Only a day you could reasonably have trained and didn't. */

export function forgivingStreak(i: AdherenceInput): { days: number; protectedBy: string | null } {
  let n = 0;
  let protectedBy: string | null = null;
  const keys = [...i.scheduledKeys].sort().reverse();

  for (const k of keys) {
    const d = new Date(k + "T00:00:00");
    if (i.doneKeys.has(k)) { n++; continue; }
    const travelling = !!inTravelWindow(d, i.travelWindows) || i.modes[k] === "travel";
    const eased = isEased(d, i.easedUntil);
    if (travelling) { protectedBy = protectedBy || "travel"; continue; }   // skipped, not broken
    if (eased) { protectedBy = protectedBy || "an eased week"; continue; }
    if (i.modes[k] === "rest") continue;
    break;
  }
  return { days: n, protectedBy };
}

/* ---------------- lapse detection ---------------- */

export type Lapse = { gapDays: number; lastActive: string | null; shouldAsk: boolean };

/** How long since anything was logged? Two clear days is the trigger. */
export function detectLapse(activityKeys: string[], today = new Date()): Lapse {
  if (!activityKeys.length) return { gapDays: 0, lastActive: null, shouldAsk: false };
  const last = [...activityKeys].sort().reverse()[0];
  const lastDate = new Date(last + "T00:00:00");
  const t = new Date(today); t.setHours(0, 0, 0, 0);
  const gapDays = Math.floor((t.getTime() - lastDate.getTime()) / 86400000);
  return { gapDays, lastActive: last, shouldAsk: gapDays >= 2 };
}

/* ---------------- the response → plan adjustment ----------------
   The user tells us what's going on; we reshape the next few days rather
   than leaving them to face the full programme from a standing start. */

export const LAPSE_OPTIONS = [
  { id: "travelling", label: "I'm travelling", days: 5,
    plan: "Travel mode for the next few days — short hotel-room sessions that still count, and your programme picks up where it left off when you're back." },
  { id: "busy", label: "Work has been flat out", days: 4,
    plan: "Eased for a few days — the minimum session counts as a full day. Getting something in beats getting the perfect thing in." },
  { id: "rough_patch", label: "Just a rough patch", days: 3,
    plan: "Eased for three days with the short version. No catch-up debt, no broken streak — you pick up from where you are." },
  { id: "unwell", label: "Unwell or injured", days: 7,
    plan: "Paused for a week. Nothing is expected of you and nothing counts against you. If it's an injury or it isn't improving, please get it looked at." },
  { id: "back_on_it", label: "Nothing's wrong — back on it today", days: 0,
    plan: "Good. Your plan is unchanged and today's session is waiting." },
];

export function easedUntilFor(optionId: string, from = new Date()): string | null {
  const opt = LAPSE_OPTIONS.find((o) => o.id === optionId);
  if (!opt || opt.days === 0) return null;
  return keyOf(addDays(from, opt.days));
}
