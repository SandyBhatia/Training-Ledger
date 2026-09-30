"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONDITION_GROUPS, GOAL_TYPES, EXERCISE_PREFS, EQUIPMENT, DIET_STYLES, conditionLabel } from "@/lib/conditions";
import { SPLIT_STYLES, MUSCLE_GROUPS, CUSTOM_PRESETS, type MuscleGroup } from "@/lib/splits";
import { SPORTS } from "@/lib/sports";
import type { Profile } from "@/lib/types";

export default function Onboarding() {
  const router = useRouter();
  const [p, setP] = useState<Profile>({
    conditions: [], exercise_prefs: [], experience: "some", days_per_week: 5,
    session_minutes: 60, equipment: "full_gym", diet_style: "veg_egg", goal_type: "recomp", rest_dow: 0,
    start_date: new Date().toISOString().slice(0, 10),
    split_style: "auto", sport: "", sport_minutes: 15,
  });

  const days = Math.max(2, Math.min(6, p.days_per_week || 5));
  const customDays: MuscleGroup[][] = (p.custom_days as MuscleGroup[][] | undefined)
    ?? CUSTOM_PRESETS[days] ?? CUSTOM_PRESETS[5];
  const setCustomDay = (i: number, g: MuscleGroup) =>
    setP((s) => {
      const base = ((s.custom_days as MuscleGroup[][] | undefined) ?? CUSTOM_PRESETS[days] ?? CUSTOM_PRESETS[5]).map((d) => [...d]);
      while (base.length < days) base.push([]);
      const day = base[i] || [];
      base[i] = day.includes(g) ? day.filter((x) => x !== g) : [...day, g];
      return { ...s, custom_days: base.slice(0, days) };
    });
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [deferred, setDeferred] = useState("");
  const [err, setErr] = useState("");

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setP((s) => ({ ...s, [k]: v }));
  };
  const addCondition = (id: string) => {
    if (!id) return;
    setP((s) => (s.conditions?.includes(id) ? s : { ...s, conditions: [...(s.conditions || []), id] }));
    setPick("");
  };
  const removeCondition = (id: string) =>
    setP((s) => ({ ...s, conditions: (s.conditions || []).filter((c) => c !== id) }));
  const togglePref = (id: string) =>
    setP((s) => ({ ...s, exercise_prefs: s.exercise_prefs?.includes(id)
      ? s.exercise_prefs.filter((x) => x !== id) : [...(s.exercise_prefs || []), id] }));

  async function generate() {
    setBusy(true); setErr(""); setDeferred(""); setStep("Designing your training programme…");
    try {
      // Step 1 — workout. Split from nutrition so each call stays inside
      // the serverless function time limit. Retried once on a timeout,
      // which is usually transient.
      let res!: Response, raw = "", data: any = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt === 1) setStep("Taking longer than usual — retrying…");
        res = await fetch("/api/generate-plan", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
        });
        raw = await res.text();
        try { data = JSON.parse(raw); break; }
        catch {
          const timedOut = res.status === 504 || res.status === 408;
          if (timedOut && attempt === 0) continue;
          setErr(timedOut
            ? "The programme took too long to build, twice. Try reducing days per week or session length slightly, then generate again."
            : `Server error ${res.status}. ${raw.slice(0, 140)}`);
          setBusy(false); setStep(""); return;
        }
      }
      if (data.deferred) { setDeferred(data.reason); setBusy(false); setStep(""); return; }
      if (data.error) {
        setErr(data.error === "limit_reached"
          ? data.detail
          : (data.detail ? `${data.error}: ${data.detail}` : "Something went wrong building the programme."));
        setBusy(false); setStep(""); return;
      }

      // Step 2 — nutrition + micronutrients.
      setStep("Building your nutrition targets…");
      try {
        const res2 = await fetch("/api/generate-nutrition", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_id: data.plan?.id }),
        });
        const raw2 = await res2.text();
        try {
          const d2 = JSON.parse(raw2);
          if (d2.error) console.warn("nutrition step failed:", d2);
        } catch { console.warn("nutrition step returned non-JSON"); }
      } catch { /* the workout plan is saved; nutrition can be retried later */ }

      router.push("/dashboard"); router.refresh();
    } catch (e: unknown) {
      setErr(`Couldn't reach the server: ${e instanceof Error ? e.message : "unknown error"}. Please try again.`);
      setBusy(false); setStep("");
    }
  }

  if (deferred) {
    return (
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="eyebrow">Let&apos;s pause here</div>
        <h1 style={{ fontFamily: "Fraunces, serif" }}>This one needs a doctor first</h1>
        <div className="card" style={{ borderLeft: "3px solid #e6b877" }}>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>{deferred}</p>
        </div>
        <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => setDeferred("")}>← Back to the form</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="eyebrow">Getting started</div>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30 }}>Tell us about you</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        This shapes a plan around your body, your markers, and how you actually like to train.
        It&apos;s general wellness guidance, not medical advice — please check with your doctor,
        especially for anything you list below.
      </p>

      <div className="card">
        <h2>Basics</h2>
        <div className="field">
          <label className="label">Name</label>
          <input className="inp" value={p.display_name || ""} onChange={set("display_name")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="label">Sex</label>
            <select className="inp" value={p.sex || ""} onChange={set("sex")}>
              <option value="">Select…</option><option value="male">Male</option>
              <option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Date of birth</label>
            <input className="inp" type="date" value={p.birth_date || ""} onChange={set("birth_date")} />
          </div>
          <div className="field">
            <label className="label">Height (cm)</label>
            <input className="inp" type="number" value={p.height_cm ?? ""} onChange={set("height_cm")} />
          </div>
          <div className="field">
            <label className="label">Weight (kg)</label>
            <input className="inp" type="number" value={p.weight_kg ?? ""} onChange={set("weight_kg")} />
          </div>
          <div className="field">
            <label className="label">Waist (in)</label>
            <input className="inp" type="number" step="0.5" placeholder="at the navel" value={p.waist_in ?? ""} onChange={set("waist_in")} />
          </div>
          <div className="field">
            <label className="label">Neck (in)</label>
            <input className="inp" type="number" step="0.25" placeholder="below the Adam's apple" value={p.neck_in ?? ""} onChange={set("neck_in")} />
          </div>
          {p.sex === "female" && (
            <div className="field">
              <label className="label">Hips (in)</label>
              <input className="inp" type="number" step="0.5" placeholder="at the widest point" value={p.hips_in ?? ""} onChange={set("hips_in")} />
            </div>
          )}
        </div>
      </div>

      <p className="muted" style={{ fontSize: 11.5, margin: "-4px 0 0" }}>
        Waist and neck let us estimate your current body fat, which is what makes a target meaningful.
        Leave them blank if you&apos;d rather not — the plan still works, just with a rougher starting point.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Health</h2>
        <div className="field">
          <label className="label">Medical conditions</label>
          <select className="inp" value={pick} onChange={(e) => addCondition(e.target.value)}>
            <option value="">Add a condition…</option>
            {CONDITION_GROUPS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.items.filter((i) => !p.conditions?.includes(i.id)).map((i) => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {!!p.conditions?.length && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {p.conditions.map((c) => (
                <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#141a2b",
                  border: "1px solid var(--line)", borderRadius: 99, padding: "5px 8px 5px 12px", fontSize: 12.5 }}>
                  {conditionLabel(c)}
                  <button onClick={() => removeCondition(c)} aria-label={`Remove ${conditionLabel(c)}`}
                    style={{ background: "none", border: "none", color: "#7a8098", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 4px" }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <label className="label">Anything else not on the list</label>
          <input className="inp" placeholder="Other conditions, injuries, or concerns"
            value={p.conditions_other || ""} onChange={set("conditions_other")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="label">Resting blood pressure</label>
            <input className="inp" placeholder="e.g. 120/80" value={p.resting_bp || ""} onChange={set("resting_bp")} />
          </div>
          <div className="field">
            <label className="label">Medications</label>
            <input className="inp" placeholder="e.g. rosuvastatin, olmesartan" value={p.medications || ""} onChange={set("medications")} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Goals</h2>
        <div className="field">
          <label className="label">Main goal</label>
          <select className="inp" value={p.goal_type} onChange={set("goal_type")}>
            {GOAL_TYPES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">In your own words</label>
          <textarea className="inp" rows={2} placeholder="e.g. lose belly fat and build lean muscle before my 50th"
            value={p.goals || ""} onChange={set("goals")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="label">Target body fat % <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
            <input className="inp" type="number" step="0.5" min={8} max={40} placeholder="e.g. 15"
              value={p.target_body_fat ?? ""} onChange={set("target_body_fat")} />
          </div>
          <div className="field">
            <label className="label">Target date <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
            <input className="inp" type="date" value={p.target_date || ""} onChange={set("target_date")} />
          </div>
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: -6, marginBottom: 14 }}>
          Body fat is a better target than weight — it separates what you want to lose from what you want to keep.
          Typical bands for men: 15–18% lean and healthy, 12–15% abs visible. For women, add roughly 8–10%.
          We&apos;ll tell you honestly how long it should take.
        </p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Training</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="label">Experience</label>
            <select className="inp" value={p.experience} onChange={set("experience")}>
              <option value="new">New to training</option>
              <option value="some">Some experience</option>
              <option value="experienced">Experienced</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Days per week</label>
            <input className="inp" type="number" min={2} max={6} value={p.days_per_week} onChange={set("days_per_week")} />
          </div>
          <div className="field">
            <label className="label">Minutes per session</label>
            <input className="inp" type="number" min={20} max={120} step={5} value={p.session_minutes} onChange={set("session_minutes")} />
          </div>
          <div className="field">
            <label className="label">Equipment</label>
            <select className="inp" value={p.equipment} onChange={set("equipment")}>
              {EQUIPMENT.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">What do you enjoy? <span style={{ color: "var(--muted)", fontWeight: 400 }}>(pick any)</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
            {EXERCISE_PREFS.map((x) => (
              <button key={x.id} className="pill" data-on={p.exercise_prefs?.includes(x.id)} onClick={() => togglePref(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="label">Start date</label>
          <input className="inp" type="date" value={p.start_date || ""} onChange={set("start_date")} />
          <span className="muted" style={{ fontSize: 11.5 }}>Day 1 of your programme. Pick a date you&apos;ll realistically begin.</span>
        </div>
        <div className="field">
          <label className="label">How should the week be structured?</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
            {SPLIT_STYLES.map((st) => (
              <button key={st.id} type="button" onClick={() => setP((s) => ({ ...s, split_style: st.id }))}
                className="btn ghost"
                style={{ textAlign: "left", padding: "11px 13px",
                  borderColor: p.split_style === st.id ? "var(--accent)" : "var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 13.5, color: p.split_style === st.id ? "var(--accent)" : "var(--text)" }}>{st.label}</strong>
                  <span className="muted" style={{ fontSize: 11 }}>{st.bestFor}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{st.blurb}</div>
              </button>
            ))}
          </div>
        </div>

        {p.split_style === "custom" && (
          <div className="field">
            <label className="label">Pick the muscle groups for each day</label>
            <p className="muted" style={{ fontSize: 11.5, margin: "2px 0 10px" }}>
              Starting from a sensible {days}-day template — change whatever you like. You can still swap individual
              exercises once the plan is built.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: days }, (_, i) => (
                <div key={i} style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px" }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Day {i + 1}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {MUSCLE_GROUPS.map((g) => (
                      <button key={g.id} type="button" className="pill"
                        data-on={(customDays[i] || []).includes(g.id)}
                        onClick={() => setCustomDay(i, g.id)}
                        style={{ fontSize: 11.5, padding: "5px 10px" }}>{g.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label className="label">Daily sport mobility <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
          <p className="muted" style={{ fontSize: 11.5, margin: "2px 0 8px" }}>
            A short routine that runs every day alongside your training, including rest days — mobility responds to
            frequency more than intensity.
          </p>
          <select className="inp" value={p.sport || ""} onChange={set("sport")}>
            <option value="">None</option>
            {SPORTS.map((sp) => <option key={sp.id} value={sp.id}>{sp.label} — {sp.minutes} min</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label">Preferred rest day</label>
          <select className="inp" value={p.rest_dow} onChange={(e) => setP((s) => ({ ...s, rest_dow: Number(e.target.value) }))}>
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Food</h2>
        <div className="field">
          <label className="label">Diet style</label>
          <select className="inp" value={p.diet_style} onChange={set("diet_style")}>
            {DIET_STYLES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Allergies or foods to avoid</label>
          <input className="inp" value={p.allergies || ""} onChange={set("allergies")} />
        </div>
      </div>

      {err && <p className="muted" style={{ color: "#e0a3a3", marginTop: 14 }}>{err}</p>}

      <button className="btn" style={{ width: "100%", marginTop: 18, padding: 15 }} onClick={generate} disabled={busy}>
        {busy ? <><span className="spinner" /> &nbsp;{step || "Building your plan…"}</> : "Generate my plan"}
      </button>
      <p className="muted" style={{ marginTop: 12, fontSize: 11.5 }}>
        Takes up to a minute — the programme and the nutrition guidance are built in two steps.
      </p>
    </div>
  );
}
