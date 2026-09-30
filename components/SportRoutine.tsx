"use client";
import { useState } from "react";
import { sportById } from "@/lib/sports";
import { demoUrl } from "@/lib/schedule";

/* Runs every day, including rest days — that's deliberate. Mobility responds
   to frequency, and a rest day is the easiest day to actually do it. */

export default function SportRoutine({
  sportId, dayKey, done, onToggle,
}: { sportId?: string | null; dayKey: string; done: Record<string, boolean>; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const sport = sportById(sportId);
  if (!sport) return null;

  const total = sport.moves.length;
  const complete = sport.moves.filter((m) => done[m.name]).length;
  const allDone = complete === total;

  return (
    <div className="card" style={{ marginTop: 16, borderLeft: `3px solid ${allDone ? "var(--green)" : "var(--accent)"}` }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", background: "transparent", border: "none", color: "var(--text)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left", padding: 0 }}>
        <span>
          <span className="eyebrow">Daily mobility · {sport.label}</span>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, marginTop: 4 }}>
            {allDone ? "Done for today ✓" : `${sport.minutes} minutes`}
          </div>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 12, color: allDone ? "var(--green)" : "var(--muted)" }}>{complete}/{total}</span>
          <span style={{ fontSize: 18, color: "var(--muted)", transform: open ? "rotate(90deg)" : "none" }}>›</span>
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: 0 }}>{sport.focus}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {sport.moves.map((m) => {
              const on = !!done[m.name];
              return (
                <div key={m.name} style={{ display: "flex", gap: 10, alignItems: "flex-start",
                  background: on ? "#1b2a24" : "var(--panel2)", border: `1px solid ${on ? "var(--green)" : "var(--line)"}`,
                  borderRadius: 9, padding: "10px 12px" }}>
                  <button onClick={() => onToggle(m.name)} aria-pressed={on}
                    style={{ width: 22, height: 22, flex: "none", borderRadius: 6, cursor: "pointer", marginTop: 1,
                      border: `1.5px solid ${on ? "var(--green)" : "#3a4468"}`, background: on ? "var(--green)" : "transparent",
                      color: "#06170e", fontWeight: 700, fontSize: 12, display: "grid", placeItems: "center" }}>
                    {on ? "✓" : ""}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{m.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{m.dose}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>{m.cue}</div>
                    <a href={demoUrl(m.name)} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, fontWeight: 600, display: "inline-block", marginTop: 5 }}>▶ watch demo</a>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="muted" style={{ fontSize: 11, marginTop: 12, marginBottom: 0 }}>
            Runs every day, rest days included. Stop short of pain — mobility work should feel like range, not strain.
          </p>
        </div>
      )}
    </div>
  );
}
