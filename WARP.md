# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Overview
- Purpose: “Socializing investment with RBC InvestEase.”
- Layout: Single Next.js application under frontend/. Run all app-related commands from that directory.
- Tooling: Next.js 15 (Turbopack), React 19, TypeScript 5, ESLint 9 (Flat Config), Tailwind CSS 4, pnpm (pnpm-lock.yaml present).

Key architecture and conventions
- App Router: The frontend README references app/page.tsx, indicating the Next.js App Router is used (app/ directory for routes).
- Path aliasing: TypeScript maps @/* to the frontend directory root, enabling absolute-style imports within the app.

  ```json path=C:\Users\poiso\OneDrive\Documents\InvestBuddy\frontend\tsconfig.json start=21
  "paths": {
    "@/*": ["./*"]
  }
  ```

- ESLint (flat config): Uses eslint.config.mjs extending Next’s core-web-vitals and TypeScript presets. Ignores build artifacts (node_modules, .next, out, build) and next-env.d.ts.
- Next config: next.config.ts currently minimal; defaults apply unless changed.
- Package manager: Prefer pnpm (lockfile present). Using npm/yarn will create new lockfiles and may cause drift.

Common commands (run from frontend/)
- Install dependencies
  ```powershell path=null start=null
  pnpm install
  ```

- Start dev server (Turbopack)
  ```powershell path=null start=null
  pnpm dev
  ```
  - App serves at http://localhost:3000

- Build and run production
  ```powershell path=null start=null
  pnpm build
  pnpm start
  ```

- Lint (ESLint 9, flat config)
  ```powershell path=null start=null
  # basic
  pnpm run lint

  # lint a specific path (pass args through the script)
  pnpm run lint -- .

  # apply fixes
  pnpm run lint -- --fix
  ```

- Type-check (no emit)
  ```powershell path=null start=null
  pnpm exec tsc --noEmit
  ```

- Tests
  - No test runner is configured in package.json at this time; there is no command to run a single test yet. Update this section when test tooling is added.

Package scripts
The main app scripts live in frontend/package.json:

```json path=C:\Users\poiso\OneDrive\Documents\InvestBuddy\frontend\package.json start=5
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "eslint"
},
```

Notable docs and rules
- Root README.md: brief project tagline.
- frontend/README.md: standard Next.js template notes (dev server on :3000, edit app/page.tsx, links to Next.js docs).
- No project-scoped AI rules files found (e.g., WARP.md, CLAUDE.md, Cursor rules, or Copilot instructions) as of this snapshot.

Database
- Supabase project: HTN 2025 (project_id: xlkyetcvneoofiguytmh)
- Core tables: profiles, circles, circle_members, goals, contributions, invites, rewards, user_streaks (all in public schema, RLS enabled).
- See database.md for full schema (columns, keys, indexes, enums, RLS policies).

Working notes for future Warp sessions
- Default working dir: frontend/. If running repo-level tasks, be explicit about paths.
- Imports often use @/… due to tsconfig paths; prefer that style within frontend/ for consistency.
- ESLint flat config is present; when linting narrow paths, pass them through the script (pnpm run lint -- path).
