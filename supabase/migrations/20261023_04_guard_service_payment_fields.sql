-- Service booking payment fields are server-owned.
--
-- Standalone Medical / PCC / Translation / Consultation requests are created
-- unpaid and only /api/wallet/deduct-service (service_role) marks them paid after
-- charging credits; journey requests are marked paid by the booking routes after
-- verifying the journey. Some routes write these tables with the user's own
-- client, so `authenticated` holds own-row write access on at least
-- translation_documents. Without a guard, a signed-in user could PATCH their own
-- row to payment_status = 'paid' (or awaiting_payment = false) through PostgREST
-- and get the service for free.
--
-- Fix: for the `authenticated` / `anon` roles these fields are pinned: an INSERT
-- is always unpaid, an UPDATE keeps the stored values. Nothing is raised, so the
-- user's legitimate writes (confirm, request changes) keep working.
-- service_role is unaffected.
--
-- Also brings the consultation_bookings policies in the migration files in line
-- with the live database (docs/DATABASE_AUDIT.md CR-4): the original
-- 20260228_14 policies allowed anyone to read every booking and insert any row.

CREATE OR REPLACE FUNCTION public.guard_service_payment_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- NULL role = migrations / SQL editor (privileged), like service_role.
  IF auth.role() IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.payment_status := 'pending';
      NEW.payment_id := NULL;
    ELSE
      NEW.payment_status := OLD.payment_status;
      NEW.payment_id := OLD.payment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Same, for the tables that also carry the hidden-draft flag.
CREATE OR REPLACE FUNCTION public.guard_service_payment_fields_with_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- NULL role = migrations / SQL editor (privileged), like service_role.
  IF auth.role() IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.payment_status := 'pending';
      NEW.payment_id := NULL;
      NEW.awaiting_payment := TRUE;
    ELSE
      NEW.payment_status := OLD.payment_status;
      NEW.payment_id := OLD.payment_id;
      NEW.awaiting_payment := OLD.awaiting_payment;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
  has_payment_id BOOLEAN;
BEGIN
  FOREACH t IN ARRAY ARRAY['translation_documents', 'consultation_bookings'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_guard_payment_fields ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_guard_payment_fields BEFORE INSERT OR UPDATE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.guard_service_payment_fields()', t);
    END IF;
  END LOOP;

  FOREACH t IN ARRAY ARRAY['appointments', 'police_verification_requests'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_guard_payment_fields ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_guard_payment_fields BEFORE INSERT OR UPDATE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.guard_service_payment_fields_with_draft()', t);
    END IF;
  END LOOP;

  -- Every table above must have the columns the guard pins.
  FOREACH t IN ARRAY ARRAY['translation_documents', 'consultation_bookings', 'appointments', 'police_verification_requests'] LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'payment_id'
    ) INTO has_payment_id;
    IF to_regclass('public.' || t) IS NOT NULL AND NOT has_payment_id THEN
      RAISE EXCEPTION 'public.% has no payment_id column; adjust guard_service_payment_fields', t;
    END IF;
  END LOOP;
END $$;

-- consultation_bookings: own-row reads only; every write goes through server routes.
DROP POLICY IF EXISTS "Public can create consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Public can view consultation bookings" ON public.consultation_bookings;

DROP POLICY IF EXISTS "consultation_bookings_select_own" ON public.consultation_bookings;
CREATE POLICY "consultation_bookings_select_own" ON public.consultation_bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.consultation_bookings FROM anon;
