/* Sport mobility routines.

   Hand-written rather than generated, because the whole value is that the
   movements are real and consistent day to day. Each routine targets the
   joints and patterns that sport actually stresses — golf is thoracic
   rotation and hip separation, cricket adds shoulder and lumbar work for
   bowling, tennis is shoulder, ankle and lateral hip.

   These run daily and sit alongside the training plan, not inside it. Doing
   them on a rest day is the point: mobility responds to frequency more than
   intensity. */

export type MobilityMove = { name: string; dose: string; cue: string };
export type SportRoutine = {
  id: string;
  label: string;
  minutes: number;
  focus: string;
  moves: MobilityMove[];
};

export const SPORTS: SportRoutine[] = [
  {
    id: "golf",
    label: "Golf",
    minutes: 15,
    focus: "Thoracic rotation, hip separation, and the shoulder turn — the three things that limit a swing and get blamed on technique.",
    moves: [
      { name: "Open book", dose: "8 each side", cue: "Lie on your side, knees bent, rotate the top arm open and follow it with your eyes. Keep the knees stacked." },
      { name: "Thoracic rotation on all fours", dose: "8 each side", cue: "Hand behind the head, rotate the elbow up to the ceiling. Hips stay square — the movement is mid-back, not lumbar." },
      { name: "90/90 hip switch", dose: "10 switches", cue: "Seated, rotate both knees side to side. This is the hip separation a swing depends on." },
      { name: "Half-kneeling hip flexor stretch", dose: "45 sec each side", cue: "Squeeze the back glute and tuck the pelvis before leaning in." },
      { name: "Standing trunk rotation", dose: "12 each side", cue: "Club or dowel across the shoulders, rotate under control. Feel the turn come from the mid-back." },
      { name: "Wrist flexor and extensor stretch", dose: "30 sec each", cue: "Often neglected, and the grip is where the swing meets the club." },
      { name: "Shoulder dislocates with a band", dose: "10 reps", cue: "Wide grip, slow. Stop where it stays comfortable." },
      { name: "Standing side bend", dose: "8 each side", cue: "Reach long overhead rather than collapsing sideways." },
    ],
  },
  {
    id: "cricket",
    label: "Cricket",
    minutes: 18,
    focus: "Shoulder range for bowling, thoracic and lumbar control, hip mobility for the crease, and ankle stiffness for sprinting between wickets.",
    moves: [
      { name: "Band shoulder dislocates", dose: "12 reps", cue: "Essential before any bowling. Wide grip, slow through the full arc." },
      { name: "Wall slides", dose: "10 reps", cue: "Back flat to the wall, slide arms overhead keeping contact. Builds the overhead range bowling demands." },
      { name: "Thoracic extension over a foam roller", dose: "8 reps", cue: "Roller at mid-back, extend over it. Counteracts the flexed batting stance." },
      { name: "Open book", dose: "8 each side", cue: "Rotation through the mid-back, not the lower back." },
      { name: "90/90 hip switch", dose: "10 switches", cue: "The hip rotation that front-foot landing needs." },
      { name: "World's greatest stretch", dose: "5 each side", cue: "Lunge, elbow to instep, then rotate open. Hits hip, hamstring and thoracic in one." },
      { name: "Ankle dorsiflexion at the wall", dose: "10 each side", cue: "Knee tracks over the toes without the heel lifting. Protects the landing foot." },
      { name: "Sleeper stretch", dose: "30 sec each side", cue: "Gentle. Bowling shoulders lose internal rotation, and this is how you keep it." },
      { name: "Glute bridge", dose: "12 reps", cue: "Wakes up the glutes before any running." },
    ],
  },
  {
    id: "tennis",
    label: "Tennis",
    minutes: 15,
    focus: "Shoulder health for serving, lateral hip mobility for the split step, and ankle range for direction change.",
    moves: [
      { name: "Band external rotation", dose: "15 each side", cue: "Elbow tucked. The rotator cuff work that keeps a serve healthy." },
      { name: "Wall slides", dose: "10 reps", cue: "Overhead range for the serve, without shrugging." },
      { name: "Sleeper stretch", dose: "30 sec each side", cue: "Restores the internal rotation serving takes away." },
      { name: "Lateral lunge", dose: "10 each side", cue: "Sit into the hip. This is the split step and the wide ball." },
      { name: "90/90 hip switch", dose: "10 switches", cue: "Rotational hip range for the open stance forehand." },
      { name: "Ankle dorsiflexion at the wall", dose: "10 each side", cue: "Direction change lives here." },
      { name: "Thoracic rotation on all fours", dose: "8 each side", cue: "Keeps the serve from being driven by the lower back." },
      { name: "Banded lateral walk", dose: "10 steps each way", cue: "Switches the glute medius on before you move sideways." },
    ],
  },
  {
    id: "pickleball",
    label: "Pickleball",
    minutes: 12,
    focus: "Shoulder, wrist and lateral hip — short court, quick hands, lots of direction changes.",
    moves: [
      { name: "Band external rotation", dose: "15 each side", cue: "Elbow tucked, slow return." },
      { name: "Wrist circles and stretch", dose: "30 sec each", cue: "The paddle wrist takes more than people expect." },
      { name: "Lateral lunge", dose: "10 each side", cue: "Sit into the hip rather than bending at the waist." },
      { name: "Banded lateral walk", dose: "10 steps each way", cue: "Glute medius before side-to-side play." },
      { name: "Ankle dorsiflexion at the wall", dose: "10 each side", cue: "Quick stops need ankle range." },
      { name: "Thoracic rotation on all fours", dose: "8 each side", cue: "Keeps the trunk turning freely." },
      { name: "Calf raise", dose: "15 reps", cue: "Prepares the Achilles for repeated push-off." },
    ],
  },
  {
    id: "badminton",
    label: "Badminton",
    minutes: 15,
    focus: "Overhead shoulder range, lunging hip and knee control, and ankle stiffness — badminton is brutal on all three.",
    moves: [
      { name: "Band shoulder dislocates", dose: "12 reps", cue: "Overhead smash range starts here." },
      { name: "Wall slides", dose: "10 reps", cue: "Full overhead without shrugging." },
      { name: "Sleeper stretch", dose: "30 sec each side", cue: "Protects the smashing shoulder." },
      { name: "Deep forward lunge hold", dose: "30 sec each side", cue: "The net lunge is the most common injury position — train it deliberately." },
      { name: "Lateral lunge", dose: "10 each side", cue: "Sideways court coverage." },
      { name: "Ankle dorsiflexion at the wall", dose: "10 each side", cue: "Essential for the lunge and recovery step." },
      { name: "90/90 hip switch", dose: "10 switches", cue: "Rotational hip range." },
      { name: "Calf raise", dose: "15 reps", cue: "Constant on the toes — prepare for it." },
    ],
  },
  {
    id: "running",
    label: "Running",
    minutes: 12,
    focus: "Hip flexor length, glute activation and ankle range — sitting all day then running is the classic injury recipe.",
    moves: [
      { name: "Half-kneeling hip flexor stretch", dose: "45 sec each side", cue: "Tuck the pelvis first or you'll stretch the lower back instead." },
      { name: "Glute bridge", dose: "15 reps", cue: "Wake the glutes so they, not the hamstrings, do the work." },
      { name: "Leg swings, front to back", dose: "12 each leg", cue: "Controlled, not ballistic." },
      { name: "Leg swings, side to side", dose: "12 each leg", cue: "Opens the hip in the frontal plane." },
      { name: "Ankle dorsiflexion at the wall", dose: "10 each side", cue: "Limited ankle range shows up as knee pain." },
      { name: "Calf raise", dose: "15 reps", cue: "Both straight-legged and bent-knee if you have time." },
      { name: "Banded lateral walk", dose: "10 steps each way", cue: "Glute medius controls the knee when you land." },
      { name: "World's greatest stretch", dose: "5 each side", cue: "The single best all-round pre-run movement." },
    ],
  },
  {
    id: "swimming",
    label: "Swimming",
    minutes: 12,
    focus: "Shoulder range and thoracic extension, plus ankle flexibility for the kick.",
    moves: [
      { name: "Band shoulder dislocates", dose: "12 reps", cue: "The foundation of a comfortable catch." },
      { name: "Wall slides", dose: "10 reps", cue: "Overhead range without shrugging." },
      { name: "Thoracic extension over a foam roller", dose: "8 reps", cue: "Counteracts the rounded posture swimming encourages." },
      { name: "Band external rotation", dose: "15 each side", cue: "Rotator cuff balance — swimmers overdevelop the internal rotators." },
      { name: "Sleeper stretch", dose: "30 sec each side", cue: "Gentle, never into pain." },
      { name: "Ankle plantarflexion stretch", dose: "30 sec each side", cue: "Point the toes — kick propulsion needs this range." },
      { name: "Open book", dose: "8 each side", cue: "Rotation for the body roll." },
    ],
  },
  {
    id: "football",
    label: "Football / Soccer",
    minutes: 15,
    focus: "Groin and adductor range, hamstring readiness, hip rotation and ankle control — where most football injuries happen.",
    moves: [
      { name: "Lateral lunge", dose: "10 each side", cue: "Adductor length under control." },
      { name: "Copenhagen plank (short lever)", dose: "20 sec each side", cue: "The best-evidenced groin injury preventer. Start with the knee supported." },
      { name: "Nordic curl (assisted)", dose: "5 reps", cue: "Lower slowly. Strong evidence for reducing hamstring strains." },
      { name: "Half-kneeling hip flexor stretch", dose: "45 sec each side", cue: "Tuck the pelvis first." },
      { name: "90/90 hip switch", dose: "10 switches", cue: "Rotation for turning and striking." },
      { name: "Leg swings, side to side", dose: "12 each leg", cue: "Opens the groin before sprinting." },
      { name: "Ankle dorsiflexion at the wall", dose: "10 each side", cue: "Cutting and landing." },
      { name: "Glute bridge", dose: "15 reps", cue: "Switches the glutes on." },
    ],
  },
  {
    id: "basketball",
    label: "Basketball",
    minutes: 15,
    focus: "Ankle and knee control for jumping and landing, hip mobility, and shoulder range for shooting.",
    moves: [
      { name: "Ankle dorsiflexion at the wall", dose: "12 each side", cue: "The single most important one — ankle range protects the knee on landing." },
      { name: "Deep squat hold", dose: "45 sec", cue: "Sit in the bottom position and breathe. Opens hips, knees and ankles together." },
      { name: "Lateral lunge", dose: "10 each side", cue: "Defensive slide range." },
      { name: "Glute bridge", dose: "15 reps", cue: "Glutes before jumping, or the knees take it." },
      { name: "Banded lateral walk", dose: "10 steps each way", cue: "Glute medius controls knee valgus on landing." },
      { name: "Wall slides", dose: "10 reps", cue: "Overhead range for the shot." },
      { name: "Thoracic extension over a foam roller", dose: "8 reps", cue: "Upright posture for shooting." },
      { name: "Calf raise", dose: "15 reps", cue: "Achilles preparation for repeated jumping." },
    ],
  },
  {
    id: "general",
    label: "General mobility (no specific sport)",
    minutes: 12,
    focus: "A balanced daily routine for desk work and travel — hips, mid-back and shoulders.",
    moves: [
      { name: "Cat-cow", dose: "10 reps", cue: "Wake the spine up segment by segment." },
      { name: "World's greatest stretch", dose: "5 each side", cue: "The best single all-round movement." },
      { name: "Half-kneeling hip flexor stretch", dose: "45 sec each side", cue: "The antidote to a day in a chair or a plane seat." },
      { name: "Thoracic rotation on all fours", dose: "8 each side", cue: "Mid-back, not lower back." },
      { name: "Wall slides", dose: "10 reps", cue: "Undoes rounded desk shoulders." },
      { name: "90/90 hip switch", dose: "10 switches", cue: "Hip rotation both ways." },
      { name: "Glute bridge", dose: "15 reps", cue: "Switches on what sitting switches off." },
      { name: "Dead bug", dose: "8 each side", cue: "Core control without loading the spine." },
    ],
  },
];

export const sportById = (id?: string | null) => SPORTS.find((s) => s.id === id) || null;
