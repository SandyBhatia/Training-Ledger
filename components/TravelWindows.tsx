"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDate } from "@/lib/schedule";

export default function TravelWindows({ windows }: { windows: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10));
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    await fetch("/api/travel", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_date: start, end_date: end, label: label || "Travel" }),
    });
    setBusy(false); setOpen(false); setLabel("");
    router.refresh();
  };
  const remove = async (id: string) => {
    await fetch("/api/travel", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  const upcoming = [...windows].sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2 style={{ marginBottom: 6 }}>Travel</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Tell the app when you&apos;re away and those days switch to short hotel-room sessions automatically. Your
        programme keeps its sequence — nothing is lost and nothing counts against you.
      </p>

      {upcoming.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
          {upcoming.map((w) => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10,
              background: "#141a2b", border: "1px solid var(--line)", borderRadius: 9, padding: "9px 12px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{w.label || "Travel"}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {fmtDate(new Date(w.start_date + "T00:00:00"))} – {fmtDate(new Date(w.end_date + "T00:00:00"))}
                </div>
              </div>
              <button onClick={() => remove(w.id)} aria-label="Remove"
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 18, cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {!open ? (
        <button className="btn ghost" onClick={() => setOpen(true)}>+ Add a trip</button>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field"><label className="label">From</label>
              <input className="inp" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="field"><label className="label">To</label>
              <input className="inp" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div className="field"><label className="label">Label (optional)</label>
            <input className="inp" placeholder="e.g. Chicago client visit" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={add} disabled={busy || end < start}>{busy ? "Saving…" : "Add trip"}</button>
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
