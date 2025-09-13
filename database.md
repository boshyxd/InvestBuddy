# Database schema (Supabase)

Last updated: 2025-09-13
Project: HTN 2025 (project_id: xlkyetcvneoofiguytmh)

Scope
- This document summarizes the current Postgres schema managed by Supabase for this project.
- Focus is on the public schema. Supabase and extensions may add objects in other schemas (e.g., auth, cron). Notably, some RLS policies exist in the cron schema for internal jobs.

Schemas
- public

Enum types (public)
- contribution_source_type: [manual, auto, bonus]
- goal_status_type: [active, paused, completed, archived]
- invite_status_type: [pending, accepted, expired]
- member_role_type: [owner, admin, member]
- reward_type: [badge, fee_credit_sim, prize_entry]
- risk_profile_type: [conservative, balanced, growth]

Tables (public)

profiles
- RLS: enabled
- Primary key: (id)
- Unique constraints: (email)
- References
  - id -> auth.users.id
- Referenced by
  - circles.owner_id
  - circle_members.user_id
  - contributions.user_id
  - goals.created_by
  - invites.inviter_id
  - rewards.user_id
  - user_streaks.user_id
- Columns
  - id: uuid, not null
  - full_name: text, not null, CHECK length between 1 and 100
  - email: text, not null, UNIQUE, CHECK email regex
  - school: text, nullable, CHECK length <= 100
  - grad_year: int4, nullable, CHECK 2020 <= grad_year <= 2035
  - avatar_url: text, nullable, CHECK http(s) URL
  - risk_profile: risk_profile_type, nullable, default 'balanced'
  - is_active: bool, nullable, default true
  - created_at: timestamptz, default now()
  - updated_at: timestamptz, default now()
- Indexes
  - profiles_pkey (id)
  - profiles_email_key (UNIQUE email)
  - idx_profiles_email (email)
  - idx_profiles_school (school)
- RLS policies
  - Users can insert their own profile (INSERT, WITH CHECK auth.uid() = id)
  - Users can update their own profile (UPDATE, USING auth.uid() = id)
  - Users can view their own profile (SELECT, USING auth.uid() = id)

circles
- RLS: enabled
- Primary key: (id)
- References
  - owner_id -> profiles.id
- Referenced by
  - circle_members.circle_id
  - goals.circle_id
  - invites.circle_id
  - rewards.circle_id
- Columns
  - id: uuid, not null, default gen_random_uuid()
  - name: text, not null, CHECK length between 1 and 100
  - description: text, nullable, CHECK length <= 500
  - owner_id: uuid, not null
  - is_private: bool, not null, default true
  - max_members: int4, nullable, default 10, CHECK between 2 and 50
  - is_active: bool, nullable, default true
  - created_at: timestamptz, default now()
  - updated_at: timestamptz, default now()
- Indexes
  - circles_pkey (id)
  - idx_circles_owner (owner_id)
  - idx_circles_active (partial WHERE is_active = true)
- RLS policies
  - Authenticated users can create circles (INSERT, WITH CHECK auth.uid() = owner_id)
  - Circle owners can update their circles (UPDATE, USING owner_id = auth.uid())
  - Users can view circles they are members of (SELECT, USING EXISTS membership)

circle_members
- RLS: enabled
- Primary key: (circle_id, user_id)
- References
  - circle_id -> circles.id
  - user_id -> profiles.id
- Columns
  - circle_id: uuid, not null
  - user_id: uuid, not null
  - role: member_role_type, not null, default 'member'
  - joined_at: timestamptz, default now()
  - is_active: bool, nullable, default true
- Indexes
  - circle_members_pkey (circle_id, user_id)
  - idx_circle_members_user (user_id)
  - idx_circle_members_active (partial WHERE is_active = true)
- RLS policies
  - Users can view memberships in their circles (SELECT, USING membership)
  - Circle admins can manage memberships (ALL, USING admin/owner membership)

goals
- RLS: enabled
- Primary key: (id)
- References
  - circle_id -> circles.id
  - created_by -> profiles.id
- Referenced by
  - contributions.goal_id
  - rewards.goal_id
  - user_streaks.goal_id
