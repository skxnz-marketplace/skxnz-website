# SKXNZ — Project Guide for Codex

SKXNZ ("Wear The Signal") is an AI-powered, multi-seller fashion marketplace.
Read PROGRESS.md before starting ANY work, and update it before you finish.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase — Postgres, Auth, Storage, Edge Functions
- Hosting: Vercel (region: Mumbai / bom1)
- Payments: Razorpay | Shipping: Shiprocket | AI: Codex API
- Deploy flow: push to GitHub -> Vercel auto-deploys. Keep `main` always deployable.

## Who you're working with
The owner is non-technical. Explain in plain language, give copy-paste commands,
don't assume coding knowledge. One change at a time; show what you changed.

## Hard rules (never break)
- Enable Row Level Security (RLS) on EVERY Supabase table with explicit policies. Never ship a table with RLS off.
- Never store raw card data (number/CVV/expiry). Only last 4 digits + issuer name. Saved cards = Razorpay tokenization.
- Payments are server-authoritative: create Razorpay orders server-side using amounts from the DB; only mark an order paid from a signature-verified Razorpay webhook. Never trust the client.
- Keep all secrets server-side (Supabase service_role key, Razorpay/Shiprocket keys). Never expose them to the browser.
- Money is stored as integer paise, never floats.
- Validate all input (zod) and enforce auth on every server route.

## Conventions
- Generate and use TypeScript types from the Supabase schema (one source of truth for DB + frontend).
- Status fields are enums (order_status, payment_status, shipment_status).
- Every table has created_at, updated_at, and an owner column for RLS.
- Small, logical commits with clear messages.

## Workflow every session
1. Read PROGRESS.md.
2. Do the task.
3. Update PROGRESS.md ("Done this session" + "Next up").
4. Commit + push.
