"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LAPSE_OPTIONS } from "@/lib/travel";

/* Shown when the app notices a gap. Tone matters more than mechanics here:
   shame is what converts a lapse into quitting, so this asks rather than
   accuses, and every answer leads to a smaller plan rather than a debt. */

export default function LapseCheckIn({ gapDays, onDone }: { gapDays: number; onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const answer = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/lapse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option: id, gapDays }),
      });
      const d = await res.json();
      setResult(d.message || "Your plan has been adjusted.");
      router.refresh();
      onDone?.();
    } catch {
      setResult("Couldn't save that, but don't let it stop you — today's session is still there.");
    }
    setBusy("");
  };

  if (dismissed) return null;

  return (
    <div className="card" style={{ borderLeft: "3px solid var(--accent)", marginBottom: 16 }}>
      {result ? (
        <>
          <h2 style={{ marginBottom: 6 }}>Sorted</h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{result}</p>
          <button className="btn" style={{ marginTop: 14 }} onClick={() => setDismissed(true)}>Got it</button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span className="eyebrow">Checking in</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{gapDays} days since your last entry</span>
          </div>
          <h2 style={{ margin: "10px 0 6px" }}>
            {gapDays >= 5 ? "It's been a little while" : "Two quiet days"}
          </h2>
          <p className="muted" style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.6 }}>
            Not a telling-off — gaps are part of every programme, and the plan is supposed to bend around your life
            rather than the other way round. Tell me what&apos;s going on and I&apos;ll reshape the next few days so
            you land something rather than nothing.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LAPSE_OPTIONS.map((o) => (
              <button key={o.id} className="btn ghost" disabled={!!busy}
                onClick={() => answer(o.id)}
                style={{ textAlign: "left", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{o.label}</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {busy === o.id ? "…" : o.days > 0 ? `eases ${o.days}d` : "no change"}
                </span>
              </button>
            ))}
          </div>

          <button onClick={() => setDismissed(true)}
            style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", marginTop: 12, padding: 0 }}>
            Not now
          </button>
        </>
      )}
    </div>
  );
}
