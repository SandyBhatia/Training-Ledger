"use client";
import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function PWA() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const dismissed = localStorage.getItem("tl-install-dismissed");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (dismissed || standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS gives no install event — show the Add to Home Screen hint instead.
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isIOS) { setIosHint(true); setHidden(false); }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => { localStorage.setItem("tl-install-dismissed", "1"); setHidden(true); };
  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div style={{
      position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 50,
      background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12,
      padding: "13px 15px", display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 12px 34px rgba(0,0,0,.45)", maxWidth: 520, margin: "0 auto",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>Add to your home screen</div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
          {iosHint ? "Tap Share, then “Add to Home Screen”." : "Opens full screen, like an app."}
        </div>
      </div>
      {!iosHint && <button className="btn" style={{ padding: "8px 14px", fontSize: 13 }} onClick={install}>Install</button>}
      <button onClick={dismiss} aria-label="Dismiss"
        style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
    </div>
  );
}
