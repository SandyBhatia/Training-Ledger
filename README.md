# Training Ledger

A personal, condition-aware training and nutrition app. Next.js + Supabase + Claude.
Individual logins, health data walled off per user with Row-Level Security.

Everything from the prototype is here: AI-generated plans from a health profile,
swipeable exercise cards with a set/rest timer, skip-and-shift scheduling, a food
log with a built-in database and meal-attributed swap suggestions, weekly
check-ins, and a wind-down breathing pacer.

---

## Setup — about 15 minutes

### 1. Install
```bash
npm install
```

### 2. Supabase
1. Create a project at **supabase.com**.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
3. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs** — add all of these:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/reset`
     - (later) the same two on your Vercel domain
4. **Authentication → Sign In / Providers → Email**: turn **Confirm email OFF** for local
   testing so account creation is instant.

### 3. Anthropic
Get an API key at **console.anthropic.com**, and note the **exact model id** listed there.
Make sure the account has credits — a key without billing set up will fail.

### 4. Environment
```bash
cp .env.example .env.local
```
Fill in all five values. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
come from Supabase → **Settings → API**.

**`ANTHROPIC_MODEL` must be an exact, current model id from your console.** This is the
single most common cause of "generation failed".

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000 → enter your email → click the magic link → fill the
health profile → **Generate my plan**.

### 6. Deploy
Push to GitHub, import the repo in Vercel, add the same environment variables there,
then set `NEXT_PUBLIC_SITE_URL` to your Vercel domain and add that callback URL to
Supabase.

---

## Troubleshooting

**"Couldn't find a `pages` directory"** — an old Next version got installed. Fix:
```bash
rm -rf node_modules package-lock.json
npm install
npm ls next     # should print 16.x
```

**"localhost refused to connect"** — the dev server isn't running. Look at the terminal
where you ran `npm run dev`; it must sit there showing `Ready`. If the port is taken:
`npm run dev -- -p 3001`.

**Plan generation fails** — the API now returns the real reason. Check the browser message
and the terminal. Almost always one of: wrong `ANTHROPIC_MODEL`, missing/invalid
`ANTHROPIC_API_KEY`, or no credits on the Anthropic account. **Restart the dev server
after editing `.env.local`** — Next only reads it at startup.

**Magic link or reset email never arrives** — Supabase's built-in email service is
rate-limited to a few messages per hour and is only meant for testing. Either wait, or
use password sign-in (the default). For real use, connect your own SMTP provider under
**Project Settings → Authentication → SMTP Settings**.

**Forgotten password, no email available** — reset it directly in Supabase:
**Authentication → Users →** click the user **→ Reset password** (or delete and recreate).

---

## Layout

```
supabase/schema.sql      tables + RLS + signup trigger
lib/prompts.ts           the planning brain (condition-aware rules)
lib/conditions.ts        ~35 medical conditions, grouped, plus "other"
lib/guardrails.ts        red-flag screen -> defers to a doctor
lib/food.ts              84-item food database + swap engine
lib/schedule.ts          skip/shift sequence scheduling
app/api/generate-plan    profile -> screen -> Claude -> stored plan
app/api/macros           food text -> database or Claude -> macros
app/onboarding           health intake
app/(app)/*              dashboard, today, program, check-in, nutrition, wind-down
```

## Safety choices, on purpose

- **RLS on every table.** A user can only ever read or write their own rows.
- **API key never reaches the browser.** All Claude calls run server-side.
- **Red-flag screen before generation.** Chest pain, resting BP ≥180/110, pregnancy,
  disordered-eating history, type 1 diabetes, kidney disease, age extremes → the app
  declines to generate and points to a clinician.
- **The prompt is capped.** No 1RM work, calorie floors (1500 men / 1300 women), max
  ~500 kcal deficit, protein minimums, mandatory disclaimers naming their conditions.

## Before this goes public

This is not medical advice, and disclaimers reduce but don't remove responsibility once
you store other people's health data. Prior to any public launch you'll want a privacy
policy, terms of service, a genuine legal review, and app-store health-policy compliance.
The RLS and guardrails are the technical foundation for that — not a substitute for it.
