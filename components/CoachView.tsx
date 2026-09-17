"use client";
import { useState, useRef, useEffect } from "react";

type Msg = { id?: string; role: string; content: string };

const STARTERS = [
  "What should I do today?",
  "I'm travelling — what can I do in a hotel room?",
  "I slept badly. Should I still train?",
  "Is my nutrition on track?",
];

export default function CoachView({ initial, name }: { initial: Msg[]; name: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput(""); setErr(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", content }]);
    try {
      const res = await fetch("/api/coach", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: content }),
      });
      const raw = await res.text();
      let d: any;
      try { d = JSON.parse(raw); }
      catch { setErr(res.status === 504 ? "That took too long. Try a shorter question." : `Server error ${res.status}.`); setBusy(false); return; }
      if (d.error) { setErr(d.detail ? `${d.error}: ${d.detail}` : "Something went wrong."); setBusy(false); return; }
      setMsgs((m) => [...m, { role: "assistant", content: d.reply }]);
    } catch {
      setErr("Couldn't reach the coach. Check your connection and try again.");
    }
    setBusy(false);
  };

  const clear = async () => {
    if (!confirm("Clear the whole conversation? Your coach loses this history.")) return;
    await fetch("/api/coach", { method: "DELETE" });
    setMsgs([]);
  };

  return (
    <div className="container" style={{ maxWidth: 680, display: "flex", flexDirection: "column", minHeight: "70vh" }}>
      {msgs.length === 0 && (
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontFamily: "Fraunces, serif" }}>Your coach</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            {name ? `${name}, this` : "This"} coach knows your plan, your logged sessions, your measurements and your
            notes — so you don&apos;t have to explain yourself. Ask about today&apos;s session, a hotel gym, a bad
            night&apos;s sleep, or whether something is working.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {STARTERS.map((s) => (
              <button key={s} className="btn ghost" style={{ textAlign: "left", fontSize: 13.5 }} onClick={() => send(s)}>{s}</button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 11, marginTop: 18 }}>
            General wellbeing guidance, not medical advice. It won&apos;t interpret test results or advise on
            medication — that&apos;s your doctor&apos;s job.
          </p>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={m.id || i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <div style={{
              background: m.role === "user" ? "var(--fill)" : "var(--panel)",
              color: m.role === "user" ? "var(--ink-on-accent)" : "var(--text)",
              border: m.role === "user" ? "none" : "1px solid var(--line)",
              borderRadius: 12, padding: "11px 14px", fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 14px" }}>
              <span className="spinner" /> <span className="muted" style={{ fontSize: 13 }}>thinking…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {err && <p className="muted" style={{ color: "#e0a3a3", fontSize: 12.5 }}>{err}</p>}

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", paddingTop: 12, paddingBottom: 6, marginTop: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea className="inp" rows={1} placeholder="Ask your coach…" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ resize: "none", minHeight: 44 }} />
          <button className="btn" onClick={() => send()} disabled={busy || !input.trim()}>Send</button>
        </div>
        {msgs.length > 0 && (
          <button onClick={clear} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11.5, cursor: "pointer", marginTop: 8, padding: 0 }}>
            Clear conversation
          </button>
        )}
      </div>
    </div>
  );
}
