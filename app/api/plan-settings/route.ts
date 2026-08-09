import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Change the plan's start date, and optionally clear logged progress. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { start_date, clear_logs, rest_dow } = (await req.json()) as {
    start_date?: string;
    clear_logs?: boolean;
    rest_dow?: number;
  };

  if (typeof rest_dow === "number") {
    await supabase.from("profiles").update({ rest_dow, updated_at: new Date().toISOString() }).eq("id", user.id);
  }

  if (start_date) {
    const { error } = await supabase
      .from("plans")
      .update({ start_date })
      .eq("user_id", user.id)
      .eq("active", true);
    if (error) return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 500 });
  }

  if (clear_logs) {
    // RLS keeps these scoped to the signed-in user.
    await supabase.from("workout_logs").delete().eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}
