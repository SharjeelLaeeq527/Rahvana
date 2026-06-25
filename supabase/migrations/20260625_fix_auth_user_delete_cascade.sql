-- ============================================================
-- Fix: deleting a row from auth.users was blocked by several FKs
-- that had NO "ON DELETE" action (default NO ACTION / RESTRICT).
-- The DB schema has drifted from the migration files (e.g.
-- user_221g_cases exists in the DB but not in supabase/migrations),
-- so instead of hard-coding each table we discover EVERY foreign
-- key that references auth.users and, where it has no delete rule
-- (or RESTRICT), recreate it with ON DELETE CASCADE.
--
-- This is idempotent: FKs already set to CASCADE/SET NULL are left
-- untouched (confdeltype filter below).
-- ============================================================

DO $$
DECLARE
  fk RECORD;
  fk_def TEXT;
BEGIN
  FOR fk IN
    SELECT c.oid,
           c.conname,
           c.conrelid::regclass AS tbl
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.confrelid = 'auth.users'::regclass
      -- only the ones that would block a delete:
      -- 'a' = NO ACTION, 'r' = RESTRICT
      AND c.confdeltype IN ('a', 'r')
  LOOP
    -- pg_get_constraintdef returns e.g. "FOREIGN KEY (user_id) REFERENCES auth.users(id)"
    fk_def := pg_get_constraintdef(fk.oid);

    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I, ADD CONSTRAINT %I %s ON DELETE CASCADE',
      fk.tbl, fk.conname, fk.conname, fk_def
    );

    RAISE NOTICE 'Set ON DELETE CASCADE: %.%', fk.tbl, fk.conname;
  END LOOP;
END $$;

-- ============================================================
-- Now delete the target account. Every child row is removed
-- automatically by the cascade rules set above.
-- ============================================================
DELETE FROM auth.users WHERE email = 'khashir657@gmail.com';
