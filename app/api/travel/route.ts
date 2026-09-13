import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { start_date, end_date, label } = (await req.json()) as
    { start_date: string; end_date: string; label?: string };
  if (!start_date || !end_date) return NextResponse.json({ error: "dates_required" }, { status: 400 });

  const { data, error } = await supabase.from("travel_windows")
    .insert({ user_id: user.id, start_date, end_date, label: label || "Travel" })
    .select().single();
  if (error) return NextResponse.json({ error: "save_failed", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, window: data });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = (await req.json()) as { id: string };
  await supabase.from("travel_windows").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
