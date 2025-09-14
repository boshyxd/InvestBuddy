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

Design tokens (UI theme)
- primary: #006ac3
- accent: #ffdf01
- background: #ffffff (light mode)
- text: #000000
- on-primary text: #ffffff (use on top of primary backgrounds)

Implementation (Tailwind CSS v4)
Use @theme tokens in your global stylesheet (e.g., frontend/app/globals.css):

```css path=null start=null
@import "tailwindcss";

@theme {
  --color-primary: #006ac3;
  --color-primary-foreground: #ffffff;
  --color-accent: #ffdf01;
  --color-background: #ffffff;
  --color-foreground: #000000;
}

:root {
  color: var(--color-foreground);
  background: var(--color-background);
}
```

Profile Home (mobile-first) – spec
- Header: user avatar + full name.
- Subline: masked card number directly under name in gray (e.g., “XXXX1523”).
- Divider.
- Accounts summary: show balances for chequing/savings.
- Actions: two buttons — “Add money” (primary) and “Move money” (outline/secondary).
- Investments list: TFSA, RRSP, plus any other available accounts.
- Primary CTA at bottom: “Invest Buddies” (navigates to the main Invest Buddies page).
- Other pages may use a stepper (to be specified later).

Skeleton (Next.js App Router)

```tsx path=null start=null
'use client';

export default function ProfileHome() {
  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-4">
      {/* Header */}
      <section className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200" aria-hidden />
        <div>
          <h1 className="text-lg font-semibold">Your Name</h1>
          <p className="text-sm text-gray-600">XXXX1523</p>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Accounts summary */}
      <section className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-600">Chequing</p>
          <p className="text-base font-medium">$0.00</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-600">Savings</p>
          <p className="text-base font-medium">$0.00</p>
        </div>
      </section>

      {/* Actions */}
      <section className="grid grid-cols-2 gap-3">
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Add money</button>
        <button className="rounded-md border border-gray-300 px-4 py-2 text-gray-900">Move money</button>
      </section>

      {/* Investments list */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">Investments</h2>
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          <li className="flex items-center justify-between p-3">
            <span>TFSA</span>
            <span className="text-gray-600">$0.00</span>
          </li>
          <li className="flex items-center justify-between p-3">
            <span>RRSP</span>
            <span className="text-gray-600">$0.00</span>
          </li>
          {/* Add other accounts dynamically as needed */}
        </ul>
      </section>

      {/* Primary CTA */}
      <section>
        <button className="w-full rounded-md bg-primary px-4 py-3 text-center text-primary-foreground font-medium">Invest Buddies</button>
      </section>
    </main>
  );
}
```

Routing note
- If Profile Home is the root page, implement in frontend/app/page.tsx; otherwise place under the desired route and link accordingly.
