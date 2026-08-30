"use client";
import type { Review } from "@/lib/review";

export default function ReviewCard({ review }: { review: Review }) {
  if (!review.ready) {
    return (
      <div className="card" style={{ marginTop: 14, borderLeft: "3px solid var(--line)" }}>
        <span className="eyebrow">Bi-weekly review</span>
        <p className="muted" style={{ margin: "8px 0 0" }}>{review.reason}</p>
        <NotePatterns flags={review.noteFlags} />
      </div>
    );
  }
  const colour = review.tone === "good" ? "var(--green)" : review.tone === "adjust" ? "var(--warn)" : "var(--accent)";
  return (
    <div className="card" style={{ marginTop: 14, borderLeft: `3px solid ${colour}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span className="eyebrow">Bi-weekly review</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          {review.fromWeek === 0 ? "baseline" : `week ${review.fromWeek}`} → week {review.toWeek}
        </span>
      </div>

      <h2 style={{ margin: "10px 0 8px", color: colour }}>
        {review.doNothing && <span style={{ marginRight: 8 }}>✓</span>}{review.headline}
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>{review.verdict}</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {review.waistChange !== null && (
          <Metric label="Waist" value={`${review.waistChange > 0 ? "+" : ""}${review.waistChange} in`} good={review.waistChange < 0} />
        )}
        {review.weightChange !== null && (
          <Metric label="Weight" value={`${review.weightChange > 0 ? "+" : ""}${review.weightChange} lb`} />
        )}
        {review.adherencePct !== null && (
          <Metric label="Adherence" value={`${review.adherencePct}%`} good={review.adherencePct >= 80} />
        )}
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>What to do</div>
      <ul style={{ paddingLeft: 18, margin: 0, color: colour, display: "flex", flexDirection: "column", gap: 7 }}>
        {review.actions.map((a, i) => (
          <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55, color: "#c9cfe0" }}>{a}</li>
        ))}
      </ul>

      <NotePatterns flags={review.noteFlags} />

      <p className="muted" style={{ fontSize: 11, marginTop: 14, marginBottom: 0 }}>
        These suggestions come from your measurements and session history, not from your photos — numbers are the
        reliable signal at this timescale. General guidance, not medical advice.
      </p>
    </div>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <span style={{ background: "#141a2b", border: "1px solid var(--line)", borderRadius: 9, padding: "8px 12px" }}>
      <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
      <span className="mono" style={{ display: "block", fontSize: 15, fontWeight: 600, marginTop: 2,
        color: good === undefined ? "var(--text)" : good ? "var(--green)" : "var(--warn)" }}>{value}</span>
    </span>
  );
}


function NotePatterns({ flags }: { flags: { theme: string; weeks: number[]; message: string }[] }) {
  if (!flags?.length) return null;
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Patterns in your own notes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {flags.map((f) => (
          <div key={f.theme} style={{ background: "#141a2b", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
              <strong style={{ fontSize: 13 }}>{f.theme}</strong>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                mentioned {f.weeks.length}× · {f.weeks.map((w) => (w === 0 ? "base" : `w${w}`)).join(", ")}
              </span>
            </div>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5 }}>{f.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
