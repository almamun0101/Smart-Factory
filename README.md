# Factory Production Management System

A production tracking system for a small factory floor: 3 machines, 12 workers,
day/night shifts (9→9), running-counter production tracking, order targets with
estimated completion times, income/expense tracking, and exportable reports.

Built with Next.js 15 (App Router), React 19, JavaScript (JSX), Tailwind CSS, and
Firebase (Authentication + Firestore).

## How production tracking works

Instead of typing "how many pieces did you make," each machine has a running
**counter** per product. When you log a count:

1. Pick the machine — it shows what it was last running and the last count,
   carried over from the last shift (even across days).
2. Pick the product for each row. If it's a product that's run on this
   machine before, the counter resumes from where it left off; if not, it
   starts at 0.
3. Type in the counter's current reading (not "how many you made" — the
   cumulative total). The amount produced this session is calculated as
   `current − starting count` automatically.
4. If the shift's product order finishes partway through, use **+ Add
   Product** to add another row and switch products mid-shift.

## Features

- Email/password login (Firebase Auth) — single operator/admin role
- **Production Count** entry: counter-based tracking per machine/product with
  automatic carryover between shifts, multi-product rows, and live bill calc
- **Orders**: set a target quantity per machine + product, queue future orders
  in sequence, and get an estimated finish time/shift — blended from today's
  actual counted pace where there's enough data, falling back to the
  product's rated pieces/minute otherwise. Always shown as an estimate.
- **Daily**: today's production broken down by machine → shift → product
- Realtime dashboard: today's/monthly production & revenue, per-machine
  running product/last count/count-left-on-order, daily production chart,
  revenue trend, machine-wise and product-wise charts
- Production log table: search, filter (machine/shift), pagination, view/edit/delete
- Workers CRUD + per-worker profile (working days, duty days, overtime days,
  total production, recent entries)
- Machines CRUD + per-machine profile (production, revenue, daily/monthly charts)
- Products CRUD with price/piece, rated pieces/minute, and total produced/revenue
- **Income**: finished count, price/piece, and computed income per product,
  with first/last logged dates
- **Expenses**: log machine purchases, maintenance, and other factory costs
- Reports: filter by date range, machine, worker, shift, product; export to
  Excel (.xlsx) or print/save as PDF from the browser
- Settings: factory name, shift start times (default 9am/9pm), currency, theme
- Mobile-first responsive layout, skeleton loaders, toast notifications

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, JavaScript (JSX) |
| Styling | Tailwind CSS |
| Auth & DB | Firebase Authentication + Firestore (realtime) |
| Forms | react-hook-form + Zod |
| Charts | Recharts |
| Icons | lucide-react |
| Excel export | xlsx (SheetJS community edition, free) |
| Toasts | sonner |

No paid libraries or services are used anywhere in the project.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) → **Add project**.
2. In the project, enable **Authentication → Sign-in method → Email/Password**.
3. Create at least one user under **Authentication → Users → Add user** —
   this is your operator/admin login (email + password).
4. Enable **Firestore Database** (start in production mode).
5. Go to **Project settings → General → Your apps → Add app → Web**, copy the
   config values.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with the values from step 2:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Deploy Firestore security rules

Install the Firebase CLI if you don't have it, then from the project root:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project, accept defaults, point rules to firestore.rules
firebase deploy --only firestore:rules
```

(Or paste the contents of `firestore.rules` into **Firestore → Rules** in the
console and click Publish.)

### 5. Seed starter data (optional but recommended)

The app works with an empty database — you can add machines, workers, and
products from the UI. To seed the 3 machines / 12 workers / a starter product
list in one go instead, run the seed script:

```bash
node scripts/seed.mjs
```

This requires a Firebase **service account key** — see the comment at the top
of `scripts/seed.mjs` for the one-time setup. Skip this step entirely if you'd
rather add machines/workers/products by hand from the Machines/Workers/Products
pages.

### 6. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`, sign in with the user you created in step 2.

