/** Warm-up and cool-down text is free-form prose from the plan generator.
    We detect known drill names inside it and turn each into a demo link,
    matching the "watch demo" behaviour on the exercise cards. */

import { demoUrl } from "./schedule";

/** Known drills, longest first so multi-word names win over their substrings. */
const DRILLS = [
  // mobility / dynamic warm-up
  "world's greatest stretch", "worlds greatest stretch",
  "90/90 hip switch", "90/90 hip stretch", "couch stretch",
  "cat cow", "cat-cow", "bird dog", "dead bug", "glute bridge", "hip bridge",
  "leg swing", "arm circle", "shoulder circle", "hip circle", "ankle circle",
  "band pull-apart", "band pull apart", "band dislocate", "shoulder dislocate",
  "scap push-up", "scap pushup", "scapular push-up", "wall slide", "wall angel",
  "thoracic rotation", "t-spine rotation", "thoracic extension", "open book stretch",
  "inchworm", "walking lunge with twist", "lunge with rotation",
  "hip flexor stretch", "hamstring stretch", "quad stretch", "calf stretch",
  "piriformis stretch", "pigeon pose", "child's pose", "downward dog",
  "doorway chest stretch", "lat stretch", "tricep stretch", "shoulder stretch",
  "figure four stretch", "seated forward fold", "standing forward fold",
  "good morning", "bodyweight squat", "air squat", "high knees", "butt kicks",
  "mountain climber", "plank", "side plank", "pallof press", "monster walk",
  "banded lateral walk", "clamshell", "fire hydrant", "hip airplane",
  "calf raise", "toe touch", "neck roll", "wrist circle", "wrist stretch",
  // golf / rotational — generators phrase these many different ways
  "golf swing rotation", "golf swing", "golf mobility", "golf-specific mobility",
  "golf specific mobility", "golf warm-up", "golf warm up", "golf drill",
  "practice swing", "swing rehearsal", "swing practice", "shadow swing",
  "trunk rotation", "torso rotation", "torso twist", "standing trunk twist",
  "seated trunk rotation", "thoracic twist", "spinal rotation", "rotational drill",
  "rotational throw", "medicine ball rotational throw", "rotational med ball throw",
  "med ball rotational throw", "medicine ball throw", "med ball twist",
  "russian twist", "cable rotation", "cable chop", "wood chop", "woodchopper",
  "pallof press with rotation", "half-kneeling rotation", "windmill",
  "hip hinge drill", "hip turn", "shoulder turn", "x-factor stretch",
  "lat stretch with rotation", "side bend", "standing side bend",
  "wrist mobility", "forearm stretch", "grip warm-up",
];

export type Segment = { text: string; drill?: string; url?: string };

/** Split a warm-up/cool-down string into plain text and linkable drill names. */
export function parseDrills(input: string): Segment[] {
  if (!input) return [];
  const lower = input.toLowerCase();

  // Find non-overlapping matches, preferring longer names.
  type Hit = { start: number; end: number; name: string };
  const hits: Hit[] = [];
  const sorted = [...DRILLS].sort((a, b) => b.length - a.length);

  for (const drill of sorted) {
    let from = 0;
    for (;;) {
      const i = lower.indexOf(drill, from);
      if (i === -1) break;
      let end = i + drill.length;
      // absorb a trailing plural so "leg swings" links as one phrase
      if (lower[end] === "s" && (end + 1 >= lower.length || /[^a-z]/.test(lower[end + 1]))) end += 1;
      // whole-word-ish boundaries
      const before = i === 0 || /[^a-z]/.test(lower[i - 1]);
      const after = end >= lower.length || /[^a-z]/.test(lower[end]);
      const overlaps = hits.some((h) => i < h.end && end > h.start);
      if (before && after && !overlaps) hits.push({ start: i, end, name: drill });
      from = end;
    }
  }
  // Fallback: catch unlisted phrases ending in a movement word, e.g.
  // "scapular retraction drill" or "open-hip rotation".
  const GENERIC = /([a-z][a-z-]*(?:[\s-]+[a-z][a-z-]*){0,2}[\s-]+(?:rotations?|twists?|stretch(?:es)?|swings?|circles?|drills?|raises?|slides?|bridges?|holds?|walks?))\b/g;
  let m: RegExpExecArray | null;
  while ((m = GENERIC.exec(lower)) !== null) {
    const start = m.index, end = start + m[0].length;
    const overlaps = hits.some((h) => start < h.end && end > h.start);
    // skip filler openers so we don't link "and torso twists" or "of leg swings"
    const first = m[1].split(/\s+/)[0];
    const filler = ["and", "the", "of", "with", "then", "for", "min", "sec", "each", "per", "x", "to", "some", "a", "an"];
    if (!overlaps && !filler.includes(first)) hits.push({ start, end, name: m[1] });
  }

  if (!hits.length) return [{ text: input }];

  hits.sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let cursor = 0;
  for (const h of hits) {
    if (h.start > cursor) out.push({ text: input.slice(cursor, h.start) });
    const label = input.slice(h.start, h.end);
    out.push({ text: label, drill: label, url: demoUrl(label + " drill") });
    cursor = h.end;
  }
  if (cursor < input.length) out.push({ text: input.slice(cursor) });
  return out;
}
