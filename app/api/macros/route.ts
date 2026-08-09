import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { MACRO_SYSTEM } from "@/lib/prompts";
import { lookupLocal } from "@/lib/food";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { description } = (await req.json()) as { description: string };
  if (!description?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  // Local database first: instant, consistent, offline.
  const local = lookupLocal(description);
  if (local) return NextResponse.json(local);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const msg = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 600,
      system: MACRO_SYSTEM,
      messages: [{ role: "user", content: `Estimate nutrition for: ${description}` }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text).join("\n").replace(/```json|```/g, "").trim();
    const m = JSON.parse(text);
    return NextResponse.json({
      item: m.item || description, serving: m.serving || "",
      kcal: Math.round(+m.calories || 0), p: Math.round(+m.protein_g || 0),
      c: Math.round(+m.carbs_g || 0), f: Math.round(+m.fat_g || 0),
      satfat: Math.round(+m.saturated_fat_g || 0),
      fiber: Math.round(+m.fiber_g || 0), sugar: Math.round(+m.sugar_g || 0),
      sodium: Math.round(+m.sodium_mg || 0), src: "ai",
    });
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: "estimate_failed", detail }, { status: 502 });
  }
}
