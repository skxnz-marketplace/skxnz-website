# Production environment checklist

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public browser values. `SUPABASE_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, webhook secrets, database URLs and `OPENAI_API_KEY` are server-only and must never be NEXT_PUBLIC or logged. No committed production secret was found. Prisma `DATABASE_URL`/`DIRECT_URL` remain placeholders and are not used by this Next/Supabase path. Razorpay is not connected.
