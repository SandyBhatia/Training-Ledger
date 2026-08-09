"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const e = params.get("err");
    if (e) setErr(e);
  }, [params]);

  async function signIn() {
    if (!email.trim() || !password) return;
    setBusy(true); setErr(""); setNote("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.push("/"); router.refresh();
  }

  async function signUp() {
    if (!email.trim() || !password) return;
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true); setErr(""); setNote("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    if (data.session) { router.push("/"); router.refresh(); return; }
    setNote("Account created. If email confirmation is on, confirm it in Supabase (Authentication → Users) then sign in.");
  }

  async function sendLink() {
    if (!email.trim()) return;
    setBusy(true); setErr(""); setNote("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="eyebrow">Training Ledger</div>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30 }}>Sign in</h1>

      <div style={{ display: "flex", marginBottom: 16 }}>
        <button className="pill" data-on={mode === "password"} onClick={() => { setMode("password"); setErr(""); setSent(false); }}
          style={{ borderRadius: "7px 0 0 7px" }}>Password</button>
        <button className="pill" data-on={mode === "magic"} onClick={() => { setMode("magic"); setErr(""); }}
          style={{ borderRadius: "0 7px 7px 0", borderLeft: "none" }}>Email link</button>
      </div>

      {sent && mode === "magic" ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            Check your email — a sign-in link is on its way to <strong>{email}</strong>. Open it on this device.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="inp" type="email" placeholder="you@example.com" suppressHydrationWarning
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {mode === "password" && (
            <div className="field">
              <label className="label" htmlFor="pw">Password</label>
              <input id="pw" className="inp" type="password" placeholder="At least 6 characters" suppressHydrationWarning
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") signIn(); }} />
            </div>
          )}

          {err && <p className="muted" style={{ color: "#e0a3a3" }}>{err}</p>}
          {note && <p className="muted" style={{ color: "#8fcea8" }}>{note}</p>}

          {mode === "password" && (
            <p style={{ margin: "0 0 12px", fontSize: 12.5 }}>
              <Link href="/forgot">Forgot your password?</Link>
            </p>
          )}

          {mode === "password" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" style={{ flex: 1 }} onClick={signIn} disabled={busy || !email.trim() || !password}>
                {busy ? "…" : "Sign in"}
              </button>
              <button className="btn ghost" onClick={signUp} disabled={busy || !email.trim() || !password}>
                Create account
              </button>
            </div>
          ) : (
            <button className="btn" style={{ width: "100%" }} onClick={sendLink} disabled={busy || !email.trim()}>
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
          )}

          <p className="muted" style={{ marginTop: 14, fontSize: 11.5 }}>
            {mode === "password"
              ? "First time? Enter an email and password, then press Create account. Everyone gets their own private account — your health data is never visible to other users."
              : "Note: Supabase's built-in email is rate-limited to a few messages an hour. Password sign-in avoids that."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container" style={{ maxWidth: 420, paddingTop: 80 }}><p className="muted">Loading…</p></div>}>
      <LoginInner />
    </Suspense>
  );
}
