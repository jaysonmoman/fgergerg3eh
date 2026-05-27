-- Subject (purpose/note) editable by the user/admin to signal exchanger what the swap is for.
ALTER TABLE public.swap_requests
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS payout_kind text NOT NULL DEFAULT 'crypto',
  ADD COLUMN IF NOT EXISTS payout_details jsonb;

-- Validate payout_kind values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'swap_requests_payout_kind_chk'
  ) THEN
    ALTER TABLE public.swap_requests
      ADD CONSTRAINT swap_requests_payout_kind_chk
      CHECK (payout_kind IN ('crypto','fiat','item'));
  END IF;
END $$;

-- Allow the swap owner to update their own swap (subject / payout_details) while still pending.
DROP POLICY IF EXISTS "Swap update own pending" ON public.swap_requests;
CREATE POLICY "Swap update own pending"
ON public.swap_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status IN ('pending_deposit','escrowed','admin_pending','claimed'));
