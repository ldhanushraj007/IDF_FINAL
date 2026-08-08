-- ============================================================================
-- IN DESIGN LUXURY FABRICS — Supabase schema
--
-- HOW TO RUN THIS: Supabase dashboard -> SQL Editor -> New query -> paste this
-- whole file -> Run. Safe to re-run if something goes wrong partway; every
-- statement either uses IF NOT EXISTS or is wrapped to tolerate re-running.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PRODUCTS — the live catalog. Publicly readable; only an admin can write.
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('Bridal','Heritage','Contemporary')),
  composition text not null default '',
  width text not null default '44 in',
  price_per_metre integer not null check (price_per_metre > 0),
  mrp integer,
  min_metres integer not null default 1 check (min_metres > 0),
  stock text not null default 'in' check (stock in ('in','low','out')),
  tags text[] not null default '{}',
  image text not null default '',
  gallery text[] not null default '{}',
  blurb text not null default '',
  details text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products are publicly readable" on public.products;
create policy "products are publicly readable"
  on public.products for select
  using (true);

-- Writes to products are now handled exclusively via the admin-api Edge Function
-- which uses the service_role key to bypass RLS.

-- ---------------------------------------------------------------------------
-- ADMINS — Independent admin table, not tied to auth.users.
-- Only accessible via the admin-auth and admin-api Edge Functions.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  email text not null,
  login_code_hash text,
  login_code_expires_at timestamptz,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.admins enable row level security;
-- No RLS policies granted: only the service_role key can read/write this table.

-- ---------------------------------------------------------------------------
-- SITE SETTINGS — a single row holding the offer banner. Publicly readable;
-- only an admin can write.
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id boolean primary key default true,
  offer_active boolean not null default false,
  offer_headline text not null default '',
  offer_detail text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

insert into public.site_settings (id) values (true)
  on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site settings are publicly readable" on public.site_settings;
create policy "site settings are publicly readable"
  on public.site_settings for select
  using (true);

-- Writes to site_settings are now handled exclusively via the admin-api Edge Function.

-- ---------------------------------------------------------------------------
-- REVIEWS — every row is tied to a real, verified auth.users identity
-- (Google account, or email confirmed by a code). Only 'published' rows are
-- publicly visible; the admin panel is what moves a review into that state.
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  -- Nullable so the admin can add a legacy/manual review (e.g. one collected
  -- before this system existed) that isn't tied to a customer account.
  -- Every review a CUSTOMER submits through the site always has this set.
  user_id uuid references auth.users(id) on delete cascade,
  user_email text not null default '',
  name text not null,
  city text not null default '',
  rating smallint not null check (rating between 1 and 5),
  review_text text not null check (char_length(review_text) >= 4),
  status text not null default 'pending' check (status in ('pending','published','private')),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "published reviews are publicly readable" on public.reviews;
create policy "published reviews are publicly readable"
  on public.reviews for select
  using (status = 'published');

drop policy if exists "customers can read their own review" on public.reviews;
create policy "customers can read their own review"
  on public.reviews for select
  using (auth.uid() = user_id);

drop policy if exists "signed-in customers can submit a review" on public.reviews;
create policy "signed-in customers can submit a review"
  on public.reviews for insert
  with check (
    -- A real customer, submitting as themselves...
    (auth.uid() = user_id and auth.email() = user_email)
  );

-- Moderation and deletion are now handled exclusively via the admin-api Edge Function.

-- ---------------------------------------------------------------------------
-- ADMIN LOGIN ATTEMPTS — brute-force throttling for the admin-auth function.
-- No RLS policies are granted on purpose: this table is written and read
-- only by the Edge Function's service-role key, which bypasses RLS. No
-- client using the public anon key can read or write it.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now(),
  username text not null,
  success boolean not null,
  ip text
);

alter table public.admin_login_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- Keep updated_at accurate automatically.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch_updated_at on public.site_settings;
create trigger settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- REALTIME — lets the site subscribe to live changes instead of polling.
-- Wrapped because re-running "alter publication ... add table" on a table
-- that's already a member throws an error; this makes the script safe to
-- run more than once.
-- ---------------------------------------------------------------------------
do $$
begin
  execute 'alter publication supabase_realtime add table public.products';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.site_settings';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.reviews';
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- CUSTOMERS, ORDERS, WISHLIST — accounts that gate purchases and reviews,
-- and the record-keeping behind them.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- CUSTOMERS — one row per account. Populated the first time someone signs in
-- and refreshed at checkout, so it stays current even if they signed up with
-- just an email and added a phone number later.
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  city text not null default '',
  signup_method text not null default '', -- 'google' | 'email' | 'phone'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;

drop policy if exists "customers can read their own profile" on public.customers;
create policy "customers can read their own profile"
  on public.customers for select
  using (auth.uid() = user_id or auth.uid() in (select user_id from public.admins));

