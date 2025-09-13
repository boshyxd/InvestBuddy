...................................................................................................................# RBC InvestEase Circles — Social Investing That Sticks

Invest with friends. Hit goals together. Celebrate progress in VR.

Note: This is a student hackathon concept, not an official RBC product. Any references to rewards/fees/points are simulated for demo purposes.


## 1) 30-second elevator pitch
Students struggle to start investing and stick with it. RBC InvestEase Circles turns investing into a social, goal-driven experience: create a circle with friends, set a shared goal (grad trip, first car, first $5k portfolio), auto-contribute small amounts weekly, and watch your group’s “money piles” grow in a real-time VR scene. Milestones trigger simulated “RBC Boosts” (badges, fee credits, prize draws) to keep momentum high. Social accountability + visual progress = better habits and more students investing earlier with RBC.


## 2) Who it’s for and why it matters (hackathon framing)
- For: Canadian students new to investing who need motivation, clarity, and social accountability.
- Why now: Investing apps are solo; students respond to social cues, streaks, and visible progress. Circles lowers activation energy through friends + small, automated contributions.
- RBC Fit: On-ramps students into RBC InvestEase portfolios; emphasizes responsible investing and education while showcasing RBC’s brand, trust, and reach.


## 3) Core concept and features
- Circles (groups): Invite friends via .edu/school email or share link; private by default.
- Shared goals: Define target amount and date; everyone commits a weekly auto-top-up (e.g., $10–$20).
- Personal + group progress: See individual contributions and the group’s trajectory.
- Milestones with simulated “RBC Boosts”: 10%/25%/50%/100% unlock badges, fee-credit simulation, and prize draw entries.
- Streaks and nudges: Gentle reminders, streak badges, and time-boxed “boost weeks.”
- Risk-aware guardrails: Default to RBC InvestEase student-friendly portfolios (simulated). Offer simple education bites.
- VR “Money Piles”: Live 3D stacks grow in realtime as contributions land; confetti and effects at milestones.
- “Good friction”: Celebrate micro-wins, show forecasts, and default to automation with easy pause.


## 4) WOW factor (tailored to judging)
- Visual appeal: Polished UI + immersive WebXR scene that reacts to realtime database events.
- Originality: Social investing circle with milestone-driven rewards and live VR visualizations.
- Technical ability: Supabase Auth + Row-Level Security, Realtime subscriptions, data adapter for mock/offline, WebXR via react-three-fiber, and deterministic reward scaling.
- Design: Simple 3-step onboarding; clear goal progress; safe defaults; nudges without shame.
- Practicality/Entrepreneurship: Clear path to pilot with campus clubs; simulated rewards map to plausible RBC incentives.


## 5) Architecture (no custom backend required)
- Frontend: React + TypeScript + Vite, Tailwind or Chakra UI.
- Realtime + DB: Supabase (Auth, Postgres, Realtime). Use policies for safety; no server code needed.
- VR/3D: react-three-fiber + three.js + @react-three/xr (with a 2D fallback if device lacks WebXR).
- Packaging: 
  - Web-first for the demo.
  - Desktop packaging via Electron or Tauri for kiosk-like demo.
  - Mobile note: Electron targets desktop, not mobile. If you want a mobile wrapper, use Capacitor (wraps the web app) or React Native/Expo. For hackathon speed, ship web + optional desktop.
- Data adapter: Switch between Supabase and local mock JSON via an environment toggle.


## 6) Data model (minimal viable schema)

Tables (abridged for MVP):
- profiles: user info (linked to Supabase auth)
- circles: group containers
- circle_members: membership and roles
- goals: shared goals per circle
- contributions: member contributions to a goal
- rewards: simulated milestone rewards
- invites: track invites + onboarding funnel

Example SQL (run in Supabase SQL editor):

```sql
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  school text,
  grad_year int,
  avatar_url text,
  risk_profile text check (risk_profile in ('conservative','balanced','growth')),
  created_at timestamptz default now()
);

-- circles
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  is_private boolean default true,
  created_at timestamptz default now()
);

-- circle members
create table if not exists public.circle_members (
  circle_id uuid references public.circles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz default now(),
  primary key (circle_id, user_id)
);

-- goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  title text not null,
  target_amount_cents int not null check (target_amount_cents > 0),
  target_date date,
  portfolio text default 'RBC InvestEase Student Balanced (simulated)',
  status text default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz default now()
);

-- contributions
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  source text default 'manual' check (source in ('manual','auto','bonus')),
  created_at timestamptz default now()
);

-- rewards (simulated)
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete cascade,
  type text not null check (type in ('badge','fee_credit_sim','prize_entry')),
  description text,
  value_cents int,
  issued_at timestamptz default now()
);

-- invites
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles(id) on delete cascade,
  invited_email text not null,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending','accepted','expired')),
  created_at timestamptz default now()
);

-- Basic RLS
alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.goals enable row level security;
alter table public.contributions enable row level security;
alter table public.rewards enable row level security;
alter table public.invites enable row level security;

-- Policies (simplified for demo)
create policy "Own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Circle visibility" on public.circles
  for select using (exists (
    select 1 from public.circle_members m where m.circle_id = circles.id and m.user_id = auth.uid()
  ));

create policy "Membership visibility" on public.circle_members
  for select using (user_id = auth.uid() or exists (
    select 1 from public.circle_members m where m.circle_id = circle_members.circle_id and m.user_id = auth.uid()
  ));

create policy "Goals visibility" on public.goals
  for select using (exists (
    select 1 from public.circle_members m where m.circle_id = goals.circle_id and m.user_id = auth.uid()
  ));

create policy "Contributions visibility" on public.contributions
  for select using (exists (
    select 1 from public.goals g join public.circle_members m on m.circle_id = g.circle_id
    where g.id = contributions.goal_id and m.user_id = auth.uid()
  ));
```


