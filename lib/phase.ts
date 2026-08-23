/** Phases are stored as blocks (e.g. weeks 1, 4, 7, 10), not one per week.
    For any given week, the active phase is the latest block that has started. */
export function phaseForWeek(phases: unknown, weekIndex: number): any {
  const list = (Array.isArray(phases) ? phases : []) as { week?: number }[];
  if (!list.length) return null;
  const wk = weekIndex + 1; // weekIndex is 0-based
  const started = list
    .filter((p) => typeof p.week === "number" && (p.week as number) <= wk)
    .sort((a, b) => (a.week as number) - (b.week as number));
  return started.length ? started[started.length - 1] : list[0];
}