## Deployment

### Vercel (recommended, simplest)

1. Push this project to a GitHub repo.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the same `NEXT_PUBLIC_FIREBASE_*` environment variables in
   **Project Settings → Environment Variables**.
4. Deploy. Vercel builds and hosts the Next.js app for you.

### Firebase Hosting (with Next.js support)

```bash
firebase init hosting
# When asked "What do you want to use as your public directory?" and
# "framework-aware" prompts appear, let the Firebase CLI detect Next.js.
npm run build
firebase deploy --only hosting
```

## Project structure

```
src/
  app/
    login/page.jsx                  Login screen
    (dashboard)/layout.jsx          Auth-guarded shell (sidebar + navbar)
    (dashboard)/dashboard/page.jsx  KPI gauges + charts + per-machine status
    (dashboard)/production/page.jsx Production count entry (counter-based)
    (dashboard)/production/logs/    Production log table (search/filter/CRUD)
    (dashboard)/daily/page.jsx      Today's production by machine × shift × product
    (dashboard)/orders/page.jsx     Target orders, queue, and ETA estimates
    (dashboard)/workers/            Worker CRUD list + [id] profile page
    (dashboard)/machines/           Machine CRUD list + [id] profile page
    (dashboard)/products/page.jsx   Product CRUD (price + rate/minute) + stats
    (dashboard)/income/page.jsx     Per-product finished count and income
    (dashboard)/expenses/page.jsx   Expense CRUD (machines, maintenance, etc.)
    (dashboard)/reports/page.jsx    Filterable report, Excel export, print
    (dashboard)/settings/page.jsx   Factory settings
  components/
    ui/        Reusable primitives (Button, Card, Input, Select, Modal, GaugeStat, Skeleton)
    layout/    Sidebar, Navbar, DashboardShell
  contexts/    AuthContext, SettingsContext
  hooks/       useCollection (realtime Firestore hook)
  lib/         firebase.js, firestore-service.js, schemas.js (Zod), utils.js,
               production-helpers.js (counter carryover, order progress, ETA math)
  types/       Shared shape reference (plain JS — see note below)
firestore.rules
scripts/seed.mjs
jsconfig.json  Path alias config (@/* → src/*) — the JS equivalent of tsconfig.json
```

> **Note on `src/types/`:** this is a plain JS project now, so there's no compile-time
> type checking. `src/types/index.js` just exports `DEFAULT_SETTINGS` (the one runtime
> value that used to live alongside the type definitions) — the shapes themselves
> (Worker, Machine, Product, ProductionLog) are documented in the "Firestore data
> model" section below instead of in code.

## Firestore data model

- `workers/{id}` — name, employee_id, phone, status, created_at
- `machines/{id}` — name, status, created_at
- `products/{id}` — name, price_per_piece, rate_per_minute, created_at
- `production_logs/{id}` — date, shift, machine_id, worker1_id, worker2_id,
  operator_uid, operator_name,
  items[{product_id, start_count, end_count, quantity}], total_quantity,
  total_bill, created_at, updated_at

  `quantity` is always `end_count − start_count`, computed at save time.
  `start_count` is carried over from that product's last saved `end_count`
  on the same machine (0 if it's never been run there before).
- `orders/{id}` — machine_id, product_id, target_quantity, rate_per_minute,
  sequence (queue order within the machine), status (`active` | `queued` |
  `completed`), created_at, completed_at
- `expenses/{id}` — name, category, amount, date, notes, created_at
- `app_config/settings` — factory_name, day_shift_start, night_shift_start,
  currency, theme

## Troubleshooting

### Start here: the connection diagnostics banner

Every page now runs three live checks the moment it loads — are you signed
in, can the app read from Firestore, can it write to Firestore — and shows a
**persistent red banner** (not a toast that disappears) if any of them fail,
with the exact Firebase error code and what to do about it. If saving isn't
working, this banner is the fastest way to see why; no browser dev tools
needed. Click "Re-check now" after you've made a change in the Firebase
console to confirm it's fixed.

### "A tree hydrated but some attributes... didn't match" in the browser console

Fixed as of this version. Several pages computed "today's date" and "the
current shift" *during the initial render* (`todayISO()`, `detectShift()`).
Next.js pre-renders pages like this to static HTML at build time — so the
date baked into that HTML only matched the real date on the day I built it.
Every visit after that, the browser's actual date disagreed with the frozen
build-time date, and React throws exactly this hydration error. Worse, a
hydration mismatch can silently break event handlers on the affected part of
the page — which is the likely reason forms sometimes looked like they saved
but didn't. All date-dependent initial values (`production`, `dashboard`,
`daily`, `reports`) now start blank/neutral and get filled in by a
`useEffect` that only ever runs in the browser after the page has mounted,
so the server-rendered HTML and the browser's first paint always agree.

