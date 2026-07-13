# Disposable QA apply order

Disposable Supabase QA only, never production. Preflight catalog baseline and backups first; apply 0005, 0006, corrected 0008, 0009, 0010, 0011 in that order (0007 only if wishlist QA is in scope). Stop on any error; record SQL editor output. Do not attempt automatic rollback.
