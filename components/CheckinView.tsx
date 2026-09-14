"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProgressPhotos from "./ProgressPhotos";
import ReviewCard from "./ReviewCard";
import DoctorSummary from "./DoctorSummary";
import { buildReview } from "@/lib/review";
import { bodyCompFor, projectToTarget, bfBand, leanMassCheck } from "@/lib/bodycomp";

const METRICS = [
  { id: "weight", label: "Bodyweight", unit: "lb", down: false },
  { id: "waist", label: "Waist", unit: "in", down: true },
  { id: "neck", label: "Neck", unit: "in", down: false },
  { id: "hips", label: "Hips", unit: "in", down: true },
  { id: "arms", label: "Arms", unit: "in", down: false },
  { id: "chest", label: "Chest", unit: "in", down: false },
  { id: "biceps", label: "Biceps", unit: "in", down: false },
  { id: "calves", label: "Calves", unit: "in", down: false },
  { id: "thighs", label: "Thighs", unit: "in", down: false },
];

/* Optional readings from a gym scale (BIA) or a DEXA scan. These override
   the tape estimate when present. BIA in particular swings with hydration,
   so consistency of machine and conditions matters more than the number. */
const COMPOSITION = [
  { id: "bf_measured", label: "Body fat", unit: "%", down: true, hint: "From your gym scale or a scan" },
  { id: "lean_measured", label: "Lean / muscle mass", unit: "lb", down: false, hint: "If your scale reports it" },
];

/* Raw, self-reported recovery inputs. Deliberately three simple numbers
   rather than a device's blended "recovery score" — the raw values are
   more trustworthy and work for everyone, whatever they wear. */
const RECOVERY = [
  { id: "sleep_hrs", label: "Sleep", unit: "hrs/night avg", down: false, hint: "Your rough average this week" },
  { id: "rhr", label: "Resting heart rate", unit: "bpm", down: true, hint: "First thing in the morning" },
  { id: "steps", label: "Daily steps", unit: "avg/day", down: false, hint: "From your phone or watch" },
];

export default function CheckinView({ profile, checkins, photos = [], logs = [], plan = null }: { profile: any; checkins: any[]; photos?: any[]; logs?: any[]; plan?: any }) {
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

  const doneCount = logs.filter((l: any) => l.done).length;
  const scheduled = logs.filter((l: any) => l.done || l.day_mode !== "rest").length;
  const adherencePct = scheduled > 0 ? Math.round((doneCount / scheduled) * 100) : null;
  const review = buildReview(
    Object.values(rows).map((r: any) => ({ week: r.week, metrics: r.metrics || {}, feel: r.feel })),
    profile?.goal_type, adherencePct
  );

  const prevWeekRow = (() => { for (let k = wk - 1; k >= 0; k--) if (rows[k]?.metrics) return rows[k]; return null; })();
  const comp = bodyCompFor(cur.metrics || {}, profile);
  const prevComp = prevWeekRow ? bodyCompFor(prevWeekRow.metrics || {}, profile) : null;
  const leanNote = prevComp ? leanMassCheck(prevComp, comp) : null;
  const projection = projectToTarget({
    currentWeightLb: parseFloat(cur.metrics?.weight ?? "") || null,
    currentBfPct: comp.bodyFatPct,
    targetBfPct: parseFloat(profile?.target_body_fat ?? "") || null,
    targetDate: profile?.target_date,
  });

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

      <div className="card" style={{ borderTop: "3px solid var(--accent)" }}>
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
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <span className="eyebrow">Body composition <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>— optional</span></span>
          <p className="muted" style={{ fontSize: 11.5, margin: "6px 0 12px" }}>
            Leave blank and we&apos;ll estimate from your waist and neck. If your gym scale or a scan gives you a
            figure, enter it here and it takes priority.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
            {COMPOSITION.map((m) => (
              <div key={m.id} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{m.label} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({m.unit})</span></label>
                <input className="inp mono" inputMode="decimal" placeholder="—"
                  value={cur.metrics?.[m.id] ?? ""} onChange={(e) => setMetric(m.id, e.target.value)} />
                <span className="muted" style={{ fontSize: 10.5 }}>{m.hint}</span>
              </div>
            ))}
          </div>

          {comp.bodyFatPct !== null && (
            <div style={{ background: "#141a2b", border: "1px solid var(--line)", borderRadius: 9, padding: "12px 14px", marginTop: 12 }}>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "baseline" }}>
                <span><span className="mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--accent)" }}>{comp.bodyFatPct}%</span>
                  <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>body fat · {bfBand(comp.bodyFatPct, profile?.sex)}</span></span>
                {comp.leanMassLb !== null && <span className="mono" style={{ fontSize: 13, color: "var(--text)" }}>{comp.leanMassLb} lb lean</span>}
                {comp.fatMassLb !== null && <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>{comp.fatMassLb} lb fat</span>}
              </div>
              <p className="muted" style={{ fontSize: 11, margin: "8px 0 0" }}>{comp.note} Track the trend, not the exact figure.</p>
              {leanNote && <p style={{ fontSize: 12.5, margin: "8px 0 0", color: leanNote.startsWith("Lean mass is up") ? "var(--green)" : "var(--warn)" }}>{leanNote}</p>}
              {projection.ok && projection.verdict && (
                <p style={{ fontSize: 12.5, margin: "8px 0 0", color: projection.realistic ? "#c9cfe0" : "var(--warn)", lineHeight: 1.55 }}>{projection.verdict}</p>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <span className="eyebrow">Sleep &amp; activity <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>— optional</span></span>
          <p className="muted" style={{ fontSize: 11.5, margin: "6px 0 12px" }}>
            Three numbers worth more than any device&apos;s recovery score. Read them off your watch or phone if you have one.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
            {RECOVERY.map((m) => {
              const v = cur.metrics?.[m.id] ?? "";
              const prev = prevWeek ? parseFloat(prevWeek.metrics?.[m.id]) : NaN;
              const now = parseFloat(v);
              const delta = Number.isFinite(prev) && Number.isFinite(now) ? +(now - prev).toFixed(1) : null;
              return (
                <div key={m.id} className="field" style={{ marginBottom: 0 }}>
                  <label className="label">{m.label} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({m.unit})</span></label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input className="inp mono" inputMode="decimal" placeholder="—" value={v}
                      onChange={(e) => setMetric(m.id, e.target.value)} />
                    {delta !== null && delta !== 0 && (
                      <span className="mono" style={{ position: "absolute", right: 10, fontSize: 12, fontWeight: 600,
                        color: (m.down ? delta < 0 : delta > 0) ? "var(--green)" : "var(--warn)", pointerEvents: "none" }}>
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    )}
                  </div>
                  <span className="muted" style={{ fontSize: 10.5 }}>{m.hint}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="field" style={{ marginTop: 18, marginBottom: 0 }}>
          <label className="label">How did the plan feel this week?</label>
          <textarea className="inp" rows={3} value={cur.feel ?? ""} onChange={(e) => save(cur.metrics || {}, e.target.value)}
            placeholder="Energy, recovery, joints, what was too easy or too hard, travel disruptions…" />
        </div>
      </div>

      <ReviewCard review={review} />

      <ProgressPhotos week={wk} rows={photos.filter((p: any) => true)} />

      <DoctorSummary
        profile={profile}
        checkins={Object.values(rows) as any[]}
        plan={plan}
        adherencePct={adherencePct}
        sessionsDone={doneCount}
      />
    </div>
  );
}
