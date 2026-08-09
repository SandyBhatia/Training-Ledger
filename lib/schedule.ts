/* Sequence scheduling: sessions run in fixed order. A rest day (weekly default
   or an ad-hoc skip) simply doesn't consume a session — everything downstream
   shifts forward. You can never lose or duplicate a session. */

export const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export type DayModes = Record<string, "rest" | "work" | undefined>;

export function isRestDay(date: Date, restDow: number, modes: DayModes): boolean {
  const k = keyOf(date);
  if (modes[k] === "rest") return true;
  if (modes[k] === "work") return false;
  return date.getDay() === restDow;
}

/** Resolve what happens on a given calendar day. */
export function resolveDay(
  start: Date,
  i: number,
  restDow: number,
  modes: DayModes,
  splitLength: number,
  sessionsPerWeek: number
) {
  const date = addDays(start, i);
  const key = keyOf(date);
  if (isRestDay(date, restDow, modes)) {
    return { i, date, key, isWorkout: false as const, seq: null, splitIndex: null, week: Math.floor(i / 7), skipped: modes[key] === "rest" };
  }
  let seq = 0;
  for (let j = 0; j < i; j++) if (!isRestDay(addDays(start, j), restDow, modes)) seq++;
  return {
    i, date, key,
    isWorkout: true as const,
    seq,
    splitIndex: splitLength ? seq % splitLength : 0,
    week: sessionsPerWeek ? Math.floor(seq / sessionsPerWeek) : Math.floor(i / 7),
    skipped: false,
  };
}

export function todayIndex(start: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - s.getTime()) / 86400000);
}

export const demoUrl = (name: string) => {
  const primary = String(name).split(/ or /i)[0].replace(/\([^)]*\)/g, "").trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(primary + " exercise proper form")}`;
};