## 7) Realtime VR: how the “money piles” work
- Each contribution inserts a row into contributions.
- The client subscribes to Realtime on contributions for the active goal/circle.
- The 3D scene (react-three-fiber) animates a short “stack growth” whenever a new event arrives.
- We calculate cumulative totals per member to set pile heights; milestone thresholds add special effects.

Example client-side sketch (TypeScript):

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export function subscribeToContributions(goalId: string, onDelta: (evt: any) => void) {
  return supabase
    .channel(`contrib:${goalId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'contributions',
      filter: `goal_id=eq.${goalId}`
    }, (payload) => onDelta(payload.new))
    .subscribe();
}
```


## 8) Reward scaling (simulated)
We simulate a transparent, deterministic “RBC Boost score” for demo purposes:

- Let C be group cumulative contributions; T is target; n is circle size.
- Streak factor s ∈ {1.0, 1.1, 1.25} for 1, 4, 8+ week streaks.
- Points p = k · min(C/T, 1)^α · √n · s where k (e.g., 1000) and α (e.g., 1.2) shape the curve.
- Milestone unlocks (10/25/50/100%) emit “badge” and a “fee_credit_sim” reward in the UI.

This keeps the demo fair, easy to explain, and visually punchy.


## 9) UX flow (90-second demo script)
1) Create a circle “Grad Trip 2026” and invite 3 friends (show instant join).
2) Choose “Student Balanced (simulated)” portfolio and set $15/week auto-top-ups.
3) Land on the goal screen: show projected date and concise education bite.
4) Switch to VR: each friend makes a $5 contribution; stacks grow live; confetti at 25% milestone.
5) Simulated “RBC Boost” pops: badge + “$X fee credit (sim)” note and leaderboard nudge.
6) End with: “Social + automation => students start earlier and stick with it on RBC InvestEase.”


## 10) Implementation plan (hackathon timeline)
Day 1
- Scaffold React/Vite TS app; pick Tailwind or Chakra.
- Create Supabase project, run schema, seed test data.
- Auth: email magic link only; auto-create profiles row on sign-in.
- Circles + Goals UI; create/join; list contributions.

Day 2
- Realtime contributions; reward logic; milestone effects.
- VR scene (r3f + @react-three/xr) with 2D fallback.
- Polish: onboarding copy, streaks, badges, crisp visuals (RBC colors).
- Demo mode and offline fallback (mock JSON).

Stretch (time permitting)
- Campus leaderboards; referral boosts; simple financial literacy micro-lessons.


## 11) Offline/demo safety
- MODE=mock falls back to local JSON and deterministic timers to “fake” contributions.
- Toggle between Supabase and mock without code churn via a data adapter interface.

Env sample

```env
VITE_SUPABASE_URL={{SUPABASE_URL}}
VITE_SUPABASE_ANON_KEY={{SUPABASE_ANON_KEY}}
VITE_MODE=demo   # demo | supabase | mock
```


## 12) Dev setup (commands)
- Create app: `npm create vite@latest rbc-circles -- --template react-swc-ts`
- Install: `npm i @supabase/supabase-js three @react-three/fiber @react-three/drei @react-three/xr zustand class-variance-authority` (or Chakra UI if preferred)
- Run: `npm run dev`

Supabase client snippet

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
```

Data adapter pattern

```ts
export interface DataAPI {
  getCircle(id: string): Promise<Circle>;
  listContributions(goalId: string): Promise<Contribution[]>;
  addContribution(g: string, u: string, cents: number): Promise<void>;
  subscribeContributions(goalId: string, cb: (c: Contribution) => void): () => void;
}
```


## 13) Visual and brand notes
- Colors: RBC Blue (#0051A5), Secondary Gold (#FDBB30), lots of white space, rounded corners.
- Micro-animations: stack easing, subtle shadows, confetti bursts at milestones.
- Inclusive language, no shaming; emphasize small, steady steps.


## 14) Judging criteria mapping
- WOW factor: Live VR growth tied to realtime events; milestone celebrations.
- Technical ability: Auth, RLS, Realtime, WebXR, adapter-based architecture, simulated reward algorithm.
- Visual appeal: Crisp RBC-branded UI; smooth 3D with celebratory effects.
- Originality: Social investing circles + VR “money piles.”
- Design: 3-step onboarding, safe defaults, clear progress and next best action.
- Practicality: On-ramp to RBC InvestEase portfolios; easy pilot for student clubs.


## 15) Risks and mitigations
- Connectivity: Provide mock/offline mode and deterministic demo script.
- Device support: 2D fallback if no WebXR; a single scene that looks great on laptop.
- Compliance: Copy is educational; rewards clearly labeled as simulated.


## 16) What we’ll show judges
- 45s product walkthrough, 30s VR “wow”, 15s wrap with impact metrics (activation, streaks, completion).
- QR to try web demo + short GitHub README.


## 17) Next steps if we had more time
- Real RBC InvestEase sandbox integration; fee credit/promotions integration.
- Smart nudges based on cohort behavior; richer education journeys.
- Social discovery across campuses; verified student communities.
