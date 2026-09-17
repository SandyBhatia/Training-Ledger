import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildCoachContext } from "@/lib/coachContext";
import { screenMessage } from "@/lib/coachSafety";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_HISTORY = 24; // recent turns kept in context

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { message } = (await req.json()) as { message: string };
  if (!message?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  // Red-flag screen before anything else: some things need a clinician, not a coach.
  const screen = screenMessage(message);
  if (screen) {
    await supabase.from("coach_messages").insert([
      { user_id: user.id, role: "user", content: message },
      { user_id: user.id, role: "assistant", content: screen },
    ]);
    return NextResponse.json({ reply: screen, deferred: true });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
  }

  const [{ system }, { data: history }] = await Promise.all([
    buildCoachContext(user.id),
    supabase.from("coach_messages").select("role, content")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(MAX_HISTORY),
  ]);

  const turns = (history || []).reverse().map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let reply = "";
  try {
    const stream = anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 1200,
      system,
      messages: [...turns, { role: "user", content: message }],
    });
    const msg = await stream.finalMessage();
    reply = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: "coach_failed", detail }, { status: 502 });
  }

  await supabase.from("coach_messages").insert([
    { user_id: user.id, role: "user", content: message },
    { user_id: user.id, role: "assistant", content: reply },
  ]);

  return NextResponse.json({ reply });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await supabase.from("coach_messages").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