- Columns
  - id: uuid, not null, default gen_random_uuid()
  - circle_id: uuid, not null
  - title: text, not null, CHECK length between 1 and 200
  - description: text, nullable, CHECK length <= 1000
  - target_amount_cents: int8, not null, CHECK > 0
  - target_date: date, nullable, CHECK > CURRENT_DATE
  - portfolio: text, nullable, default 'RBC InvestEase Student Balanced (simulated)', CHECK length <= 100
  - status: goal_status_type, not null, default 'active'
  - created_by: uuid, not null
  - created_at: timestamptz, default now()
  - updated_at: timestamptz, default now()
- Indexes
  - goals_pkey (id)
  - idx_goals_circle (circle_id)
  - idx_goals_status (status)
- RLS policies
  - Circle members can create goals (INSERT, WITH CHECK membership)
  - Circle members can view goals (SELECT, USING membership)
  - Goal creators and circle admins can update goals (UPDATE, USING creator OR admin membership)

contributions
- RLS: enabled
- Primary key: (id)
- References
  - goal_id -> goals.id
  - user_id -> profiles.id
- Columns
  - id: uuid, not null, default gen_random_uuid()
  - goal_id: uuid, not null
  - user_id: uuid, not null
  - amount_cents: int8, not null, CHECK > 0
  - source: contribution_source_type, not null, default 'manual'
  - transaction_reference: text, nullable
  - notes: text, nullable, CHECK length <= 500
  - created_at: timestamptz, default now()
- Indexes
  - contributions_pkey (id)
  - idx_contributions_goal (goal_id)
  - idx_contributions_user (user_id)
  - idx_contributions_date (created_at)
- RLS policies
  - Users can create their own contributions (INSERT, WITH CHECK user_id = auth.uid() AND membership AND goal active)
  - Circle members can view contributions to their goals (SELECT, USING membership)

invites
- RLS: enabled
- Primary key: (id)
- Unique constraints: (invite_code)
- References
  - circle_id -> circles.id
  - inviter_id -> profiles.id
- Columns
  - id: uuid, not null, default gen_random_uuid()
  - circle_id: uuid, not null
  - invited_email: text, not null, CHECK email regex
  - inviter_id: uuid, not null
  - status: invite_status_type, not null, default 'pending'
  - invite_code: text, nullable, UNIQUE, default encode(gen_random_bytes(16), 'hex')
  - message: text, nullable, CHECK length <= 500
  - expires_at: timestamptz, nullable, default now() + interval '7 days'
  - created_at: timestamptz, default now()
  - responded_at: timestamptz, nullable
- Indexes
  - invites_pkey (id)
  - invites_invite_code_key (UNIQUE invite_code)
  - idx_invites_code (invite_code)
  - idx_invites_email (invited_email)
  - idx_invites_status (partial WHERE status = 'pending')
