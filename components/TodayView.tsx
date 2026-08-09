"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveDay, todayIndex, fmtDate, addDays, demoUrl, type DayModes } from "@/lib/schedule";

type Log = { log_date: string; done: boolean; day_mode: string | null; payload: any };

const parseSets = (sr: string) => { const m = String(sr).match(/(\d+)\s*[x×]/i); return m ? +m[1] : 3; };
const parseRest = (r: string) => {
  const s = String(r || "");
  if (/min/i.test(s)) { const n = parseFloat(s); return n ? Math.round(n * 60) : 120; }
  const m = s.match(/(\d+)\s*s/i); if (m) return +m[1];
  return 60;
};
const mmss = (sec: number) => { const s = Math.max(0, Math.round(sec)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export default function TodayView({ profile, plan, logs }: { profile: any; plan: any; logs: Log[] }) {
  const supabase = createClient();
  const start = new Date((plan?.start_date || new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const restDow = profile?.rest_dow ?? 0;
  const split = plan?.workout?.split || [];
  const perWeek = plan?.workout?.days_per_week || profile?.days_per_week || 5;
  const totalDays = (plan?.weeks || 12) * 7;

  const [state, setState] = useState<Record<string, Log>>(() => {
    const m: Record<string, Log> = {};
    logs.forEach((l) => { m[l.log_date] = l; });
    return m;
  });
  const tIdx = todayIndex(start);
  const [sel, setSel] = useState(Math.min(totalDays - 1, Math.max(0, tIdx)));
  const [card, setCard] = useState(0);
  const [drag, setDrag] = useState(0);
  const dragFrom = useRef<number | null>(null);

  const modes: DayModes = {};
  Object.values(state).forEach((l) => { if (l.day_mode) modes[l.log_date] = l.day_mode as "rest" | "work"; });

  const info = resolveDay(start, sel, restDow, modes, split.length, perWeek);
  const day = state[info.key] || { log_date: info.key, done: false, day_mode: null, payload: {} };
  const tpl = info.isWorkout ? split[info.splitIndex!] : null;
  const exercises = tpl?.exercises || [];
  const phases = plan?.workout?.phases || [];
  const phase = phases.find((p: any) => p.week === info.week + 1) || null;

  useEffect(() => { setCard(0); setDrag(0); }, [info.key]);
  const cardIdx = exercises.length ? Math.min(card, exercises.length - 1) : 0;
  const ex = exercises[cardIdx];

  const save = useCallback(async (patch: Partial<Log>) => {
    const next = { ...day, ...patch, log_date: info.key };
    setState((s) => ({ ...s, [info.key]: next as Log }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("workout_logs").upsert({
      user_id: user.id, log_date: info.key,
      payload: next.payload || {}, done: !!next.done, day_mode: next.day_mode,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,log_date" });
  }, [day, info.key, supabase]);

  const toggleEx = (id: string) => {
    const p = day.payload || {};
    save({ payload: { ...p, ex: { ...(p.ex || {}), [id]: !p.ex?.[id] } } });
  };
  const setWeight = (id: string, v: string) => {
    const p = day.payload || {};
    save({ payload: { ...p, w: { ...(p.w || {}), [id]: v } } });
  };
  const setNotes = (v: string) => save({ payload: { ...(day.payload || {}), notes: v } });

  /* ---- timer ---- */
  const [timer, setTimer] = useState<any>(null);
  const [, tick] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => { setTimer(null); }, [info.key]);
  useEffect(() => {
    if (!timer?.running) return;
    const id = setInterval(() => tick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [timer]);
  const beep = () => {
    try {
      if (!audio.current) audio.current = new AudioContext();
      const ctx = audio.current;
      [0, 0.18].forEach((t0) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.value = 880;
        const t = ctx.currentTime + t0;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        o.start(t); o.stop(t + 0.16);
      });
      navigator.vibrate?.([120, 60, 120]);
    } catch { /* no audio */ }
  };
  const elapsed = timer ? (timer.acc + (timer.running ? Date.now() - timer.ts : 0)) / 1000 : 0;
  const restLeft = timer?.phase === "rest" ? Math.max(0, timer.restTarget - elapsed) : 0;
  useEffect(() => {
    if (timer?.phase === "rest" && timer.running && timer.restTarget - elapsed <= 0) {
      beep(); setTimer((t: any) => ({ ...t, phase: "ready", running: false, setN: t.setN + 1, acc: 0 }));
    }
  });
  const startEx = (e: any) => setTimer({
    exName: e.name, setN: 1, totalSets: parseSets(e.sets_reps), restTarget: parseRest(e.rest),
    phase: "work", ts: Date.now(), acc: 0, running: true,
  });
  const finishSet = () => setTimer((t: any) =>
    t.setN >= t.totalSets ? { ...t, phase: "done", running: false }
      : { ...t, phase: "rest", ts: Date.now(), acc: 0, running: true });

  /* ---- swipe ---- */
  const onUp = () => {
    if (dragFrom.current === null) return;
    if (drag < -50) setCard(Math.min(exercises.length - 1, cardIdx + 1));
    else if (drag > 50) setCard(Math.max(0, cardIdx - 1));
    setDrag(0); dragFrom.current = null;
  };

  if (!plan) return <div className="container"><div className="card"><p className="muted" style={{ margin: 0 }}>No plan yet.</p></div></div>;

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button className="btn ghost" onClick={() => setSel(Math.max(0, sel - 1))} disabled={sel === 0} style={{ padding: "8px 14px" }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 18 }}>
            {info.date.toLocaleDateString("en-US", { weekday: "short" })} · {fmtDate(info.date)}
            {sel === tIdx && <span style={{ marginLeft: 8, fontSize: 10, background: "var(--gold)", color: "#191300", padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>today</span>}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Day {sel + 1} of {totalDays}{info.isWorkout ? ` · session ${info.seq! + 1} · week ${info.week + 1}` : ""}
          </div>
        </div>
        <button className="btn ghost" onClick={() => setSel(Math.min(totalDays - 1, sel + 1))} disabled={sel >= totalDays - 1} style={{ padding: "8px 14px" }}>›</button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {info.isWorkout ? (
          <button className="btn ghost" style={{ fontSize: 12.5, padding: "8px 12px" }} onClick={() => save({ day_mode: "rest" })}>
            ○ Skip today — push everything forward
          </button>
        ) : day.day_mode === "rest" ? (
          <button className="btn ghost" style={{ fontSize: 12.5, padding: "8px 12px" }} onClick={() => save({ day_mode: null })}>↩ Un-skip this day</button>
        ) : (
          <button className="btn ghost" style={{ fontSize: 12.5, padding: "8px 12px" }} onClick={() => save({ day_mode: "work" })}>
            ✦ Train today instead — pull the next session in
          </button>
        )}
        <div className="muted" style={{ fontSize: 11.5, width: "100%" }}>
          {info.isWorkout
            ? `Skipping moves this session to ${fmtDate(addDays(start, sel + 1))} and slides the rest forward — nothing is lost.`
            : day.day_mode === "rest" ? `Skipped. Next session lands on ${fmtDate(addDays(start, sel + 1))}.`
            : "Rest day — you can train through it to catch up."}
        </div>
      </div>

      {!info.isWorkout ? (
        <div className="card" style={{ textAlign: "center", padding: 30, borderStyle: "dashed" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 21, marginBottom: 8 }}>Rest day</div>
          <p className="muted" style={{ maxWidth: 420, margin: "0 auto" }}>
            Stay loose — an easy walk, some mobility, and a stroll after meals. Recovery is where the training actually lands.
          </p>
        </div>
      ) : (
        <div style={{ background: "var(--paper)", color: "var(--ink)", borderRadius: 12, padding: 18, borderTop: "4px solid var(--gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600 }}>{tpl?.title}</div>
              <div style={{ fontSize: 12.5, color: "#6f6247" }}>{tpl?.focus}</div>
            </div>
            <button onClick={() => save({ done: !day.done })}
              style={{ background: day.done ? "var(--green)" : "transparent", color: day.done ? "#06170e" : "var(--gold)",
                border: `1.5px solid ${day.done ? "var(--green)" : "var(--gold)"}`, borderRadius: 7, padding: "9px 15px",
                fontWeight: 600, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>
              {day.done ? "✓ Logged" : "Mark done"}
            </button>
          </div>

          {phase && (
            <div style={{ background: "#e9dfc4", border: "1px solid #ddd0ab", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>
              <strong>{phase.name} · {phase.rpe}.</strong> {phase.note}
            </div>
          )}

          {timer && (
            <div style={{ background: "#141a2b", color: "var(--text)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <strong>{timer.exName}</strong>
              </div>
              <div className="mono" style={{ fontSize: 44, fontWeight: 600, textAlign: "center",
                color: timer.phase === "rest" ? "var(--blue)" : timer.phase === "done" ? "var(--green)" : "var(--gold)" }}>
                {timer.phase === "rest" ? mmss(restLeft) : timer.phase === "done" ? "✓" : mmss(elapsed)}
              </div>
              <div style={{ textAlign: "center", fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
                {timer.phase === "work" ? `Working · set ${timer.setN} of ${timer.totalSets}`
                  : timer.phase === "rest" ? `Rest · target ${mmss(timer.restTarget)}`
                  : timer.phase === "ready" ? `Ready · set ${timer.setN} of ${timer.totalSets}` : "Exercise complete"}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {timer.phase === "work" && <button className="btn" onClick={finishSet}>Done · rest ▸</button>}
                {timer.phase === "rest" && <button className="btn" onClick={() => setTimer((t: any) => ({ ...t, phase: "ready", running: false, setN: t.setN + 1, acc: 0 }))}>Skip rest ▸</button>}
                {timer.phase === "ready" && <button className="btn" onClick={() => setTimer((t: any) => ({ ...t, phase: "work", ts: Date.now(), acc: 0, running: true }))}>Start set {timer.setN} ▸</button>}
                <button className="btn ghost" onClick={() => setTimer(null)}>Stop</button>
              </div>
            </div>
          )}

          {tpl?.warmup && <div style={{ fontSize: 12.5, color: "#4a4026", marginBottom: 12 }}><strong style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a7a4e" }}>Warm-up </strong>{tpl.warmup}</div>}

          {ex && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a7a4e", fontWeight: 700 }}>
                  Exercise {cardIdx + 1} of {exercises.length}
                </span>
                <span className="mono" style={{ fontSize: 11, color: "#8a7c58" }}>
                  {exercises.filter((e: any) => day.payload?.ex?.[e.name]).length}/{exercises.length} done
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
                {exercises.map((e: any, i: number) => (
                  <button key={i} onClick={() => setCard(i)} aria-label={`Exercise ${i + 1}`}
                    style={{ width: 8, height: 8, padding: 0, borderRadius: "50%", cursor: "pointer",
                      border: "1px solid #cdbf98", background: i === cardIdx ? "var(--gold)" : day.payload?.ex?.[e.name] ? "#8a7a4e" : "transparent" }} />
                ))}
              </div>

              <div
                onTouchStart={(e) => { dragFrom.current = e.touches[0].clientX; }}
                onTouchMove={(e) => { if (dragFrom.current !== null) setDrag(e.touches[0].clientX - dragFrom.current); }}
                onTouchEnd={onUp}
                onMouseDown={(e) => { dragFrom.current = e.clientX; }}
                onMouseMove={(e) => { if (dragFrom.current !== null) setDrag(e.clientX - dragFrom.current); }}
                onMouseUp={onUp} onMouseLeave={onUp}
                style={{ touchAction: "pan-y", userSelect: "none", cursor: "grab" }}
              >
                <div style={{ background: day.payload?.ex?.[ex.name] ? "#e6dcc0" : "#efe7d2",
                  border: `1px solid ${day.payload?.ex?.[ex.name] ? "var(--gold)" : "#e3d9bd"}`,
                  borderRadius: 12, padding: 18, transform: `translateX(${drag}px)`, transition: "transform .15s ease" }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600 }}>{ex.name}</div>
                  {ex.alt && <div style={{ fontSize: 12, color: "#8a7c58", marginTop: 3 }}>Travel: {ex.alt}</div>}
                  <div style={{ display: "flex", gap: 22, margin: "14px 0 6px" }}>
                    <div><div className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{ex.sets_reps}</div><div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "#8a7a4e" }}>sets × reps</div></div>
                    <div><div className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{ex.rest}</div><div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "#8a7a4e" }}>rest</div></div>
                  </div>
                  {ex.note && <div style={{ fontSize: 12, fontStyle: "italic", color: "#6f6247", marginTop: 6 }}>{ex.note}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 6px" }}>
                    <span style={{ fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: "#8a7a4e", fontWeight: 700 }}>Weight</span>
                    <input inputMode="decimal" placeholder="—" value={day.payload?.w?.[ex.name] ?? ""}
                      onChange={(e) => setWeight(ex.name, e.target.value)}
                      style={{ width: 66, background: "#fbf7ec", border: "1px solid #d8cdaf", borderRadius: 6, padding: "7px 8px",
                        fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "var(--ink)", textAlign: "right" }} />
                    <span className="mono" style={{ fontSize: 11, color: "#8a7c58" }}>{profile?.units || "lbs"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => startEx(ex)} style={{ background: "#241c0d", color: "var(--paper)", border: "none", borderRadius: 6, padding: "8px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>▶ start</button>
                    <button onClick={() => toggleEx(ex.name)}
                      style={{ background: day.payload?.ex?.[ex.name] ? "var(--green)" : "transparent",
                        color: day.payload?.ex?.[ex.name] ? "#06170e" : "#241c0d",
                        border: `1.5px solid ${day.payload?.ex?.[ex.name] ? "var(--green)" : "#241c0d"}`,
                        borderRadius: 7, padding: "8px 15px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                      {day.payload?.ex?.[ex.name] ? "✓ done" : "mark done"}
                    </button>
                  </div>
                  <a href={demoUrl(ex.name)} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 12, fontSize: 11.5, fontWeight: 600, color: "#9a7b12", textDecoration: "none" }}>▶ watch demo</a>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <button className="btn ghost" onClick={() => setCard(Math.max(0, cardIdx - 1))} disabled={cardIdx === 0} style={{ padding: "7px 14px" }}>‹</button>
                <span className="mono" style={{ fontSize: 11, color: "#8a7c58" }}>swipe or use ‹ ›</span>
                <button className="btn ghost" onClick={() => setCard(Math.min(exercises.length - 1, cardIdx + 1))} disabled={cardIdx >= exercises.length - 1} style={{ padding: "7px 14px" }}>›</button>
              </div>
            </>
          )}

          {tpl?.finisher && <div style={{ fontSize: 12.5, color: "#4a4026", marginTop: 14 }}><strong style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a7a4e" }}>Finisher </strong>{tpl.finisher}</div>}
          {tpl?.cooldown && <div style={{ fontSize: 12.5, color: "#4a4026", marginTop: 10 }}><strong style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a7a4e" }}>Cool-down </strong>{tpl.cooldown}</div>}

          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a7a4e", fontWeight: 700 }}>Session notes</span>
            <textarea rows={3} value={day.payload?.notes ?? ""} onChange={(e) => setNotes(e.target.value)}
              placeholder="RPE, how it felt, anything to beat next time…"
              style={{ width: "100%", marginTop: 6, background: "#fbf7ec", border: "1px solid #d8cdaf", borderRadius: 7,
                padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "var(--ink)", resize: "vertical" }} />
          </div>
        </div>
      )}
    </div>
  );
}
