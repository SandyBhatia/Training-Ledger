"use client";
import { useState } from "react";
import { buildDoctorSummary } from "@/lib/doctorSummary";

export default function DoctorSummary(props: {
  profile: any; checkins: any[]; plan: any; adherencePct: number | null; sessionsDone: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = buildDoctorSummary(props);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard unavailable */ }
  };
  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `health-summary-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2 style={{ marginBottom: 6 }}>Prepare for a doctor&apos;s visit</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Turn what you&apos;ve recorded into an organised summary — conditions, medications, your measurement
        timeline, what you&apos;ve been doing, your own notes, and questions worth asking. Nothing here is a
        diagnosis; it&apos;s your data, laid out so the appointment is more useful.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn ghost" onClick={() => setOpen(!open)}>{open ? "Hide summary" : "Build my summary"}</button>
        {open && <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>}
        {open && <button className="btn ghost" onClick={download}>Download</button>}
      </div>

      {open && (
        <pre style={{
          marginTop: 14, background: "#141a2b", border: "1px solid var(--line)", borderRadius: 9,
          padding: "14px 16px", whiteSpace: "pre-wrap", wordBreak: "break-word",
          fontFamily: "IBM Plex Mono, ui-monospace, monospace", fontSize: 12, lineHeight: 1.65,
          color: "var(--text)", maxHeight: 460, overflow: "auto",
        }}>{text}</pre>
      )}
    </div>
  );
}
