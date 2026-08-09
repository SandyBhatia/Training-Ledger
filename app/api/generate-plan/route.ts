import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { screenProfile } from "@/lib/guardrails";
import { PLAN_SYSTEM, planUserMessage } from "@/lib/prompts";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Profile & { start_date?: string };
  const startDate = body.start_date || new Date().toISOString().slice(0, 10);
  const { start_date: _ignored, ...profile } = body;

  // 1) Safety screen — defer to a clinician rather than generating.
  const screen = screenProfile(profile);
  if (!screen.ok) return NextResponse.json({ deferred: true, reason: screen.reason });

  // 2) Save the profile (RLS guarantees it's their own row).
  const { error: pErr } = await supabase
    .from("profiles")
    .update({ ...profile, onboarded: true, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (pErr) return NextResponse.json({ error: "profile_save_failed", detail: pErr.message }, { status: 500 });

  // 3) Generate with Claude (key stays server-side).
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "missing_api_key", detail: "ANTHROPIC_API_KEY is not set in your environment." }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  let plan: Record<string, unknown>;
  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 10000,
      system: PLAN_SYSTEM,
      messages: [{ role: "user", content: planUserMessage(profile) }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text).join("\n")
      .replace(/```json|```/g, "").trim();

    try {
      plan = JSON.parse(text);
    } catch {
      // The model may have been cut off mid-JSON. Repair the truncation by
      // closing any open string/array/object so we keep what was generated.
      const repaired = repairJson(text);
      try {
        plan = JSON.parse(repaired);
      } catch (e2) {
        const detail = msg.stop_reason === "max_tokens"
          ? "The plan was longer than the response limit and could not be repaired. Try again, or reduce days per week."
          : (e2 instanceof Error ? e2.message : "could not parse the model response");
        return NextResponse.json({ error: "generation_failed", model, detail }, { status: 502 });
      }
    }
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : "unknown error";
    // Surface the real reason — usually a bad ANTHROPIC_MODEL or missing credits.
    return NextResponse.json({ error: "generation_failed", model, detail }, { status: 502 });
  }

  // 4) Store it; deactivate any previous active plan.
  await supabase.from("plans").update({ active: false }).eq("user_id", user.id).eq("active", true);
  const { data, error } = await supabase.from("plans").insert({
    user_id: user.id,
    start_date: startDate,
    weeks: (plan.weeks as number) ?? 12,
    workout: plan.workout ?? null,
    nutrition: plan.nutrition ?? null,
    micros: plan.micros ?? null,
    meta: { model, summary: plan.summary, disclaimer: plan.disclaimer },
    active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: "save_failed", detail: error.message }, { status: 500 });
  return NextResponse.json({ plan: data });
}

/** Close an incomplete JSON document produced by a truncated response. */
function repairJson(input: string): string {
  let s = input.trim();

  // Walk the text and remember the last position where the document was
  // structurally sound (end of a complete value, or a closing bracket).
  let inStr = false, esc = false, lastSafe = 0;
  const depth: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; if (!inStr) lastSafe = i + 1; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") { depth.push(ch); lastSafe = i + 1; }
    else if (ch === "}" || ch === "]") { depth.pop(); lastSafe = i + 1; }
    else if (ch === "," ) lastSafe = i + 1;
    else if (/[\d}\]]/.test(ch)) lastSafe = i + 1;
  }
  s = s.slice(0, Math.max(lastSafe, 1));

  // Drop any dangling partial property such as `"name":` or `"na`
  s = s.replace(/,\s*"[^"]*"\s*:?\s*$/, "");
  s = s.replace(/,\s*$/, "");
  s = s.replace(/\{\s*"[^"]*"\s*:?\s*$/, "{");
  s = s.replace(/\{\s*$/, "{}");
  s = s.replace(/,\s*$/, "");

  // Recompute open containers and close them.
  const open: string[] = [];
  inStr = false; esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") open.push(ch);
    else if (ch === "}" || ch === "]") open.pop();
  }
  if (inStr) s += '"';
  s = s.replace(/,\s*$/, "");
  while (open.length) s += open.pop() === "{" ? "}" : "]";
  return s;
}