- RLS policies
  - Circle members can create invites (INSERT, WITH CHECK inviter is a member of circle)
  - Users can view invites they sent or received (SELECT, USING inviter_id = auth.uid() OR invited_email = current user's email)

rewards
- RLS: enabled
- Primary key: (id)
- References
  - circle_id -> circles.id (nullable)
  - goal_id -> goals.id (nullable)
  - user_id -> profiles.id (nullable)
- Columns
  - id: uuid, not null, default gen_random_uuid()
  - circle_id: uuid, nullable
  - goal_id: uuid, nullable
  - user_id: uuid, nullable
  - type: reward_type, not null
  - title: text, not null, CHECK length between 1 and 100
  - description: text, nullable, CHECK length <= 500
  - value_cents: int8, nullable, default 0, CHECK >= 0
  - metadata: jsonb, nullable, default '{}'
  - issued_at: timestamptz, default now()
  - expires_at: timestamptz, nullable
  - is_claimed: bool, nullable, default false
- Indexes
  - rewards_pkey (id)
  - idx_rewards_user (user_id)
  - idx_rewards_goal (goal_id)
- RLS policies
  - System can create rewards (INSERT, WITH CHECK true)
  - Users can view their own rewards (SELECT, USING user_id = auth.uid() OR user_id IS NULL)

user_streaks
- RLS: enabled
- Primary key: (id)
- Unique constraints: (user_id, goal_id)
- References
  - user_id -> profiles.id
  - goal_id -> goals.id
- Columns
  - id: uuid, not null, default gen_random_uuid()
  - user_id: uuid, not null
  - goal_id: uuid, not null
  - current_streak: int4, nullable, default 0, CHECK >= 0
  - longest_streak: int4, nullable, default 0, CHECK >= 0
  - last_contribution_date: date, nullable
  - updated_at: timestamptz, default now()
- Indexes
  - user_streaks_pkey (id)
  - user_streaks_user_id_goal_id_key (UNIQUE user_id, goal_id)
- RLS policies
  - System can manage streaks (ALL, USING true)
  - Users can view their own streaks (SELECT, USING user_id = auth.uid())

Relationships summary
- profiles(id) is the root user entity, linked from most other tables.
- circles belong to profiles via owner_id; membership is modeled via circle_members (composite PK circle_id+user_id); goals are scoped to circles.
- contributions attach to goals and users.
- invites belong to circles and an inviter profile; lookups by invite_code and invited_email are indexed.
- rewards can be associated to user, goal, and/or circle, with nullable FKs.
- user_streaks tracks per-user-per-goal streaks with a uniqueness constraint.

Indexes (SQL definitions)
```sql path=null start=null
-- Example entries; see Indexes under each table for coverage
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);
CREATE INDEX idx_circles_owner ON public.circles USING btree (owner_id);
CREATE INDEX idx_goals_circle ON public.goals USING btree (circle_id);
CREATE INDEX idx_contributions_date ON public.contributions USING btree (created_at);
CREATE INDEX idx_invites_status ON public.invites USING btree (status) WHERE (status = 'pending');
CREATE UNIQUE INDEX user_streaks_user_id_goal_id_key ON public.user_streaks USING btree (user_id, goal_id);
```

RLS policies (SQL-like summary)
```sql path=null start=null
-- Examples reflecting the USING / WITH CHECK conditions collected
-- profiles
INSERT INTO profiles ... WITH CHECK (auth.uid() = id);
UPDATE profiles ... USING (auth.uid() = id);
SELECT * FROM profiles WHERE (auth.uid() = id);

-- circles
INSERT INTO circles ... WITH CHECK (auth.uid() = owner_id);
UPDATE circles ... USING (owner_id = auth.uid());
SELECT * FROM circles WHERE EXISTS (
  SELECT 1 FROM circle_members m
  WHERE m.circle_id = circles.id AND m.user_id = auth.uid() AND m.is_active
);

-- circle_members
SELECT * FROM circle_members WHERE (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM circle_members m
    WHERE m.circle_id = circle_members.circle_id AND m.user_id = auth.uid() AND m.is_active
  )
);
ALL ON circle_members USING EXISTS (
  SELECT 1 FROM circle_members m
  WHERE m.circle_id = circle_members.circle_id
    AND m.user_id = auth.uid()
    AND m.role IN ('owner','admin') AND m.is_active
);

-- goals
INSERT ... WITH CHECK EXISTS (
  SELECT 1 FROM circle_members m
  WHERE m.circle_id = goals.circle_id AND m.user_id = auth.uid() AND m.is_active
);
SELECT * FROM goals WHERE EXISTS (
  SELECT 1 FROM circle_members m
  WHERE m.circle_id = goals.circle_id AND m.user_id = auth.uid() AND m.is_active
);
UPDATE goals ... USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM circle_members m
    WHERE m.circle_id = goals.circle_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin') AND m.is_active
  )
);

-- contributions
INSERT ... WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM goals g JOIN circle_members m ON m.circle_id = g.circle_id
    WHERE g.id = contributions.goal_id AND m.user_id = auth.uid() AND m.is_active AND g.status = 'active'
  )
);
SELECT * FROM contributions WHERE EXISTS (
  SELECT 1 FROM goals g JOIN circle_members m ON m.circle_id = g.circle_id
  WHERE g.id = contributions.goal_id AND m.user_id = auth.uid() AND m.is_active
);

-- invites
INSERT ... WITH CHECK EXISTS (
  SELECT 1 FROM circle_members m
  WHERE m.circle_id = invites.circle_id AND m.user_id = auth.uid() AND m.is_active
);
SELECT * FROM invites WHERE (
  inviter_id = auth.uid() OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- rewards
INSERT ... WITH CHECK (true);
SELECT * FROM rewards WHERE (user_id = auth.uid() OR user_id IS NULL);

-- user_streaks
ALL ON user_streaks USING (true);
SELECT * FROM user_streaks WHERE (user_id = auth.uid());
```
