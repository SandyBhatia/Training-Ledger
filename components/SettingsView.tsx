"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsView({ profile, plan, logCount }: { profile: any; plan: any; logCount: number }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(plan?.start_date || "");
  const [restDow, setRestDow] = useState<number>(profile?.rest_dow ?? 0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // password change
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const changePassword = async () => {
    setPwErr(""); setPwMsg("");
    if (pw.length < 6) { setPwErr("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setPwErr("The two passwords don't match."); return; }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setPwErr(error.message);
    else { setPwMsg("Password updated."); setPw(""); setPw2(""); setPwOpen(false); }
  };

  // restart flow
  const [restarting, setRestarting] = useState(false);
  const [newStart, setNewStart] = useState(new Date().toISOString().slice(0, 10));
  const [clearLogs, setClearLogs] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const post = async (body: any, okMsg: string) => {
    setBusy(true); setErr(""); setMsg("");
    try {
      const res = await fetch("/api/plan-settings", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.error) setErr(d.detail || d.error);
      else { setMsg(okMsg); router.refresh(); }
    } catch { setErr("Network error."); }
    setBusy(false);
  };

  const saveDates = () => post({ start_date: startDate, rest_dow: restDow }, "Saved. Your calendar has shifted to the new dates.");
  const doRestart = () => {
    post({ start_date: newStart, clear_logs: clearLogs },
      clearLogs ? "Programme restarted. Day 1 is your new start date and previous logs are cleared."
                : "Programme restarted on the new date. Your previous logs were kept.");
    setRestarting(false); setConfirmed(false);
  };

  if (!plan) {
    return <div className="container"><div className="card"><p className="muted" style={{ margin: 0 }}>No active plan. <Link href="/onboarding">Create one →</Link></p></div></div>;
  }

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <h1 style={{ fontFamily: "Fraunces, serif" }}>Settings</h1>

      {msg && <div className="card" style={{ borderLeft: "3px solid var(--green)", marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13.5, color: "#8fcea8" }}>{msg}</p></div>}
      {err && <div className="card" style={{ borderLeft: "3px solid #e0a3a3", marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13.5, color: "#e0a3a3" }}>{err}</p></div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <h2>Schedule</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 14 }}>
          Moving the start date shifts every session in the calendar. Your logged history stays attached to the dates you trained.
        </p>
        <div className="field">
          <label className="label">Start date (Day 1)</label>
          <input className="inp" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Default rest day</label>
          <select className="inp" value={restDow} onChange={(e) => setRestDow(Number(e.target.value))}>
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <button className="btn" onClick={saveDates} disabled={busy || !startDate}>{busy ? "Saving…" : "Save schedule"}</button>
      </div>

      <div className="card" style={{ borderLeft: "3px solid #e6b877" }}>
        <h2>Restart the programme</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Begin the same 12-week plan again from a date you choose — useful after travel, illness, or a long break.
          You currently have <strong>{logCount}</strong> logged {logCount === 1 ? "day" : "days"}.
        </p>

        {!restarting ? (
          <button className="btn ghost" onClick={() => setRestarting(true)}>↻ Restart programme…</button>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div className="field">
              <label className="label">New start date</label>
              <input className="inp" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <label style={{ display: "flex", gap: 9, alignItems: "flex-start", cursor: "pointer", marginBottom: 12 }}>
              <input type="checkbox" checked={clearLogs} onChange={(e) => { setClearLogs(e.target.checked); setConfirmed(false); }}
                style={{ marginTop: 3, accentColor: "var(--gold)" }} />
              <span style={{ fontSize: 13.5 }}>
                Clear my logged progress
                <span className="muted" style={{ display: "block", fontSize: 11.5, marginTop: 2 }}>
                  {clearLogs
                    ? `Deletes all ${logCount} logged days — completed sessions, weights, and notes. This can't be undone.`
                    : "Keeps your history. Old logs stay on their original dates."}
                </span>
              </span>
            </label>

            {clearLogs && logCount > 0 && !confirmed ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#e6b877" }}>Delete {logCount} logged days permanently?</span>
                <button className="btn ghost" style={{ color: "#e0a3a3", borderColor: "#7a3a4d" }} onClick={() => setConfirmed(true)}>Yes, I&apos;m sure</button>
                <button className="btn ghost" onClick={() => setRestarting(false)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn" onClick={doRestart} disabled={busy || !newStart}>{busy ? "Restarting…" : "Restart programme"}</button>
                <button className="btn ghost" onClick={() => { setRestarting(false); setConfirmed(false); }}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Account</h2>
        {pwMsg && <p style={{ fontSize: 13.5, color: "#8fcea8", marginTop: 0 }}>{pwMsg}</p>}
        {!pwOpen ? (
          <button className="btn ghost" onClick={() => setPwOpen(true)}>Change password</button>
        ) : (
          <div>
            <div className="field">
              <label className="label">New password</label>
              <input className="inp" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="field">
              <label className="label">Confirm password</label>
              <input className="inp" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
            {pwErr && <p className="muted" style={{ color: "#e0a3a3" }}>{pwErr}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={changePassword} disabled={busy || !pw || !pw2}>Update password</button>
              <button className="btn ghost" onClick={() => { setPwOpen(false); setPwErr(""); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>New plan</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Changed goals, conditions, or training days? Generating a new plan replaces the current one. Your measurements and food log are kept.
        </p>
        <Link href="/onboarding"><button className="btn ghost">Build a new plan →</button></Link>
      </div>
    </div>
  );
}
