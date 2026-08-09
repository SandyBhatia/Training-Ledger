"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  // Supabase puts the recovery token in the URL; the client picks it up and
  // establishes a temporary session that allows updateUser().
  useEffect(() => {
    const supabase = createClient();
    const check = async () => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const errDesc = params.get("error_description");
      if (errDesc) { setErr(errDesc); setReady(true); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) { setValid(true); setReady(true); return; }

      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (s) { setValid(true); setReady(true); }
      });
      setTimeout(() => { setReady(true); sub.subscription.unsubscribe(); }, 2500);
    };
    check();
  }, []);

  async function save() {
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setErr("The two passwords don't match."); return; }
    setBusy(true); setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
    setTimeout(() => { router.push("/"); router.refresh(); }, 1400);
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="eyebrow">Training Ledger</div>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30 }}>Set a new password</h1>

      {!ready ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}><span className="spinner" /> Checking your link…</p></div>
      ) : done ? (
        <div className="card"><p style={{ margin: 0, color: "#8fcea8" }}>Password updated. Taking you in…</p></div>
      ) : !valid ? (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            {err || "This reset link is invalid or has expired. Reset links are single-use and last about an hour."}
          </p>
          <Link href="/forgot"><button className="btn">Request a new link</button></Link>
        </div>
      ) : (
        <div className="card">
          <div className="field">
            <label className="label" htmlFor="pw">New password</label>
            <input id="pw" className="inp" type="password" placeholder="At least 6 characters" suppressHydrationWarning
              value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="pw2">Confirm password</label>
            <input id="pw2" className="inp" type="password" suppressHydrationWarning
              value={pw2} onChange={(e) => setPw2(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
          </div>
          {err && <p className="muted" style={{ color: "#e0a3a3" }}>{err}</p>}
          <button className="btn" style={{ width: "100%" }} onClick={save} disabled={busy || !pw || !pw2}>
            {busy ? "Saving…" : "Update password"}
          </button>
        </div>
      )}
    </div>
  );
}
