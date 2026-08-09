"use client";
import Link from "next/link";
import { resolveDay, todayIndex, keyOf, fmtDate, DOW_LABELS, type DayModes } from "@/lib/schedule";

type Log = { log_date: string; done: boolean; day_mode: string | null };

export default function DashboardView({ profile, plan, logs, checkins }: {
  profile: any; plan: any; logs: Log[]; checkins: any[];
}) {
  if (!plan) {
    return (
      <div className="container">
        <div className="card"><p className="muted" style={{ margin: 0 }}>No active plan yet. <Link href="/onboarding">Create one →</Link></p></div>
      </div>
    );
  }

  const start = new Date((plan.start_date || new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const restDow = profile?.rest_dow ?? 0;
  const split = plan.workout?.split || [];
  const perWeek = plan.workout?.days_per_week || profile?.days_per_week || 5;
  const weeks = plan.weeks || 12;
  const totalDays = weeks * 7;

  const modes: DayModes = {};
  const doneBy: Record<string, boolean> = {};
  logs.forEach((l) => {
    if (l.day_mode) modes[l.log_date] = l.day_mode as "rest" | "work";
    if (l.done) doneBy[l.log_date] = true;
  });

  const tIdx = todayIndex(start);
  const all = Array.from({ length: totalDays }, (_, i) => resolveDay(start, i, restDow, modes, split.length, perWeek));
  const sessions = all.filter((d) => d.isWorkout);
  const totalSessions = weeks * perWeek;
  const completed = sessions.filter((d) => doneBy[d.key]).length;
  const scheduled = sessions.filter((d) => d.i <= tIdx).length;
  const doneToDate = sessions.filter((d) => d.i <= tIdx && doneBy[d.key]).length;
  const pct = Math.round((completed / Math.max(1, totalSessions)) * 100);
  const adherence = scheduled ? Math.round((doneToDate / scheduled) * 100) : 0;

  const todayRes = tIdx >= 0 && tIdx < totalDays ? all[tIdx] : null;
  const phases = plan.workout?.phases || [];
  const curWeek = todayRes ? todayRes.week : 0;
  const phase = phases.find((p: any) => p.week === curWeek + 1) || phases[Math.min(phases.length - 1, curWeek)] || null;

  const metricSeries = (id: string) =>
    checkins.map((c) => ({ wk: c.week, v: Number(c.metrics?.[id]) })).filter((x) => Number.isFinite(x.v));

  return (
    <div className="container">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        <Stat big={tIdx >= 0 ? String(Math.min(totalDays, tIdx + 1)) : "—"} den={`/ ${totalDays}`} label={tIdx >= 0 ? "day of the plan" : `starts ${fmtDate(start)}`} />
        <Stat big={String(completed)} den={`/ ${totalSessions}`} label="sessions logged" />
        <Stat big={String(pct)} den="%" label="complete" />
      </div>

      {phase && (
        <div className="card" style={{ borderLeft: "3px solid var(--accent)", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <span className="eyebrow">Week {curWeek + 1} · {phase.name}</span>
            <span className="mono" style={{ fontSize: 11.5, color: phase.deload ? "var(--blue)" : "var(--accent)" }}>{phase.rpe}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "#c9cfe0" }}>{phase.note}</div>
        </div>
      )}

      {scheduled > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span className="eyebrow">Adherence</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{doneToDate}/{scheduled} · {adherence}%</span>
          </div>
          <div style={{ height: 8, background: "#141a2b", border: "1px solid var(--line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${adherence}%`, background: "linear-gradient(90deg,var(--fill),var(--accent))" }} />
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <span className="eyebrow">The plan · all 7 days</span>
          <span className="muted" style={{ fontSize: 11 }}>gold = done · dashed = rest</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "28px repeat(7,1fr) 34px", gap: 4, marginBottom: 3 }}>
          <span />
          {[0, 1, 2, 3, 4, 5, 6].map((n) => {
            const d = new Date(start); d.setDate(d.getDate() + n);
            return <span key={n} className="mono" style={{ fontSize: 9, color: "#5f6889", textAlign: "center" }}>{DOW_LABELS[d.getDay()]}</span>;
          })}
          <span />
        </div>
        {Array.from({ length: weeks }, (_, w) => {
          const row = [0, 1, 2, 3, 4, 5, 6].map((d) => all[w * 7 + d]).filter(Boolean);
          const wDone = row.filter((r) => r.isWorkout && doneBy[r.key]).length;
          const wTotal = row.filter((r) => r.isWorkout).length;
          return (
            <div key={w} style={{ display: "grid", gridTemplateColumns: "28px repeat(7,1fr) 34px", gap: 4, alignItems: "center", marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>W{w + 1}</span>
              {row.map((r) => {
                const done = doneBy[r.key];
                const isToday = r.i === tIdx;
                const base: React.CSSProperties = {
                  aspectRatio: "1", borderRadius: 5, fontSize: 9, display: "grid", placeItems: "center",
                  border: "1px solid var(--line)", background: "#141a2b", color: "#5f6889",
                };
                if (!r.isWorkout) Object.assign(base, { borderStyle: "dashed", background: "transparent", opacity: 0.5 });
                if (done) Object.assign(base, { background: "var(--fill)", borderColor: "var(--fill)", color: "var(--ink-on-accent)" });
                if (isToday) Object.assign(base, { boxShadow: "inset 0 0 0 1px var(--accent)", borderColor: "var(--accent)" });
                if (!done && !isToday && r.i < tIdx && r.isWorkout) base.opacity = 0.4;
                const title = r.isWorkout ? split[r.splitIndex!]?.title || "Session" : "Rest";
                return <div key={r.key} title={`${title} · ${fmtDate(r.date)}`} style={base}>{r.isWorkout ? title[0] : "·"}</div>;
              })}
              <span className="mono" style={{ fontSize: 9.5, textAlign: "right", color: wDone >= wTotal && wTotal > 0 ? "var(--accent)" : "var(--muted)" }}>{wDone}/{wTotal}</span>
            </div>
          );
        })}
      </div>

      {checkins.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <span className="eyebrow">Body trend</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
            {["weight", "waist"].map((id) => {
              const s = metricSeries(id);
              if (!s.length) return <div key={id} className="muted" style={{ fontSize: 12 }}>No {id} data yet</div>;
              const first = s[0].v, last = s[s.length - 1].v;
              const delta = +(last - first).toFixed(1);
              return (
                <div key={id} style={{ background: "#141a2b", border: "1px solid var(--line)", borderRadius: 9, padding: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{id === "weight" ? "Bodyweight" : "Waist"}</div>
                  <div className="mono" style={{ fontSize: 19, fontWeight: 600, marginTop: 4 }}>{last}</div>
                  <div className="mono" style={{ fontSize: 11.5, marginTop: 4, color: delta < 0 ? "var(--green)" : delta > 0 ? "#d0a24e" : "var(--muted)" }}>
                    {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : "no change"} since baseline
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Schedule</span>
          <div className="mono" style={{ fontSize: 13, marginTop: 6 }}>
            Day 1 · {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <Link href="/settings"><button className="btn ghost" style={{ fontSize: 12.5, padding: "8px 13px" }}>Change date / restart →</button></Link>
      </div>

      <div className="card">
        <span className="eyebrow">Your plan</span>
        <p style={{ fontSize: 14, lineHeight: 1.6, margin: "8px 0 0" }}>{plan.meta?.summary}</p>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>{plan.meta?.disclaimer}</p>
      </div>
    </div>
  );
}

function Stat({ big, den, label }: { big: string; den: string; label: string }) {
  return (
    <div className="card" style={{ padding: "14px 12px" }}>
      <div className="mono" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1 }}>
        {big}<span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 400 }}> {den}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 7 }}>{label}</div>
    </div>
  );
}
