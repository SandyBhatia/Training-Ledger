"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function send() {
    if (!email.trim()) return;
    setBusy(true); setErr("");
    const supabase = createClient();
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${base}/reset`,
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="eyebrow">Training Ledger</div>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30 }}>Reset password</h1>

      {sent ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Open it on this device —
            the link is single-use and expires after about an hour.
          </p>
          <p style={{ marginTop: 14 }}><Link href="/login">← Back to sign in</Link></p>
        </div>
      ) : (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            Enter your email and we&apos;ll send a link to set a new password.
          </p>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="inp" type="email" placeholder="you@example.com" suppressHydrationWarning
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
          </div>
          {err && <p className="muted" style={{ color: "#e0a3a3" }}>{err}</p>}
          <button className="btn" style={{ width: "100%" }} onClick={send} disabled={busy || !email.trim()}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <p className="muted" style={{ marginTop: 14, fontSize: 11.5 }}>
            Supabase&apos;s built-in email is rate-limited to a few messages per hour. If nothing arrives, wait a while
            or reset the password directly in Supabase → Authentication → Users.
          </p>
          <p style={{ marginTop: 12 }}><Link href="/login">← Back to sign in</Link></p>
        </div>
      )}
    </div>
  );
}