drop policy if exists "customers can write their own profile" on public.customers;
create policy "customers can write their own profile"
  on public.customers for insert
  with check (auth.uid() = user_id);

drop policy if exists "customers can update their own profile" on public.customers;
create policy "customers can update their own profile"
  on public.customers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ORDERS — a real record of every order placed, tied to the account that
-- placed it. Previously an order only ever existed as WhatsApp text; this is
-- what makes order history and "number of purchases" possible.
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  subtotal integer not null default 0,
  discount integer not null default 0,
  shipping integer not null default 0,
  total integer not null default 0,
  requirement text not null default '',
  fulfilment text not null default 'delivery',
  address text not null default '',
  city text not null default '',
  pincode text not null default '',
  payment_method text not null default 'upi', -- 'upi' | 'store'
  paid boolean not null default false,
  payment_reference text not null default '',
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  order_status text not null default 'pending_whatsapp' check (order_status in ('pending_whatsapp','confirmed','fulfilled')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "customers can read their own orders" on public.orders;
create policy "customers can read their own orders"
  on public.orders for select
  using (auth.uid() = customer_id);
-- Admin reads orders via the admin-api Edge Function (service_role key bypasses RLS).

drop policy if exists "customers can create their own orders" on public.orders;
create policy "customers can create their own orders"
  on public.orders for insert
  with check (auth.uid() = customer_id);

-- ---------------------------------------------------------------------------
-- WISHLIST
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlist enable row level security;

drop policy if exists "customers manage their own wishlist" on public.wishlist;
create policy "customers manage their own wishlist"
  on public.wishlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- APP CONFIG — small settings table. Currently just the Google Sheets sync
-- URL, kept here (not in code) so it can be changed without a redeploy.
-- ---------------------------------------------------------------------------
create table if not exists public.app_config (
  key text primary key,
  value text not null default ''
);

insert into public.app_config (key, value) values ('sheet_webhook_url', '')
  on conflict (key) do nothing;

alter table public.app_config enable row level security;
-- No policies granted — readable/writable only by triggers (definer) and the
-- SQL editor. Not exposed to anon or authenticated clients.

-- ---------------------------------------------------------------------------
-- GOOGLE SHEETS SYNC — pushes a live snapshot of each customer to the sheet
-- named IDF_CustDetails whenever their profile or an order changes. Uses
-- pg_net (Supabase's built-in async HTTP extension) to call the Apps Script
-- web app URL stored in app_config above — see
-- supabase/google-apps-script/IDF_CustDetails_sync.gs for the script itself
-- and HANDOVER.md for how to wire the URL in.
--
-- If sheet_webhook_url is still blank, these functions do nothing — silently
-- and cheaply — so leaving this unset never breaks anything else.
-- ---------------------------------------------------------------------------
create extension if not exists pg_net;

create or replace function public.sync_customer_to_sheet()
returns trigger language plpgsql security definer as $$
declare
  webhook text;
  order_count int;
begin
  select value into webhook from public.app_config where key = 'sheet_webhook_url';
  if webhook is null or webhook = '' then
    return NEW;
  end if;

  select count(*) into order_count from public.orders where customer_id = NEW.user_id;

  perform net.http_post(
    url := webhook,
    body := jsonb_build_object(
      'name', NEW.name,
      'phone', NEW.phone,
      'email', NEW.email,
      'city', NEW.city,
      'signupMethod', NEW.signup_method,
      'totalOrders', order_count,
      'lastUpdated', to_char(now(), 'YYYY-MM-DD HH24:MI')
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return NEW;
end;
$$;

drop trigger if exists customers_sync_sheet on public.customers;
create trigger customers_sync_sheet
  after insert or update on public.customers
  for each row execute function public.sync_customer_to_sheet();

create or replace function public.sync_order_to_sheet()
returns trigger language plpgsql security definer as $$
declare
  webhook text;
  cust record;
  order_count int;
  items_summary text;
begin
  select value into webhook from public.app_config where key = 'sheet_webhook_url';
  if webhook is null or webhook = '' then
    return NEW;
  end if;

  select * into cust from public.customers where user_id = NEW.customer_id;
  select count(*) into order_count from public.orders where customer_id = NEW.customer_id;
  select string_agg(x->>'name', ', ') into items_summary
    from jsonb_array_elements(NEW.items) x;

  perform net.http_post(
    url := webhook,
    body := jsonb_build_object(
      'name', coalesce(cust.name, ''),
      'phone', coalesce(cust.phone, ''),
      'email', coalesce(cust.email, ''),
      'city', coalesce(cust.city, NEW.city, ''),
      'signupMethod', coalesce(cust.signup_method, ''),
      'totalOrders', order_count,
      'lastOrderCode', NEW.order_code,
      'lastOrderTotal', NEW.total,
      'lastOrderItems', coalesce(items_summary, ''),
      'lastRequirement', NEW.requirement,
      'lastUpdated', to_char(now(), 'YYYY-MM-DD HH24:MI')
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return NEW;
end;
$$;

drop trigger if exists orders_sync_sheet on public.orders;
create trigger orders_sync_sheet
  after insert on public.orders
  for each row execute function public.sync_order_row_to_sheet();

drop trigger if exists orders_status_sync_sheet on public.orders;
create trigger orders_status_sync_sheet
  after update of order_status, payment_status on public.orders
  for each row execute function public.sync_order_row_to_sheet();

do $$
begin
  execute 'alter publication supabase_realtime add table public.orders';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.wishlist';
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- ADMIN SEED
-- Run this separately after deploying, replacing the hash and email.
-- Generate the bcrypt hash with: https://bcrypt-generator.com (rounds=12)
-- or via: node -e "require('bcryptjs').hash('YOUR_PASSWORD',12).then(console.log)"
--
-- insert into public.admins (username, password_hash, email)
-- values ('admin.idf', '$2a$12$REPLACE_WITH_REAL_BCRYPT_HASH', 'your@email.com')
-- on conflict (username) do nothing;
-- ============================================================================

-- ============================================================================
-- RECOMMENDATION ENGINE — Product Interaction Tracking & Scoring
-- ============================================================================

create table if not exists public.product_interactions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'add_to_cart', 'wishlist', 'purchase')),
  created_at timestamptz not null default now()
);

alter table public.product_interactions enable row level security;

drop policy if exists "anyone can log interactions" on public.product_interactions;
create policy "anyone can log interactions"
  on public.product_interactions for insert
  with check (user_id is null or auth.uid() = user_id);

create index if not exists idx_interactions_session on public.product_interactions(session_id);
create index if not exists idx_interactions_user on public.product_interactions(user_id);
create index if not exists idx_interactions_product on public.product_interactions(product_id);
create index if not exists idx_interactions_event_time on public.product_interactions(event_type, created_at);

create or replace function public.backfill_session_interactions(target_session_id text)
returns void language plpgsql security definer as $$
begin
  if auth.uid() is not null then
    update public.product_interactions
    set user_id = auth.uid()
    where session_id = target_session_id and user_id is null;
  end if;
end;
$$;

create or replace function public.get_top_picks(limit_count int default 6)
returns table (product_id text, score numeric) language plpgsql security definer as $$
begin
  return query
  select
    pi.product_id,
    sum(
      case pi.event_type
        when 'purchase' then 10
        when 'add_to_cart' then 5
        when 'wishlist' then 3
        when 'view' then 1
        else 0
      end
    )::numeric as score
  from public.product_interactions pi
  where pi.created_at >= now() - interval '30 days'
  group by pi.product_id
  order by score desc
  limit limit_count;
end;
$$;

create or replace function public.get_frequently_together(target_product_id text, limit_count int default 4)
returns table (product_id text, co_occurrences bigint) language plpgsql security definer as $$
begin
  return query
  with target_sessions as (
    select distinct session_id
    from public.product_interactions
    where product_id = target_product_id
  )
  select
    pi.product_id,
    count(distinct pi.session_id) as co_occurrences
  from public.product_interactions pi
  join target_sessions ts on pi.session_id = ts.session_id
  where pi.product_id <> target_product_id
  group by pi.product_id
  order by co_occurrences desc
  limit limit_count;
end;
$$;

create or replace function public.get_recommended_for_user(limit_count int default 6)
returns table (product_id text, score numeric) language plpgsql security definer as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    return query select * from public.get_top_picks(limit_count);
    return;
  end if;

  return query
  with user_history as (
    select pi.product_id, pi.event_type
    from public.product_interactions pi
    where pi.user_id = current_user_id
  ),
  user_categories as (
    select p.category, count(*) as weight
    from user_history uh
    join public.products p on p.id = uh.product_id
    group by p.category
  ),
  purchased_products as (
    select distinct product_id
    from user_history
    where event_type = 'purchase'
  )
  select
    p.id as product_id,
    coalesce(uc.weight, 0)::numeric as score
  from public.products p
  left join user_categories uc on p.category = uc.category
  where p.id not in (select product_id from purchased_products)
  order by score desc, p.name asc
  limit limit_count;
end;
$$;

-- ============================================================================
-- Done. Next: paste supabase/google-apps-script/IDF_CustDetails_sync.gs into
-- a Google Sheet (Extensions -> Apps Script), deploy it as a web app, and run:
--   update public.app_config set value = 'PASTE_THE_DEPLOYED_URL_HERE?token=SHARED_TOKEN'
--   where key = 'sheet_webhook_url';
-- ============================================================================

