import webpush from "web-push";

/** Web Push is best-effort. iOS only delivers to home-screen-installed PWAs
    (16.4+, outside the EU) and can stop working without warning, so nothing
    in the app depends on a push arriving — the in-app card is the real path. */
let configured = false;

export function pushReady() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@example.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export type Sub = { endpoint: string; p256dh: string; auth: string };

export async function sendPush(sub: Sub, payload: { title: string; body: string; url?: string }) {
  if (!pushReady()) return { ok: false, gone: false };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return { ok: true, gone: false };
  } catch (e: unknown) {
    const code = (e as { statusCode?: number })?.statusCode;
    // 404/410 mean the subscription is dead and should be removed
    return { ok: false, gone: code === 404 || code === 410 };
  }
}
