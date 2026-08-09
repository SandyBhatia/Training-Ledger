"use client";
import { useState } from "react";
import { resolveDay, todayIndex, fmtDate, type DayModes } from "@/lib/schedule";

export default function ProgramView({ profile, plan, logs }: { profile: any; plan: any; logs: any[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  if (!plan) return <div className="container"><div className="card"><p className="muted" style={{ margin: 0 }}>No plan yet.</p></div></div>;

  const start = new Date((plan.start_date || new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const restDow = profile?.rest_dow ?? 0;
  const split = plan.workout?.split || [];
  const perWeek = plan.workout?.days_per_week || 5;
  const weeks = plan.weeks || 12;
  const phases = plan.workout?.phases || [];

  const modes: DayModes = {};
  const doneBy: Record<string, boolean> = {};
  logs.forEach((l) => { if (l.day_mode) modes[l.log_date] = l.day_mode; if (l.done) doneBy[l.log_date] = true; });
  const tIdx = todayIndex(start);

  return (
    <div className="container">
      {Array.from({ length: weeks }, (_, w) => {
        const phase = phases.find((p: any) => p.week === w + 1) || phases[Math.min(phases.length - 1, w)];
        const days = [0, 1, 2, 3, 4, 5, 6].map((d) => resolveDay(start, w * 7 + d, restDow, modes, split.length, perWeek));
        const done = days.filter((d) => d.isWorkout && doneBy[d.key]).length;
        const total = days.filter((d) => d.isWorkout).length;
        return (
          <div key={w} style={{ marginBottom: 10 }}>
            <button className="card" onClick={() => setOpen((o) => ({ ...o, [w]: !o[w] }))}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: 12, cursor: "pointer", color: "var(--text)", textAlign: "left" }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <strong style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>Week {w + 1}</strong>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{fmtDate(days[0].date)} – {fmtDate(days[6].date)}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {phase && <span className="mono" style={{ fontSize: 11, color: phase.deload ? "var(--blue)" : "var(--accent)",
                  border: `1px solid ${phase.deload ? "#7fb0d855" : "#c9a22755"}`, borderRadius: 5, padding: "3px 8px" }}>{phase.name}</span>}
                <span className="mono" style={{ fontSize: 12, color: done >= total && total > 0 ? "var(--accent)" : "var(--muted)" }}>{done}/{total}</span>
              </span>
            </button>
            {open[w] && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, padding: "10px 2px" }}>
                {days.map((d) => {
                  const tpl = d.isWorkout ? split[d.splitIndex!] : null;
                  return (
                    <div key={d.key} style={{ background: d.isWorkout ? "var(--panel2)" : "transparent",
                      border: `1px ${d.isWorkout ? "solid" : "dashed"} ${doneBy[d.key] ? "var(--accent)" : "var(--line)"}`,
                      borderRadius: 8, padding: "10px 12px", opacity: d.isWorkout ? 1 : 0.6,
                      boxShadow: d.i === tIdx ? "inset 0 0 0 1px var(--accent)" : undefined }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{d.date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                        <span className="mono" style={{ fontSize: 10, color: "#5f6889" }}>{fmtDate(d.date)}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{tpl?.title || "Rest"}</div>
                      {tpl?.focus && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{tpl.focus}</div>}
                      {doneBy[d.key] && <div style={{ color: "var(--accent)", fontSize: 12, marginTop: 4 }}>✓</div>}
                    </div>
                  );
                })}
              </div>
            )}
            {open[w] && phase && <p className="muted" style={{ fontSize: 12.5, padding: "0 4px 6px" }}>{phase.note}</p>}
          </div>
        );
      })}
    </div>
  );
}
