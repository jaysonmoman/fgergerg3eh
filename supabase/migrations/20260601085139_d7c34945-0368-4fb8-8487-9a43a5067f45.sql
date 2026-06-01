-- Restrict which columns exchangers (and non-owners) can modify on swap_requests.
-- RLS WITH CHECK cannot reference OLD, so we enforce column-level immutability via a trigger.

CREATE OR REPLACE FUNCTION public.enforce_swap_update_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin');
  is_owner boolean := (auth.uid() = OLD.user_id);
BEGIN
  -- Admins and the swap owner can change anything their RLS policy already allows.
  IF is_admin OR is_owner THEN
    RETURN NEW;
  END IF;

  -- Everyone else (i.e. exchangers acting on someone else's swap) may only
  -- modify the operational columns below. Any change to a sensitive field
  -- is rejected.
  IF NEW.user_id        IS DISTINCT FROM OLD.user_id        THEN RAISE EXCEPTION 'user_id is immutable'; END IF;
  IF NEW.from_currency  IS DISTINCT FROM OLD.from_currency  THEN RAISE EXCEPTION 'from_currency is immutable'; END IF;
  IF NEW.to_currency    IS DISTINCT FROM OLD.to_currency    THEN RAISE EXCEPTION 'to_currency is immutable'; END IF;
  IF NEW.from_amount    IS DISTINCT FROM OLD.from_amount    THEN RAISE EXCEPTION 'from_amount is immutable'; END IF;
  IF NEW.to_amount      IS DISTINCT FROM OLD.to_amount      THEN RAISE EXCEPTION 'to_amount is immutable'; END IF;
  IF NEW.rate           IS DISTINCT FROM OLD.rate           THEN RAISE EXCEPTION 'rate is immutable'; END IF;
  IF NEW.destination_address IS DISTINCT FROM OLD.destination_address THEN RAISE EXCEPTION 'destination_address is immutable'; END IF;
  IF NEW.deposit_address IS DISTINCT FROM OLD.deposit_address THEN RAISE EXCEPTION 'deposit_address is immutable'; END IF;
  IF NEW.deposit_txid   IS DISTINCT FROM OLD.deposit_txid   THEN RAISE EXCEPTION 'deposit_txid is immutable'; END IF;
  IF NEW.payout_kind    IS DISTINCT FROM OLD.payout_kind    THEN RAISE EXCEPTION 'payout_kind is immutable'; END IF;
  IF NEW.payout_details IS DISTINCT FROM OLD.payout_details THEN RAISE EXCEPTION 'payout_details is immutable'; END IF;
  IF NEW.subject        IS DISTINCT FROM OLD.subject        THEN RAISE EXCEPTION 'subject is immutable'; END IF;
  IF NEW.swap_type      IS DISTINCT FROM OLD.swap_type      THEN RAISE EXCEPTION 'swap_type is immutable'; END IF;
  IF NEW.short_id       IS DISTINCT FROM OLD.short_id       THEN RAISE EXCEPTION 'short_id is immutable'; END IF;
  IF NEW.created_at     IS DISTINCT FROM OLD.created_at     THEN RAISE EXCEPTION 'created_at is immutable'; END IF;
  IF NEW.expires_at     IS DISTINCT FROM OLD.expires_at     THEN RAISE EXCEPTION 'expires_at is immutable'; END IF;

  -- Exchanger may only claim a swap that is unclaimed, or act on one they already claimed.
  IF OLD.exchanger_id IS NOT NULL AND OLD.exchanger_id <> auth.uid() THEN
    RAISE EXCEPTION 'swap already claimed by another exchanger';
  END IF;
  IF NEW.exchanger_id IS DISTINCT FROM OLD.exchanger_id AND NEW.exchanger_id <> auth.uid() THEN
    RAISE EXCEPTION 'exchanger_id can only be set to your own user id';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_swap_update_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS swap_requests_enforce_update_columns ON public.swap_requests;
CREATE TRIGGER swap_requests_enforce_update_columns
BEFORE UPDATE ON public.swap_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_swap_update_columns();