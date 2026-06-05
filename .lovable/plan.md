# Relion — Prototype Plan

A working v1 web app prototype for the HEAP programme. Responsive, mobile-friendly. Built in the "Human-centric warmth" direction (warm neutrals, Instrument Sans, soft cards).

## What we'll build

### 1. Foundation
- Apply the chosen design tokens (warm neutrals, Instrument Sans) to the global stylesheet.
- Enable Lovable Cloud for database, auth, and AI gateway (replaces the proposal's Express + MongoDB stack for the prototype).
- Add Lovable AI for the message generator (no API keys required).

### 2. Authentication
- Email + password signup/login (email confirmation off so testing is instant).
- Auto-create a `profiles` row on signup to store the user's name, target role/industry, and career goal (used as context for the AI).
- Protected app routes; unauthenticated users land on `/auth`.

### 3. Dashboard (`/`)
- Greeting + "intention for today" card in the sidebar.
- Three metric cards: Active Connections, Pending Follow-ups, Replies this week.
- Relationship Pipeline list (recent contacts with status badge).
- Recent Notes section.

### 4. Contacts CRM (`/contacts`)
- List/table of all contacts with avatar, name, role/company, status badge, last-touch date.
- Add Contact dialog: name, role, company, how-we-met, status, notes.
- Status options: Not contacted → Contacted → Replied → Follow-up → Nurturing.
- Click a contact → detail page with notes timeline, status changer, follow-up date, and an "Open AI Generator" shortcut.

### 5. Follow-up reminders
- Each contact has an optional `follow_up_at` date.
- Dashboard surfaces contacts due today / overdue.
- Simple in-app reminder list (no email scheduler in v1 — can add later).

### 6. AI Outreach Generator (`/messages` and inline panel)
- User picks a contact + adds optional context ("they just got promoted").
- Server function calls Lovable AI with the user's career goal + contact details + context.
- Returns a personalized draft; user can copy, regenerate, or save as a note on the contact.

### 7. Brand polish
- Logo mark, app shell, empty states, loading states.
- Mobile responsive: sidebar collapses to bottom nav on small screens.
- SEO meta tags per route.

## Out of scope for v1 (can add later)
- Sending email through Relion (Lovable Email — easy add).
- AI "what to say next" coaching chat.
- Analytics charts (reply-rate over time).
- Team / multi-user features.
- Importing contacts from LinkedIn (proposal already excludes this).

## Technical notes (for your team)
- Stack the prototype actually uses: **TanStack Start (React) + Tailwind + Lovable Cloud (Postgres/auth/storage on Supabase) + Lovable AI Gateway (Gemini)**. This differs from your proposal's Express + MongoDB + Render — worth telling your HEAP mentor that Lovable is the prototyping environment. Logic can be ported later if needed.
- Data model:
  - `profiles` (id → auth.users, full_name, career_goal, target_industry, target_role)
  - `contacts` (id, user_id, name, role, company, how_met, status, follow_up_at, created_at)
  - `notes` (id, contact_id, user_id, body, created_at)
  - `messages` (id, contact_id, user_id, context_input, generated_body, created_at)
- RLS: every table scoped to `auth.uid() = user_id`.
- AI: server function using `google/gemini-3-flash-preview` via the gateway — no key setup needed.

## Build order
1. Cloud + auth + profiles + onboarding (capture career goal).
2. Contacts CRUD + status pipeline + contact detail.
3. Dashboard with metrics and follow-up list.
4. AI message generator + saved messages.
5. Mobile polish + empty/loading states.

After you approve, I'll start at step 1.
