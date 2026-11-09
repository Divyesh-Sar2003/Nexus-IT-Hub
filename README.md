# Nexus IT Hub

Nexus IT Hub is an enterprise IT operations workspace for hardware, people,
network access, inventory, purchasing, licenses, and IT costs.

## Current stage

The responsive frontend is being built before the authenticated data workflows.
The dashboard and module routes currently show intentional empty states: there
are no seeded/demo business records, and dashboard values are not fabricated.
Sign-in, permissions, organization data, and CRUD actions are not connected yet.

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
   from your Supabase project.
3. Set `DATABASE_URL` to the Supabase transaction-pooler connection string and
   `DIRECT_URL` to the direct connection (or session pooler) for migrations.
4. Generate the Prisma client and apply the migration:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

Use `npm run db:deploy` to apply checked-in migrations in deployment
environments. Do not use `prisma db push` against production.

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
- `src/app/[module]/page.tsx` provides the shared module workspace view.
- `src/lib/modules.ts` describes the supported application modules.
- `src/lib/supabase/` contains browser and server client factories.
- `src/lib/db.ts` exports the server-side Prisma client.
- `prisma/schema.prisma` and `prisma/migrations/` define the initial data model.
