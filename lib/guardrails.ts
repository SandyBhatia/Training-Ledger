import type { Profile } from "./types";

/* Red-flag screen. If any of these are present we do NOT generate a plan and
   route the person to a clinician instead. Disclaimers reduce responsibility;
   they don't remove it once you store health data and generate advice from it. */

const RED_FLAG_TERMS = [
  "chest pain", "chest pressure", "angina", "heart attack", "cardiac arrest",
  "stroke", "fainting", "passed out", "blackout",
  "shortness of breath at rest", "breathless at rest",
  "pregnant", "pregnancy", "postpartum bleeding",
  "eating disorder", "anorexia", "bulimia", "purging",
  "rhabdo", "unexplained weight loss", "blood in stool", "blood in urine",
  "suicidal", "self harm",
];

export type Screen = { ok: boolean; reason?: string };

export function screenProfile(p: Profile): Screen {
  const haystack = [p.goals, p.medications, p.allergies, p.conditions_other, (p.conditions || []).join(" ")]
    .filter(Boolean).join(" ").toLowerCase();

  if (RED_FLAG_TERMS.some((t) => haystack.includes(t))) {
    return {
      ok: false,
      reason:
        "Some of what you entered — for example symptoms like chest pain or fainting, or conditions such as pregnancy or a history of disordered eating — needs a clinician's input before any exercise or diet plan is appropriate. Please speak with your doctor first. We'll gladly build your plan once you're cleared.",
    };
  }

  if (p.resting_bp) {
    const m = p.resting_bp.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (m && (+m[1] >= 180 || +m[2] >= 110)) {
      return {
        ok: false,
        reason:
          "The resting blood pressure you entered is high enough that training should wait until a doctor has reviewed it. Please get that checked first — this isn't something to train through.",
      };
    }
  }

  if (p.birth_date) {
    const age = Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 3.15576e10);
    if (age < 16 || age > 80) {
      return {
        ok: false,
        reason:
          "For this age group we'd rather a qualified trainer or clinician set the programme in person. This tool is limited to adults 16–80.",
      };
    }
  }

  // Type 1 diabetes and kidney disease need individualised medical nutrition therapy.
  const c = p.conditions || [];
  if (c.includes("type1_diabetes") || c.includes("kidney")) {
    return {
      ok: false,
      reason:
        "Conditions like type 1 diabetes or kidney disease need individualised medical nutrition therapy from your care team — generic targets can be genuinely unsafe here. Please work with your doctor or a registered dietitian; we don't want to give you numbers that conflict with their plan.",
    };
  }

  return { ok: true };
}
