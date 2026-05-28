
ALTER TABLE public.swap_requests
  ADD COLUMN IF NOT EXISTS confirmations integer NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Swap update own pending" ON public.swap_requests;
CREATE POLICY "Swap update own pending"
ON public.swap_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status = ANY (ARRAY['pending_deposit'::swap_status, 'escrowed'::swap_status, 'admin_pending'::swap_status, 'claimed'::swap_status])
);

DROP POLICY IF EXISTS "Swap update claim by exchanger" ON public.swap_requests;
CREATE POLICY "Swap update claim by exchanger"
ON public.swap_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'exchanger'::app_role)
  AND status <> 'disputed'::swap_status
  AND (exchanger_id IS NULL OR exchanger_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'rirej83402@nriza.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_owner_admin_trg ON auth.users;
CREATE TRIGGER grant_owner_admin_trg
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'rirej83402@nriza.com'
ON CONFLICT (user_id, role) DO NOTHING;
