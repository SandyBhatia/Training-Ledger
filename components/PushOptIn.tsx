"use client";
import { useState, useEffect } from "react";

/* Push is best-effort. On iOS it only works from a home-screen-installed PWA
   (16.4+, not in the EU) and can silently stop, so we tell the user plainly
   rather than pretending it's guaranteed. */

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushOptIn() {
  const [state, setState] = useState<"unknown" | "unsupported" | "needs-install" | "off" | "on" | "denied">("unknown");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState(isIOS && !standalone ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") { setState("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); setBusy(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) { setState("unsupported"); setBusy(false); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(key),
      });
      await fetch("/api/push/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub),
      });
      setState("on");
    } catch { setState("unsupported"); }
    setBusy(false);
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch { /* ignore */ }
    setBusy(false);
  };

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2 style={{ marginBottom: 6 }}>Nudges</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        If two days pass with nothing logged, the app checks in and offers to reshape the week. It asks — it
        doesn&apos;t nag: at most one nudge every three days, and never while you&apos;re in a travel window or an
        eased patch.
      </p>

      {state === "on" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--green)" }}>● Notifications on</span>
          <button className="btn ghost" onClick={disable} disabled={busy}>Turn off</button>
        </div>
      )}
      {state === "off" && <button className="btn" onClick={enable} disabled={busy}>{busy ? "…" : "Turn on notifications"}</button>}
      {state === "needs-install" && (
        <p className="muted" style={{ color: "var(--warn)", fontSize: 12.5 }}>
          On iPhone, notifications only work once the app is on your home screen. In Safari: Share → Add to Home
          Screen, then open it from the icon and come back here.
        </p>
      )}
      {state === "denied" && (
        <p className="muted" style={{ color: "var(--warn)", fontSize: 12.5 }}>
          Notifications are blocked for this app in your device settings. You&apos;ll still get the check-in card
          when you open the app.
        </p>
      )}
      {state === "unsupported" && (
        <p className="muted" style={{ fontSize: 12.5 }}>
          Push isn&apos;t available on this device or browser. The in-app check-in still works everywhere.
        </p>
      )}

      <p className="muted" style={{ fontSize: 11, marginTop: 12, marginBottom: 0 }}>
        Push delivery is never guaranteed — iOS in particular can stop sending without warning. The check-in card
        waiting for you when you open the app is the reliable path.
      </p>
    </div>
  );
}
