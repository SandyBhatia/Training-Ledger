"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const METRICS = [
  { id: "weight", label: "Bodyweight", unit: "lb", down: false },
  { id: "waist", label: "Waist", unit: "in", down: true },
  { id: "arms", label: "Arms", unit: "in", down: false },
  { id: "chest", label: "Chest", unit: "in", down: false },
  { id: "biceps", label: "Biceps", unit: "in", down: false },
  { id: "calves", label: "Calves", unit: "in", down: false },
  { id: "thighs", label: "Thighs", unit: "in", down: false },
];

export default function CheckinView({ profile, checkins }: { profile: any; checkins: any[] }) {
  const supabase = createClient();
  const [rows, setRows] = useState<Record<number, any>>(() => {
    const m: Record<number, any> = {};
    checkins.forEach((c) => { m[c.week] = c; });
    return m;
  });
  const [wk, setWk] = useState(0);
  const cur = rows[wk] || { metrics: {}, feel: "" };
  const [saving, setSaving] = useState(false);

  const save = async (metrics: any, feel: string) => {
    setRows((r) => ({ ...r, [wk]: { ...(r[wk] || {}), week: wk, metrics, feel } }));
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("checkins").upsert(
        { user_id: user.id, week: wk, metrics, feel, saved_at: new Date().toISOString() },
        { onConflict: "user_id,week" }
      );
    }
    setSaving(false);
  };
  const setMetric = (id: string, v: string) => save({ ...(cur.metrics || {}), [id]: v }, cur.feel || "");

  const prevWeek = (() => { for (let k = wk - 1; k >= 0; k--) if (rows[k]?.metrics) return rows[k]; return null; })();

  return (
    <div className="container">
      <span className="eyebrow">Weekly check-in</span>
      <p className="muted" style={{ margin: "8px 0 16px" }}>
        Measure the same morning each week — before food, after the bathroom — so the numbers are comparable. Waist is the one to watch.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {Array.from({ length: 13 }, (_, i) => (
          <button key={i} className="pill" data-on={wk === i} onClick={() => setWk(i)} style={{ minWidth: 46, borderRadius: 7, fontSize: 11.5 }}>
            {i === 0 ? "Base" : `W${i}`}
            {rows[i]?.metrics && Object.values(rows[i].metrics).some(Boolean) && <span style={{ color: "var(--green)" }}> •</span>}
          </button>
        ))}
      </div>

      <div className="card" style={{ borderTop: "3px solid var(--gold)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <strong style={{ fontFamily: "Fraunces, serif", fontSize: 19 }}>{wk === 0 ? "Baseline" : `Week ${wk}`}</strong>
          {saving && <span className="muted" style={{ fontSize: 11.5 }}><span className="spinner" /> saving</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          {METRICS.map((m) => {
            const v = cur.metrics?.[m.id] ?? "";
            const prev = prevWeek ? parseFloat(prevWeek.metrics?.[m.id]) : NaN;
            const now = parseFloat(v);
            const delta = Number.isFinite(prev) && Number.isFinite(now) ? +(now - prev).toFixed(1) : null;
            return (
              <div key={m.id} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{m.label} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({m.unit})</span></label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input className="inp mono" inputMode="decimal" placeholder="—" value={v} onChange={(e) => setMetric(m.id, e.target.value)} />
                  {delta !== null && delta !== 0 && (
                    <span className="mono" style={{ position: "absolute", right: 10, fontSize: 12, fontWeight: 600,
                      color: (m.down ? delta < 0 : delta > 0) ? "var(--green)" : "#d0a24e", pointerEvents: "none" }}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="field" style={{ marginTop: 18, marginBottom: 0 }}>
          <label className="label">How did the plan feel this week?</label>
          <textarea className="inp" rows={3} value={cur.feel ?? ""} onChange={(e) => save(cur.metrics || {}, e.target.value)}
            placeholder="Energy, recovery, joints, what was too easy or too hard, travel disruptions…" />
        </div>
      </div>
    </div>
  );
}
