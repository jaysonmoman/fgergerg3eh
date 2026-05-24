
-- Enums
create type public.app_role as enum ('admin', 'exchanger', 'user');
create type public.swap_status as enum (
  'pending_deposit', 'escrowed', 'claimed', 'fulfilled', 'completed',
  'expired', 'refunded', 'admin_pending'
);
create type public.swap_type as enum ('user', 'admin');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles select own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Roles select own" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Auto profile + default role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Swap requests
create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  short_id text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  user_id uuid references auth.users(id) on delete set null,
  swap_type public.swap_type not null default 'user',
  from_currency text not null,
  to_currency text not null,
  from_amount numeric not null check (from_amount > 0),
  to_amount numeric,
  rate numeric,
  destination_address text not null,
  deposit_address text,
  deposit_txid text,
  payout_txid text,
  exchanger_id uuid references auth.users(id) on delete set null,
  exchanger_payout_address text,
  status public.swap_status not null default 'pending_deposit',
  notes text,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.swap_requests enable row level security;

create index on public.swap_requests (status);
create index on public.swap_requests (user_id);
create index on public.swap_requests (exchanger_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger swap_requests_touch before update on public.swap_requests
  for each row execute function public.touch_updated_at();

-- Owners see their own
create policy "Swap select own" on public.swap_requests
  for select to authenticated using (auth.uid() = user_id);

-- Exchangers see escrowed or admin-posted swaps (the order book)
create policy "Swap select orderbook for exchangers" on public.swap_requests
  for select to authenticated using (
    public.has_role(auth.uid(), 'exchanger')
    and status in ('escrowed', 'admin_pending', 'claimed', 'fulfilled')
  );

-- Exchangers see swaps they have claimed
create policy "Swap select own claimed" on public.swap_requests
  for select to authenticated using (auth.uid() = exchanger_id);

-- Admins see all
create policy "Swap select admin" on public.swap_requests
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Users create their own user-type swap
create policy "Swap insert own" on public.swap_requests
  for insert to authenticated with check (
    auth.uid() = user_id and swap_type = 'user'
  );

-- Admins insert anything (incl. admin_pending)
create policy "Swap insert admin" on public.swap_requests
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

-- Exchangers can claim an open swap (server fn enforces the state transition)
create policy "Swap update claim by exchanger" on public.swap_requests
  for update to authenticated using (
    public.has_role(auth.uid(), 'exchanger')
    and (exchanger_id is null or exchanger_id = auth.uid())
  );

-- Admins update all
create policy "Swap update admin" on public.swap_requests
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
