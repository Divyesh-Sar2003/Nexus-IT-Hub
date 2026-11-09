# Nexus IT Hub

Nexus IT Hub is an enterprise IT operations workspace for hardware, people,
network access, inventory, purchasing, licenses, and IT costs.

## Current stage

The responsive frontend includes the dashboard and module navigation. With no
configured Supabase project, local development stays in an explicitly empty
preview mode and displays no fabricated organization data. When Supabase and
PostgreSQL are configured, the workspace requires a verified Supabase session
and an active organization user profile.

Email/password sign-in, password recovery, session refresh, protected workspace
routes, and server-side role/permission lookup are implemented. New accounts
must be provisioned by an organization administrator; public registration is
disabled. Business CRUD flows and live dashboard aggregates are still pending.

The repository also contains the initial Prisma/PostgreSQL schema, Supabase
client factories, and a tenant-isolated migration. The migration has not been
applied to a Supabase project.

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase and Prisma configuration

1. Copy `.env.example` to `.env`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   from your Supabase project. Set `NEXT_PUBLIC_SITE_URL` to the canonical app
   origin; for local development use `http://localhost:3000`.
3. Set `DATABASE_URL` to the Supabase transaction-pooler connection string and
   `DIRECT_URL` to the direct connection (or session pooler) for migrations.
4. Configure the Supabase Auth email/password provider and allow the local or
   deployed callback URL (`/auth/callback`) in the project's redirect URL list.
5. Generate the Prisma client and apply the migration:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

Use `npm run db:deploy` to apply checked-in migrations in deployment
environments. Do not use `prisma db push` against production. A user must also
be linked to an active `User` profile and organization roles/permissions before
being admitted to the workspace; this version does not provide self-service
registration or an admin provisioning screen.

Never put a service-role key or a database password in a `NEXT_PUBLIC_` variable,
source file, or browser code. No credentials or Supabase project are included.

The initial migration is Supabase-specific: its row-level security policies
resolve the authenticated Supabase user's organization through the server-managed
`User` profile table. Prisma server operations must separately authenticate,
authorize, and scope queries to the organization.

## Project scripts

- `npm run dev` starts the local development server.
- `npm run lint` runs ESLint.
- `npm run build` generates the Prisma client and creates a production build.
- `npm run db:generate` generates the Prisma client.
- `npm run db:validate` validates the Prisma schema.
- `npm run db:migrate` applies development migrations.
- `npm run db:deploy` applies checked-in migrations in deployment environments.

## Structure

- `src/app/` contains the App Router pages and theme tokens.
- `src/components/app-shell.tsx` provides responsive navigation, global
  navigation search, notifications, profile, and theme controls.
- `src/components/dashboard.tsx` contains the executive overview.
- `src/app/(workspace)/[module]/page.tsx` provides the shared module workspace
  view behind the authenticated workspace layout.
- `src/app/(auth)/login/` contains sign-in and password-recovery actions and UI.
- `src/proxy.ts` refreshes and verifies Supabase sessions for protected routes.
- `src/lib/modules.ts` describes the supported application modules.
- `src/lib/supabase/` contains browser and server client factories.
- `src/lib/db.ts` exports the server-side Prisma client.
- `prisma/schema.prisma` and `prisma/migrations/` define the initial data model.
