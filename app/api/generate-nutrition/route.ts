import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NUTRITION_SYSTEM, planUserMessage } from "@/lib/prompts";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Second half of plan generation: nutrition targets + micronutrients.
    Split from the workout call so each stays inside the 60s function limit. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { plan_id } = (await req.json()) as { plan_id?: string };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "no_profile" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "missing_api_key", detail: "ANTHROPIC_API_KEY is not set." }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  let out: Record<string, unknown>;
  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 6000,
      system: NUTRITION_SYSTEM,
      messages: [{ role: "user", content: planUserMessage(profile as Profile) }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text).join("\n").replace(/```json|```/g, "").trim();
    try { out = JSON.parse(text); }
    catch { out = JSON.parse(repairJson(text)); }
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: "nutrition_failed", model, detail }, { status: 502 });
  }

  const base = supabase.from("plans")
    .update({ nutrition: out.nutrition ?? null, micros: out.micros ?? null })
    .eq("user_id", user.id);
  const { error } = plan_id ? await base.eq("id", plan_id) : await base.eq("active", true);
  if (error) return NextResponse.json({ error: "save_failed", detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/** Close an incomplete JSON document produced by a truncated response. */
function repairJson(input: string): string {
  let s = input.trim();
  let inStr = false, esc = false, lastSafe = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; if (!inStr) lastSafe = i + 1; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[" || ch === "}" || ch === "]" || ch === "," || /[\d]/.test(ch)) lastSafe = i + 1;
  }
  s = s.slice(0, Math.max(lastSafe, 1));
  s = s.replace(/,\s*"[^"]*"\s*:?\s*$/, "").replace(/,\s*$/, "");
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
