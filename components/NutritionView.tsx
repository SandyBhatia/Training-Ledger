"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MEALS, mealOf, analyzeDay, lookupLocal, DEFAULT_TARGET, type NutTarget } from "@/lib/food";

type Row = { id: string; log_date: string; meal: string; descr: string; macros: any };

export default function NutritionView({ plan, initialFood, initialDate }: { plan: any; initialFood: Row[]; initialDate: string }) {
  const supabase = createClient();
  const t = plan?.nutrition?.targets;
  const target: NutTarget = t ? {
    kcal: t.kcal ?? DEFAULT_TARGET.kcal, p: t.protein_g ?? DEFAULT_TARGET.p,
    c: t.carbs_g ?? DEFAULT_TARGET.c, f: t.fat_g ?? DEFAULT_TARGET.f,
    fiber: t.fiber_g ?? DEFAULT_TARGET.fiber, sugar: t.sugar_g ?? DEFAULT_TARGET.sugar,
    sodium: t.sodium_mg ?? DEFAULT_TARGET.sodium, satfat: t.satfat_g ?? DEFAULT_TARGET.satfat,
  } : DEFAULT_TARGET;

  const [tab, setTab] = useState<"log" | "plan" | "micros">("log");
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState<Row[]>(initialFood);
  const [input, setInput] = useState("");
  const [meal, setMeal] = useState(() => {
    const h = new Date().getHours();
    return h < 11 ? "breakfast" : h < 14 ? "lunch" : h < 16 ? "afternoon" : h < 18 ? "evening" : h < 22 ? "dinner" : "other";
  });
  const [busy, setBusy] = useState(false);
  const [openFlag, setOpenFlag] = useState<string | null>(null);

  const loadDate = async (d: string) => {
    setDate(d);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("food_log").select("*").eq("user_id", user.id).eq("log_date", d).order("created_at");
    setRows(data || []);
  };
  const shift = (n: number) => { const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + n); loadDate(d.toISOString().slice(0, 10)); };

  const add = async () => {
    const text = input.trim(); if (!text || busy) return;
    setBusy(true); setInput("");
    let macros = lookupLocal(text);
    if (!macros) {
      try {
        const res = await fetch("/api/macros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: text }) });
        const d = await res.json();
        macros = d.error ? null : d;
      } catch { macros = null; }
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("food_log").insert({
        user_id: user.id, log_date: date, meal, descr: text, macros: macros || {},
      }).select().single();
      if (data) setRows((r) => [...r, data]);
    }
    setBusy(false);
  };
  const remove = async (id: string) => {
    setRows((r) => r.filter((x) => x.id !== id));
    await supabase.from("food_log").delete().eq("id", id);
  };

  const entries = rows.map((r) => ({ ...r.macros, id: r.id, meal: r.meal, status: r.macros?.kcal !== undefined ? "ok" : "error", item: r.macros?.item || r.descr }));
  const tot = entries.filter((e: any) => e.status === "ok").reduce((a: any, e: any) => ({
    kcal: a.kcal + (e.kcal || 0), p: a.p + (e.p || 0), c: a.c + (e.c || 0), f: a.f + (e.f || 0),
    fiber: a.fiber + (e.fiber || 0), sugar: a.sugar + (e.sugar || 0), sodium: a.sodium + (e.sodium || 0), satfat: a.satfat + (e.satfat || 0),
  }), { kcal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, sodium: 0, satfat: 0 });
  const flags = analyzeDay(tot, entries, target);
  const pct = (v: number, x: number) => Math.min(100, Math.round((v / x) * 100));

  return (
    <div className="container">
      <div style={{ display: "flex", marginBottom: 16 }}>
        {(["log", "plan", "micros"] as const).map((k, i) => (
          <button key={k} onClick={() => setTab(k)} data-on={tab === k} className="pill"
            style={{ borderRadius: i === 0 ? "7px 0 0 7px" : i === 2 ? "0 7px 7px 0" : 0, borderLeft: i ? "none" : undefined }}>
            {k === "log" ? "Log food" : k === "plan" ? "Meal plan" : "Micronutrients"}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button className="btn ghost" style={{ padding: "7px 13px" }} onClick={() => shift(-1)}>‹</button>
            <div className="mono" style={{ fontSize: 13 }}>{new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
            <button className="btn ghost" style={{ padding: "7px 13px" }} onClick={() => shift(1)} disabled={date >= new Date().toISOString().slice(0, 10)}>›</button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {MEALS.map((m: any) => (
              <button key={m.id} className="pill" data-on={meal === m.id} onClick={() => setMeal(m.id)} style={{ fontSize: 11.5, padding: "6px 11px" }}>{m.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="inp" placeholder="e.g. 2 chapati with dal and a katori rajma"
              value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
            <button className="btn" onClick={add} disabled={busy || !input.trim()}>{busy ? "…" : "Add"}</button>
          </div>
          <p className="muted" style={{ fontSize: 11.5, marginBottom: 16 }}>
            Common foods come from a built-in database (instant and consistent); anything else falls back to an AI estimate.
          </p>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{tot.kcal}<span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 400 }}> / {target.kcal} kcal</span></div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: "#8fcea8" }}>{tot.p}<span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}> / {target.p} g protein</span></div>
            </div>
            <Bar v={pct(tot.kcal, target.kcal)} />
            <div style={{ height: 6 }} />
            <Bar v={pct(tot.p, target.p)} color="#6fae86" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
              <Chip label={`Carbs ${tot.c} g`} />
              <Chip label={`Fat ${tot.f} g`} />
              <Chip label={`Fiber ${tot.fiber} g`} warn={tot.fiber < target.fiber && tot.kcal > 800} />
              <Chip label={`Sugar ${tot.sugar} g`} warn={tot.sugar > target.sugar} />
              <Chip label={`Sat fat ${tot.satfat} g`} warn={tot.satfat > target.satfat} />
              <Chip label={`Sodium ${tot.sodium} mg`} warn={tot.sodium > target.sodium} />
            </div>
          </div>

          {flags.length > 0 && (
            <div className="card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px 8px" }}>
                <span className="eyebrow">Today&apos;s flags</span>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{flags.length} to look at</span>
              </div>
              {flags.map((f: any) => (
                <div key={f.key} style={{ borderTop: "1px solid var(--line)" }}>
                  <button onClick={() => setOpenFlag(openFlag === f.key ? null : f.key)}
                    style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                      background: "transparent", border: "none", color: "var(--text)", padding: "12px 14px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <i style={{ width: 8, height: 8, borderRadius: "50%", background: f.over ? "#e6b877" : "var(--blue)" }} />
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{f.label}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{f.val} {f.over ? "vs" : "of"} {f.target}</span>
                  </button>
                  {openFlag === f.key && (
                    <div style={{ padding: "0 14px 14px 31px" }}>
                      <div style={{ fontSize: 12.5, color: "#aab2c8", lineHeight: 1.55, marginBottom: 8 }}>{f.why}</div>
                      {f.worst && <div style={{ fontSize: 12, color: "#e6b877", marginBottom: 8 }}>Mostly from <strong>{f.worst.label}</strong> ({f.worst.amount})</div>}
                      {!!f.culprits?.length && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {f.culprits.map((c: string) => (
                            <span key={c} style={{ fontSize: 11, color: "#e6b877", background: "#2a2418", border: "1px solid #6b5a2e", borderRadius: 99, padding: "3px 9px" }}>{c}</span>
                          ))}
                        </div>
                      )}
                      <ul style={{ paddingLeft: 18, margin: 0, color: "var(--gold)", display: "flex", flexDirection: "column", gap: 6 }}>
                        {f.swaps.map((s: string, i: number) => <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: "#c9cfe0" }}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {rows.length === 0 && <div className="muted mono" style={{ textAlign: "center", padding: 24, fontSize: 13 }}>Nothing logged yet.</div>}
          {MEALS.map((m: any) => {
            const list = rows.filter((r) => mealOf({ meal: r.meal }) === m.id);
            if (!list.length) return null;
            const sub = list.reduce((a, r) => ({ kcal: a.kcal + (r.macros?.kcal || 0), p: a.p + (r.macros?.p || 0) }), { kcal: 0, p: 0 });
            return (
              <div key={m.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 2px 7px", borderBottom: "1px solid var(--line)", marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#c3cadd" }}>{m.label}{m.time && <span style={{ fontWeight: 400, color: "#6f7897", fontSize: 11 }}> · {m.time}</span>}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{sub.kcal} kcal · {sub.p} g P</span>
                </div>
                {list.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.macros?.item || r.descr}
                        {r.macros?.src && <span style={{ fontSize: 9.5, textTransform: "uppercase", color: "#6f7897", border: "1px solid var(--line)", borderRadius: 4, padding: "1px 5px", marginLeft: 8 }}>{r.macros.src === "ai" ? "AI est." : "db"}</span>}
                      </div>
                      <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                        {r.macros?.kcal !== undefined ? `${r.macros.serving ? r.macros.serving + " · " : ""}${r.macros.kcal} kcal · ${r.macros.p}g P · ${r.macros.c}g C · ${r.macros.f}g F` : "no estimate"}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: "var(--gold)" }}>{r.macros?.kcal ?? "—"}</div>
                    <button onClick={() => remove(r.id)} aria-label="Remove"
                      style={{ background: "none", border: "none", color: "#7a8098", fontSize: 18, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {tab === "plan" && (
        <div>
          <div className="card" style={{ borderLeft: "3px solid var(--gold)", marginBottom: 16 }}>
            <span className="eyebrow">Your targets</span>
            <div className="mono" style={{ fontSize: 12.5, color: "var(--gold)", margin: "8px 0 12px", lineHeight: 1.6 }}>
              {target.kcal} kcal · {target.p} g protein · {target.fiber} g fiber
            </div>
            <ul style={{ paddingLeft: 18, margin: 0, color: "var(--gold)", display: "flex", flexDirection: "column", gap: 8 }}>
              {(plan?.nutrition?.principles || []).map((p: string, i: number) => (
                <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: "#c9cfe0" }}>{p}</li>
              ))}
            </ul>
          </div>
          {(plan?.nutrition?.day_options || []).map((d: any, i: number) => (
            <div key={i} className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#c3cadd", marginBottom: 8 }}>{d.slot}</div>
              <ul style={{ paddingLeft: 18, margin: 0, color: "var(--gold)", display: "flex", flexDirection: "column", gap: 6 }}>
                {(d.options || []).map((o: string, j: number) => <li key={j} style={{ fontSize: 13, lineHeight: 1.5, color: "#c9cfe0" }}>{o}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === "micros" && (
        <div>
          <p className="muted" style={{ marginBottom: 14 }}>Key micronutrients for your calorie level, age, and conditions.</p>
          {(plan?.micros || []).map((m: any, i: number) => (
            <div key={i} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ fontSize: 14.5 }}>{m.nutrient}</strong>
                <span className="mono" style={{ fontSize: 12, color: "var(--gold)" }}>{m.target}</span>
              </div>
              <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>{m.why}</p>
              <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#c9cfe0" }}><strong style={{ color: "#8a7a4e" }}>Sources: </strong>{m.sources}</p>
            </div>
          ))}
          {!plan?.micros?.length && <div className="muted">No micronutrient guidance in this plan yet.</div>}
        </div>
      )}
    </div>
  );
}

const Bar = ({ v, color = "var(--gold)" }: { v: number; color?: string }) => (
  <div style={{ height: 8, background: "#141a2b", border: "1px solid var(--line)", borderRadius: 99, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${v}%`, background: color }} />
  </div>
);
const Chip = ({ label, warn }: { label: string; warn?: boolean }) => (
  <span className="mono" style={{ fontSize: 11.5, color: warn ? "#e6b877" : "#c9cfe0", background: "#141a2b",
    border: `1px solid ${warn ? "#6b5a2e" : "var(--line)"}`, borderRadius: 99, padding: "4px 10px" }}>{label}</span>
);
