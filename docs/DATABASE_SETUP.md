# Database Setup For SKXNZ

## What PostgreSQL Is

PostgreSQL is a database. It stores structured data like users, products, carts, orders, returns, and support tickets.

For SKXNZ, PostgreSQL is the long-term source of truth once the MVP moves beyond browser-local mock state.

## Why SKXNZ Needs A Database

Right now, much of the MVP uses seeded data and browser-local state for safe private testing.

SKXNZ will need a real database later for things like:

- buyer accounts
- seller applications
- approved products
- carts
- orders
- returns
- support tickets
- admin audit logs

Without a database, those flows do not persist across devices or real users.

## What Prisma Does

Prisma is the tool that connects the app to the database in a beginner-friendly way.

Prisma helps with:

- defining the database structure in `prisma/schema.prisma`
- generating a typed database client
- creating migrations
- seeding starter data

## What DATABASE_URL Means

`DATABASE_URL` is the connection string Prisma uses to find your PostgreSQL database.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

That string tells Prisma:

- which database type to use
- which user and password to log in with
- which host and port to connect to
- which database name to open

## Why .env Is Private

`.env` contains private connection details.

It should never be committed to Git because it may include:

- database passwords
- secret API keys
- staging or production credentials

`.env.example` is safe to commit because it uses fake placeholder values only.

## Beginner Database Options

### Neon

Good if you want a hosted PostgreSQL database without managing your own server.

- Website: [https://neon.tech](https://neon.tech)
- Good for: quick cloud setup, private testing, simple hosted Postgres

### Supabase

Good if you want hosted PostgreSQL with an easy dashboard.

- Website: [https://supabase.com](https://supabase.com)
- Good for: hosted Postgres plus admin tools

### Local PostgreSQL

Good if you want everything on your own machine while learning.

- Good for: offline local development
- You will need PostgreSQL installed and running locally

## Setup Commands

1. Install dependencies:

```bash
npm install
```

2. Copy the env file:

```bash
cp .env.example .env
```

3. Add your real local or hosted PostgreSQL connection string to `.env`.

4. Generate Prisma Client:

```bash
npx prisma generate
```

5. Create and apply your local development migration:

```bash
npx prisma migrate dev --name init
```

6. Seed the placeholder SKXNZ data:

```bash
npm run db:seed
```

7. Start the app:

```bash
npm run dev
```

## Common Errors

### Missing DATABASE_URL

Problem:

- Prisma commands fail because no database connection string exists.

Fix:

- make sure `.env` exists
- make sure `DATABASE_URL="..."` is set
- restart the command after saving `.env`

### Migration Failed

Problem:

- `npx prisma migrate dev` stops with a schema or database error

Fix:

- confirm PostgreSQL is running
- confirm the database in `DATABASE_URL` exists
- run `npx prisma generate` first
- check the exact schema field or enum mentioned in the error

### Seed Failed

Problem:

- `npm run db:seed` fails before or during inserts

Fix:

- confirm the migration finished first
- confirm the database is reachable
- confirm Prisma Client generated successfully
- confirm the schema matches the seed script

### Prisma Engine Issue

Problem:

- Prisma fails to load its engine on some local machines

Fix:

- reinstall dependencies
- rerun `npx prisma generate`
- make sure Node, Prisma, and your installed dependencies match the project lockfile
- if the issue is machine-specific, test on another terminal session or reinstall dependencies cleanly

### Wrong Database URL Format

Problem:

- Prisma says the connection string is invalid

Fix:

- make sure it starts with `postgresql://`
- make sure user, password, host, port, and database name are included
- keep the full string inside quotes in `.env`

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/skxnz_mvp?schema=public"
```

## Safety Notes

- Payments are not live.
- Real AI is not connected.
- Delivery API is not connected.
- Seller payouts are not live.
- Authentication is demo or MVP only.
- Do not use real customer payment data yet.
- Do not point this MVP at a production database until the write flows are properly reviewed.
