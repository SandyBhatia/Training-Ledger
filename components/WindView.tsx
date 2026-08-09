"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { keyOf } from "@/lib/schedule";

const PACE = { in: 4, out: 6 };
const STEPS = [
  { id: "nadi", name: "Nadi Shodhana", dur: "~4 min", how: "Alternate-nostril: thumb closes the right, ring finger the left. Inhale left, exhale right, inhale right, exhale left. Slow and even." },
  { id: "bhramari", name: "Bhramari", dur: "~3 min", how: "Humming bee breath — inhale, then hum a low steady sound through the whole exhale. The vibration does the calming." },
  { id: "exhale", name: "Extended exhale (use the pacer)", dur: "~3 min", how: "Follow the circle: in for 4, out for 6. A longer out-breath switches on rest-and-digest." },
];
const ANCHORS = [
  { id: "screens", t: "Screens off or dimmed ~30 min before bed" },
  { id: "cool", t: "Room cool and dark, phone across the room" },
  { id: "tea", t: "Herbal tea (easy on any honey)" },
  { id: "time", t: "Same sleep and wake time as yesterday" },
];

export default function WindView({ rows }: { rows: any[] }) {
  const supabase = createClient();
  const today = keyOf(new Date());
  const [items, setItems] = useState<Record<string, boolean>>(() => rows.find((r) => r.log_date === today)?.items || {});
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => {
      setPhase((p) => { if (p === "out") setCycles((c) => c + 1); return p === "in" ? "out" : "in"; });
    }, (phase === "in" ? PACE.in : PACE.out) * 1000);
    return () => clearTimeout(id);
  }, [running, phase]);

  const toggle = async (id: string) => {
    const next = { ...items, [id]: !items[id] };
    setItems(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("wind_down").upsert(
        { user_id: user.id, log_date: today, items: next, updated_at: new Date().toISOString() },
        { onConflict: "user_id,log_date" }
      );
    }
  };

  const streak = (() => {
    const done = (k: string) => { const r = rows.find((x) => x.log_date === k); return !!r && STEPS.some((s) => r.items?.[s.id]); };
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (!done(keyOf(d)) && !STEPS.some((s) => items[s.id])) d.setDate(d.getDate() - 1);
    let n = 0;
    while (done(keyOf(d)) || (keyOf(d) === today && STEPS.some((s) => items[s.id]))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  })();

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
        <div>
          <h1 style={{ fontFamily: "Fraunces, serif" }}>Wind-down</h1>
          <p className="muted" style={{ margin: 0 }}>A ten-minute glide into sleep.</p>
        </div>
        {streak > 0 && <span className="mono" style={{ fontSize: 12, color: "var(--accent)", border: "1px solid #c9a22755", borderRadius: 99, padding: "5px 11px" }}>{streak}-night streak</span>}
      </div>

      <div style={{ position: "relative", height: 200, display: "grid", placeItems: "center", overflow: "hidden", margin: "10px 0" }}>
        <div style={{ position: "absolute", width: 110, height: 110, borderRadius: "50%",
          background: "radial-gradient(circle,#212a44,#141a2b)", border: "2px solid var(--accent)",
          transform: `scale(${running ? (phase === "in" ? 1.7 : 1) : 1})`,
          transition: `transform ${running ? (phase === "in" ? PACE.in : PACE.out) : 0.4}s ease-in-out` }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>{running ? (phase === "in" ? "Breathe in" : "Breathe out") : "Ready"}</div>
          <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
            {running ? (phase === "in" ? `${PACE.in}s` : `${PACE.out}s · slow and long`) : "inhale 4 · exhale 6"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <button className="btn" onClick={() => { if (!running) { setPhase("in"); setCycles(0); } setRunning(!running); }}>
          {running ? "Pause" : "Begin"}
        </button>
        <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>{cycles} breath{cycles === 1 ? "" : "s"}</span>
      </div>
      <p className="muted" style={{ textAlign: "center", fontSize: 11.5, marginBottom: 22 }}>
        Keep it gentle — no forced breath-holds.
      </p>

      <span className="eyebrow">Tonight&apos;s breathing</span>
      <div style={{ marginTop: 10, marginBottom: 22 }}>
        {STEPS.map((s) => (
          <div key={s.id} style={{ display: "flex", gap: 11, alignItems: "flex-start", background: items[s.id] ? "#20263c" : "var(--panel)",
            border: `1px solid ${items[s.id] ? "var(--accent)" : "var(--line)"}`, borderRadius: 9, padding: "11px 12px", marginBottom: 8 }}>
            <Check on={!!items[s.id]} onClick={() => toggle(s.id)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{s.name} <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 400 }}>{s.dur}</span></div>
              <div style={{ fontSize: 12.5, color: "#aab2c8", lineHeight: 1.5, marginTop: 4 }}>{s.how}</div>
            </div>
          </div>
        ))}
      </div>

      <span className="eyebrow">Sleep anchors</span>
      <div style={{ marginTop: 10, marginBottom: 22 }}>
        {ANCHORS.map((a) => (
          <div key={a.id} style={{ display: "flex", gap: 11, alignItems: "center", background: "var(--panel)",
            border: "1px solid var(--line)", borderRadius: 9, padding: "11px 12px", marginBottom: 7 }}>
            <Check on={!!items[a.id]} onClick={() => toggle(a.id)} />
            <span style={{ fontSize: 13.5, color: "#d3d8e6" }}>{a.t}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ borderLeft: "3px solid var(--accent)" }}>
        <span className="eyebrow">Daytime habits that protect sleep</span>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          Bright light in the morning, no caffeine after about 2pm, train earlier rather than late, keep alcohol light.
          And the big one: if poor sleep has run for months, get bloodwork and a sleep-apnea screen — a wind-down helps
          you fall asleep, but it can&apos;t fix a physiological cause.
        </p>
      </div>
    </div>
  );
}

function Check({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      style={{ width: 24, height: 24, flex: "none", borderRadius: 6, cursor: "pointer",
        border: `1.5px solid ${on ? "var(--accent)" : "#3a4468"}`, background: on ? "var(--accent)" : "transparent",
        color: "var(--ink-on-accent)", fontWeight: 700, fontSize: 13, display: "grid", placeItems: "center" }}>
      {on ? "✓" : ""}
    </button>
  );
}
