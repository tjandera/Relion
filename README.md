# Relion

> An AI-powered networking CRM for early-career professionals.

Relion helps people at the 0 to 3 year career stage build real professional relationships, not just collect contacts. It pairs a relationship tracker with an AI advisor that suggests who to reach out to, what to say, and how to keep conversations going.

This repo holds the working web prototype built for the HEAP programme.

## The problem

Around 80% of jobs are filled through networking, yet most early-career people struggle with:

- Not knowing who to prioritise for outreach
- Not knowing how to start or continue a conversation
- Losing track of contacts and missing follow-up windows
- Feeling lost on oversaturated platforms like LinkedIn

## Features

**Relationship and follow-up manager**
- Track status per contact: not contacted, contacted, replied, follow-up, nurturing
- Follow-up dates so relationships do not go cold
- A notes timeline per contact to keep context over time

**AI outreach generator**
- Set your career goal, target industry, and role
- Generate a personalised outreach draft from the contact's profile plus your own context
- Save drafts as notes on the contact

All contact data is entered by the user. No LinkedIn API needed.

## Tech stack

Heads up for the team: this prototype uses a different stack from the original Express + MongoDB proposal. It was built in Lovable, which runs on:

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19, full-stack with SSR and server functions) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 with shadcn/ui |
| Data | Supabase (Postgres, Auth, Row Level Security) |
| AI | Lovable AI gateway (Gemini) |
| Tooling | Vite 7, Bun |

The Express logic from the proposal can be ported later if we want. For now this is the prototype to demo.

## Project structure (MVC)

TanStack Start uses file-based routing, so the page router and a few framework entry files stay where the framework expects them. Everything else is grouped MVC-style to line up with the backend layout:

```
src/
  models/         Supabase client + Postgres table types         (M)
  controllers/    server functions: contacts, profile, AI        (C)
  views/          app UI components (app shell, status badge)     (V)
  routes/         pages, file-based routing                       (V, page level)
  middleware/     auth guards (attach token, require auth)
  config/         server config helpers
  components/ui/  shadcn/ui design-system primitives
  hooks/  lib/    shared hooks + framework utilities (cn, errors)
  router.tsx, server.ts, start.ts, styles.css                    (framework entry)
supabase/
  schema.sql      run this in the Supabase SQL editor to create the tables
  migrations/     the same schema as timestamped migrations
```

How it maps to the team's backend scaffold:

| MVC layer | Backend scaffold | This prototype |
|---|---|---|
| Model | `models/` (Mongoose) | `src/models/` (Supabase + Postgres types) |
| Controller | `controllers/` | `src/controllers/` (server functions) |
| View | `views/` + `frontend/` | `src/routes/` + `src/views/` |
| Middleware | `middleware/` | `src/middleware/` |
| Config | `config/` | `src/config/` |

## Getting started

Prerequisites: Bun, or Node 20+ with npm. The repo is set up for Bun.

```bash
# 1. Install dependencies
bun install            # or: npm install

# 2. Set up your env file
cp .env.example .env
# .env.example already has the public Supabase keys, so the app will connect.
# Add the service-role key to your local .env only if you need it (the app does not use it yet).

# 3. Create the database tables
# Open the Supabase SQL editor for the project and run supabase/schema.sql:
#   https://supabase.com/dashboard/project/qhdmubotldvbcihrlivs/sql/new
# Paste the whole file and click Run.

# 4. Start the dev server
bun run dev            # or: npm run dev
```

Then open the local URL, create an account on the `/auth` page, and you are in.

## Environment and secrets

See `.env.example`. The publishable/anon key and URL are safe to commit, since Row Level Security protects the data. The service-role key is a full-admin secret and must never be committed. It is kept out of git by the `.env` entry in `.gitignore`.

## License

[MIT](LICENSE)
