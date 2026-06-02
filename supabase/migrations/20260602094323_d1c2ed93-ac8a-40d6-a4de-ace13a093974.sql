-- 1) Extend the enforce_swap_update_columns trigger so even the swap owner
--    cannot mutate price/amount/address fields after the swap is created.
--    Owners may still edit subject, payout_details, deposit_txid, notes,
--    and move status forward via the existing server functions.
CREATE OR REPLACE FUNCTION public.enforce_swap_update_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin');
  is_owner boolean := (auth.uid() = OLD.user_id);
  is_exchanger boolean := (auth.uid() = OLD.exchanger_id) OR (OLD.exchanger_id IS NULL);
BEGIN
  -- Admins bypass all column locks.
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Hard-immutable fields for everyone except admin.
  IF NEW.user_id        IS DISTINCT FROM OLD.user_id        THEN RAISE EXCEPTION 'user_id is immutable'; END IF;
  IF NEW.from_currency  IS DISTINCT FROM OLD.from_currency  THEN RAISE EXCEPTION 'from_currency is immutable'; END IF;
  IF NEW.to_currency    IS DISTINCT FROM OLD.to_currency    THEN RAISE EXCEPTION 'to_currency is immutable'; END IF;
  IF NEW.from_amount    IS DISTINCT FROM OLD.from_amount    THEN RAISE EXCEPTION 'from_amount is immutable'; END IF;
  IF NEW.to_amount      IS DISTINCT FROM OLD.to_amount      THEN RAISE EXCEPTION 'to_amount is immutable'; END IF;
  IF NEW.rate           IS DISTINCT FROM OLD.rate           THEN RAISE EXCEPTION 'rate is immutable'; END IF;
  IF NEW.destination_address IS DISTINCT FROM OLD.destination_address THEN RAISE EXCEPTION 'destination_address is immutable'; END IF;
  IF NEW.deposit_address IS DISTINCT FROM OLD.deposit_address THEN RAISE EXCEPTION 'deposit_address is immutable'; END IF;
  IF NEW.payout_kind    IS DISTINCT FROM OLD.payout_kind    THEN RAISE EXCEPTION 'payout_kind is immutable'; END IF;
  IF NEW.swap_type      IS DISTINCT FROM OLD.swap_type      THEN RAISE EXCEPTION 'swap_type is immutable'; END IF;
  IF NEW.short_id       IS DISTINCT FROM OLD.short_id       THEN RAISE EXCEPTION 'short_id is immutable'; END IF;
  IF NEW.created_at     IS DISTINCT FROM OLD.created_at     THEN RAISE EXCEPTION 'created_at is immutable'; END IF;
  IF NEW.expires_at     IS DISTINCT FROM OLD.expires_at     THEN RAISE EXCEPTION 'expires_at is immutable'; END IF;

  -- Owner-only flow: owner may change subject, payout_details, deposit_txid,
  -- notes, confirmations, status. Exchanger fields stay locked.
  IF is_owner THEN
    IF NEW.exchanger_id IS DISTINCT FROM OLD.exchanger_id THEN
      RAISE EXCEPTION 'owner cannot modify exchanger_id';
    END IF;
    IF NEW.exchanger_payout_address IS DISTINCT FROM OLD.exchanger_payout_address THEN
      RAISE EXCEPTION 'owner cannot modify exchanger_payout_address';
    END IF;
    IF NEW.payout_txid IS DISTINCT FROM OLD.payout_txid THEN
      RAISE EXCEPTION 'owner cannot modify payout_txid';
    END IF;
    RETURN NEW;
  END IF;

  -- Exchanger flow: deposit_txid, subject, payout_details stay locked.
  IF NEW.deposit_txid   IS DISTINCT FROM OLD.deposit_txid   THEN RAISE EXCEPTION 'deposit_txid is immutable'; END IF;
  IF NEW.subject        IS DISTINCT FROM OLD.subject        THEN RAISE EXCEPTION 'subject is immutable'; END IF;
  IF NEW.payout_details IS DISTINCT FROM OLD.payout_details THEN RAISE EXCEPTION 'payout_details is immutable'; END IF;

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

-- 2) Lock down EXECUTE on trigger-only SECURITY DEFINER functions. They are
--    fired by Postgres triggers, never called over PostgREST, so removing
--    EXECUTE from anon/authenticated does not break the app. has_role is left
--    callable because RLS policies + server functions rpc into it.
REVOKE EXECUTE ON FUNCTION public.enforce_swap_update_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_owner_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;