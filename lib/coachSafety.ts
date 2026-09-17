/* Some messages should never reach the model for a coaching answer.
   These return a fixed response and stop. Kept deliberately narrow — over-
   triggering makes the coach useless — but absolute where it fires. */

const URGENT = [
  "chest pain", "chest pressure", "crushing chest", "pain in my chest",
  "can't breathe", "cant breathe", "short of breath at rest",
  "passed out", "fainted", "blacked out", "collapsed",
  "numbness on one side", "face drooping", "slurred speech",
  "blood in my stool", "blood in my urine", "coughing blood", "vomiting blood",
  "suicidal", "kill myself", "end my life", "self harm", "hurt myself",
];

const CLINICAL = [
  "should i stop taking", "stop my statin", "stop taking my", "change my dose",
  "adjust my medication", "double my dose", "skip my medication",
  "do i have diabetes", "do i have cancer", "is this a heart attack",
  "diagnose", "what does my result mean", "interpret my blood",
  "is my liver", "is my kidney", "what's my diagnosis",
];

/* Lab interpretation is the easiest line to cross by accident: a user pastes
   a marker and asks what it means. Catch the shape of the question, not one
   exact phrasing. */
const LAB_MARKERS = [
  "alt", "ast", "ggt", "bilirubin", "creatinine", "egfr", "bun", "albumin",
  "a1c", "hba1c", "fasting glucose", "insulin", "homa", "tsh", "t3", "t4",
  "ldl", "hdl", "triglyceride", "cholesterol", "crp", "ferritin", "vitamin d",
  "testosterone", "estrogen", "oestrogen", "cortisol", "psa", "platelet",
  "white cell", "haemoglobin", "hemoglobin", "lipid panel", "blood work", "bloodwork",
];
const INTERPRET_VERBS = [
  "what does", "what do", "mean", "normal", "high", "low", "elevated", "abnormal",
  "should i worry", "is it bad", "concerning", "interpret", "explain my",
];

function asksForLabInterpretation(m: string): boolean {
  const hasMarker = LAB_MARKERS.some((k) => new RegExp(`\\b${k}\\b`).test(m));
  if (!hasMarker) return false;
  return INTERPRET_VERBS.some((v) => m.includes(v));
}

export function screenMessage(message: string): string | null {
  const m = message.toLowerCase();

  if (URGENT.some((t) => m.includes(t))) {
    return "What you've described needs urgent medical attention, not a training app. Please contact emergency services or get to urgent care now. If you're having thoughts of harming yourself, please reach out to a crisis line or someone you trust right away — you don't have to handle that alone. I'll be here when you're safe.";
  }

  if (CLINICAL.some((t) => m.includes(t)) || asksForLabInterpretation(m)) {
    return "That's a question for your doctor rather than me. I can't interpret test results, diagnose anything, or advise on medication — and getting that wrong would matter. What I can do is help you organise what to bring to the appointment: the Check-in tab has a 'Prepare for a doctor's visit' summary with your measurements, history and suggested questions. Ask me anything about training, food or the plan itself and I'm on solid ground.";
  }

  return null;
}
