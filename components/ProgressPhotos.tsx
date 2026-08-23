"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const POSES = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
];

type Row = { id: string; week: number; pose: string; path: string };

export default function ProgressPhotos({ week, rows: initial }: { week: number; rows: Row[] }) {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>(initial);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [compareWith, setCompareWith] = useState<number | null>(null);

  // Signed URLs — the bucket is private, so links are short-lived and per-user.
  const sign = useCallback(async (list: Row[]) => {
    const out: Record<string, string> = {};
    for (const r of list) {
      const { data } = await supabase.storage.from("progress").createSignedUrl(r.path, 3600);
      if (data?.signedUrl) out[`${r.week}-${r.pose}`] = data.signedUrl;
    }
    setUrls((u) => ({ ...u, ...out }));
  }, [supabase]);

  useEffect(() => { if (rows.length) sign(rows); }, [rows, sign]);

  const weeksWithPhotos = Array.from(new Set(rows.map((r) => r.week))).sort((a, b) => a - b);
  useEffect(() => {
    if (compareWith === null && weeksWithPhotos.length) {
      const earlier = weeksWithPhotos.filter((w) => w < week);
      setCompareWith(earlier.length ? earlier[0] : weeksWithPhotos[0]);
    }
  }, [weeksWithPhotos, week, compareWith]);

  const upload = async (pose: string, file: File) => {
    setErr(""); setBusy(pose);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not signed in");
      if (file.size > 8 * 1024 * 1024) throw new Error("Image is larger than 8 MB — try a smaller photo.");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/w${week}-${pose}.${ext}`;
      const { error: upErr } = await supabase.storage.from("progress").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("progress_photos")
        .upsert({ user_id: user.id, week, pose, path, taken_at: new Date().toISOString() },
                { onConflict: "user_id,week,pose" })
        .select().single();
      if (error) throw error;
      setRows((r) => [...r.filter((x) => !(x.week === week && x.pose === pose)), data as Row]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    }
    setBusy("");
  };

  const remove = async (r: Row) => {
    setRows((list) => list.filter((x) => x.id !== r.id));
    await supabase.storage.from("progress").remove([r.path]);
    await supabase.from("progress_photos").delete().eq("id", r.id);
  };

  const photoFor = (w: number, pose: string) => rows.find((r) => r.week === w && r.pose === pose);
  const isMilestone = [0, 4, 8, 12].includes(week);

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ marginBottom: 4 }}>Progress photos</h2>
        {isMilestone && <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>milestone week</span>}
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Same spot, same light, same time of day — ideally morning before food. Consistency is what makes two photos
        comparable. Change shows over 4–8 weeks, not week to week. Photos are private to your account.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 12 }}>
        {POSES.map((p) => {
          const shot = photoFor(week, p.id);
          const url = urls[`${week}-${p.id}`];
          return (
            <div key={p.id}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#c3cadd", marginBottom: 6 }}>{p.label}</div>
              <label style={{
                display: "block", aspectRatio: "3/4", borderRadius: 10, cursor: "pointer", overflow: "hidden",
                border: `1px ${shot ? "solid" : "dashed"} var(--line)`, background: "#141a2b",
                position: "relative",
              }}>
                {url ? (
                  <img src={url} alt={`${p.label} week ${week}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
                    color: "var(--muted)", fontSize: 11.5, textAlign: "center", padding: 8 }}>
                    {busy === p.id ? "Uploading…" : "Tap to add"}
                  </span>
                )}
                <input type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(p.id, f); e.target.value = ""; }} />
              </label>
              {shot && (
                <button onClick={() => remove(shot)}
                  style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer", padding: "5px 0" }}>
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      {err && <p className="muted" style={{ color: "#e0a3a3" }}>{err}</p>}

      {weeksWithPhotos.filter((w) => w !== week).length > 0 && (
        <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <span className="eyebrow">Compare with</span>
            <select className="inp" style={{ width: "auto", padding: "7px 10px", fontSize: 13 }}
              value={compareWith ?? ""} onChange={(e) => setCompareWith(Number(e.target.value))}>
              {weeksWithPhotos.filter((w) => w !== week).map((w) => (
                <option key={w} value={w}>{w === 0 ? "Baseline" : `Week ${w}`}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {POSES.map((p) => {
              const a = compareWith !== null ? urls[`${compareWith}-${p.id}`] : undefined;
              const b = urls[`${week}-${p.id}`];
              if (!a && !b) return <div key={p.id} />;
              return (
                <div key={p.id}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 5 }}>{p.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {[a, b].map((u, i) => (
                      <div key={i} style={{ aspectRatio: "3/4", borderRadius: 7, overflow: "hidden",
                        border: "1px solid var(--line)", background: "#141a2b" }}>
                        {u ? <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                           : <span style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)", fontSize: 10 }}>—</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--muted)", marginTop: 3 }}>
                    <span>{compareWith === 0 ? "base" : `w${compareWith}`}</span>
                    <span>{week === 0 ? "base" : `w${week}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