### A form (Add Machine, Add Worker, etc.) spins forever and never closes

This means the write to Firestore never resolved. As of this version, writes
time out after 10 seconds and show a toast error instead of hanging silently
— if you still see it hang with no error at all, check these in order:

1. **Firestore Database was never created.** Enabling Authentication does
   *not* create a Firestore database — it's a separate step. Go to the
   Firebase console → **Build → Firestore Database → Create database**. This
   is the single most common cause of this exact symptom on a brand-new
   project.
2. **Security rules haven't been published.** See "Deploy Firestore security
   rules" above. Until `firestore.rules` is published, every write is denied.
3. **You're not actually signed in.** The rules require `request.auth != null`.
   Open your browser's dev tools → Application/Storage → check you have a
   Firebase Auth session, or just check that the navbar shows your email.
4. **Wrong Firebase project.** Double check every value in `.env.local`
   matches the *same* Firebase project where you created the Firestore
   database and the rules.

Open the browser console (F12) while submitting the form — a
`permission-denied` or `unavailable` error there will point at exactly which
of the above it is.



## Notes and known simplifications

- **Roles:** the spec calls for a single Admin/operator role, so
  `firestore.rules` grants full read/write to any signed-in user. If you add
  more staff logins later with different permissions, add a `users/{uid}`
  collection with a `role` field and branch the rules on it.
- **Editing a saved production log:** the edit modal lets you correct the
  date/shift/machine/crew. To change products or quantities, delete the entry
  and log it again — this keeps totals and bills consistent rather than
  silently drifting.
- **Worker overtime:** a worker is counted as having worked a 12-hour
  "overtime day" when they appear in **both** the day and night shift logs
  for the same date. If your factory tracks overtime differently (e.g. a
  single log marked as a 12-hour shift), adjust the logic in
  `src/app/(dashboard)/workers/[id]/page.jsx`.
- **Worker pay:** the system tracks production bill value (quantity × price),
  not worker wages — there's no wage-rate field. The worker profile shows
  "bill value contributed" rather than "earnings" to avoid implying a payroll
  calculation that isn't there.
- **PDF export** uses the browser's native print dialog ("Save as PDF")
  rather than a PDF-generation library, to avoid adding a heavy dependency
  for something the browser already does well.
- **Counter carryover:** switching a machine to a product resumes from that
  product's last saved count *on that machine* (0 if it's never run there
  before) — not a global counter shared across machines. Two machines
  running the same product each keep their own count.
- **Order ETAs are estimates, not commitments.** The active order in a
  machine's queue uses today's actual counted pace once there's ~5+ minutes
  of data; before that (or for orders further back in the queue that
  haven't started yet), it falls back to the product's rated pieces/minute.
  Power cuts, machine stops, and staffing changes aren't modeled — the
  Orders page says as much in the UI itself.
- **Order progress** is measured by summing every logged count for that
  order's machine + product since the order was created — so it reflects
  real production, not a separate manual "mark progress" step.
