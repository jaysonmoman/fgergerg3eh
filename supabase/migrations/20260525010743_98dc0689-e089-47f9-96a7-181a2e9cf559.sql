create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.app_settings enable row level security;

create policy "Settings select admin" on public.app_settings
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Settings upsert admin" on public.app_settings
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "Settings update admin" on public.app_settings
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.app_settings (key, value) values ('auto_payouts_enabled', 'false'::jsonb)
on conflict (key) do nothing;