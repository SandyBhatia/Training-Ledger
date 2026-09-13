import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { easedUntilFor, LAPSE_OPTIONS } from "@/lib/travel";

export const runtime = "nodejs";

/** The user has answered the check-in. Reshape the next few days. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { option, gapDays } = (await req.json()) as { option: string; gapDays?: number };
  const opt = LAPSE_OPTIONS.find((o) => o.id === option);
  if (!opt) return NextResponse.json({ error: "unknown_option" }, { status: 400 });

  const easedUntil = easedUntilFor(option);

  const { error } = await supabase.from("profiles").update({
    eased_until: easedUntil,
    eased_reason: opt.days > 0 ? opt.label : null,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "save_failed", detail: error.message }, { status: 500 });

  await supabase.from("nudges").insert({
    user_id: user.id, gap_days: gapDays ?? null, responded: true,
    response: option, adjusted_to: easedUntil,
  });

  return NextResponse.json({ ok: true, easedUntil, message: opt.plan, days: opt.days });
}
