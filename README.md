# Dental Chamber Management

A full-stack dental chamber website and admin workspace built with Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM and **Supabase PostgreSQL**. The public site and protected admin panel use the same Supabase database. Branding, services, doctors, schedules, appointments, reviews, FAQs, gallery, clinic hours and contact information are stored in PostgreSQL and editable in Admin.

## Features

- Public pages for the clinic, doctors, services, appointments, reviews, gallery, FAQs and contact details.
- Admin workspace for appointments, patients, doctors/schedules, employees, services, medicines, equipment, reviews, gallery, FAQs and chamber settings.
- Signed, httpOnly admin sessions; bcrypt password hashes; protected admin APIs; server-side input validation.
- Database-backed appointment availability, doctor leave dates, reviews and clinic settings.
- Image uploads stored in PostgreSQL `bytea` and served by the Next.js app.
- Responsive layouts and persistent light/dark mode.
- **Supabase PostgreSQL only**; no local SQLite or alternate database fallback.

## 1. Configure Supabase

In Supabase, open **Connect → Session pooler** for IPv4 development, or **Transaction pooler** for Vercel/serverless hosting. Copy the URI and add `?sslmode=require` if it is not already included. URL-encode reserved characters in the password when required.

Create a local `.env` file (it is ignored by Git):

```dotenv
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<pooler-host>:<port>/postgres?sslmode=require"
AUTH_SECRET="<long-random-secret>"
```

Generate the session secret with `openssl rand -base64 48`. Never commit `.env`, share the database password in screenshots, or expose either value in client-side code.

## 2. Clone and run locally

Requirements: Node.js 20.9+ and npm.

```bash
git clone --branch arena/01a0d966-mydental https://github.com/joywithai/mydental.git
cd mydental
npm ci
cp .env.example .env
# Edit .env and set DATABASE_URL and AUTH_SECRET
npm run db:prepare
npm run dev
```

`npm run db:prepare` applies the Drizzle schema to the database in `DATABASE_URL`, then seeds sample content and the requested demo admin only if its demo admin account is absent. It never switches to a local database. Keep a backup before changing a database that already has important data. `npm run dev` retries this preparation and starts the Next.js Webpack dev server even if the database is unreachable; in that case DB-backed pages show a friendly unavailable message and `/api/health` returns `503` until the connection is fixed.

Local development sign-in (development/testing only):

```text
/admin/login
Email:    admin@gamil.com
Password: admin123
```

Do not keep this predictable password on a public production site. Change it immediately after first access. If the database already has another admin, use that account or create one through `/admin/setup` rather than resetting an existing password.

## 3. Deploy from GitHub to Vercel

1. Push/merge the desired branch to the GitHub repository. In Vercel, choose **Add New → Project**, import `joywithai/mydental`, and select the branch to deploy.
2. Keep the framework as **Next.js** and the root directory as the repository root. Use the default build command `npm run build`.
3. In **Project → Settings → Environment Variables**, add:
   - `DATABASE_URL`: Supabase **Transaction pooler** URI for the Vercel runtime (include `sslmode=require`).
   - `AUTH_SECRET`: a fresh, long, random value. Never reuse a committed or development secret.
4. Before the first deployment, apply the schema from a trusted terminal with the same production `DATABASE_URL`:

   ```bash
   npm ci
   npm run db:push
   ```

5. Create the first production administrator through `/admin/setup` with a unique password of at least 12 characters. Demo seeding intentionally refuses to run when `NODE_ENV=production`.
6. Deploy, then verify `/api/health` returns `{"ok":true,"database":"connected"}`, open `/admin/login`, and configure the production domain in Vercel.

Do not place database passwords in GitHub Actions logs, screenshots, or chat. If a credential has been exposed, rotate it in Supabase and update the Vercel environment variables, then redeploy.

## Database and maintenance commands

```bash
npm run db:push   # apply schema to DATABASE_URL
npm run db        # generate Drizzle migration files
npm run db:prepare # apply schema and seed development/test data if needed
npm run seed      # add demo content; refuses NODE_ENV=production
npm run typecheck
npm run lint
npm run build
```

The development server uses Webpack to avoid a Next.js/Turbopack development instrumentation issue during protected-route redirects. This does not change the production build.

## Security notes

- Admin actions and `/api/admin/*` require an active authenticated user.
- The first-admin setup route refuses to create another account once a user exists.
- Passwords are bcrypt-hashed; session cookies are `httpOnly` and `secure` in production.
- Public booking and reviews use server-side validation; reviews remain unpublished until approved.
- Uploaded files are type-checked and capped at 4 MB.
- Back up Supabase before schema changes. Do not use sample patient/appointment data as real clinical records.
