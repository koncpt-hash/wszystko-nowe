-- Wszystko nowe: schemat bazy dla Supabase
-- Uruchom raz w Supabase: SQL Editor → New query → wklej całość → Run.
-- Na końcu pliku wpisz swój adres e-mail w tabeli allowed_users.

-- 1. Kto ma dostęp do atlasu (tylko te adresy mogą czytać i zapisywać)
create table if not exists public.allowed_users (
  email text primary key
);

create or replace function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 2. Miejsca (odpowiednik kolekcji "places" z obecnego atlasu)
create table if not exists public.places (
  id          text primary key,
  name        text not null,
  city        text,
  region      text check (region in ('waw', 'pl')) default 'pl',
  cat         text not null,
  status      text check (status in ('open', 'build', 'plan')) default 'plan',
  date        text,            -- opis daty po polsku, np. „otwarte 14.10.2026”
  sort        text,            -- "YYYY-MM", do sortowania i filtra roku
  lat         double precision not null,
  lng         double precision not null,
  approx      boolean default false,
  note        text,
  src         text,
  build       text check (build in ('new', 'adapted', 'unknown')),  -- tylko salony
  shot        boolean default false,
  updated     text,            -- "DD.MM.YYYY", jak w obecnym atlasie
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists places_cat_idx on public.places (cat);
create index if not exists places_sort_idx on public.places (sort);

-- 3. Trasy (odpowiednik kolekcji "routes")
create table if not exists public.routes (
  id      text primary key,
  name    text not null,
  via     text,
  "order" integer default 0,
  points  text not null        -- "lat,lng;lat,lng;…"
);

-- 4. Archiwum: sesje zdjęciowe i zdjęcia
create table if not exists public.photo_sessions (
  id         uuid primary key default gen_random_uuid(),
  place_id   text not null references public.places (id) on delete cascade,
  shot_on    date not null,
  note       text,
  created_at timestamptz default now()
);

create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.photo_sessions (id) on delete cascade,
  path        text not null,   -- ścieżka w magazynie "photos"
  width       integer,
  height      integer,
  created_at  timestamptz default now()
);

create index if not exists photo_sessions_place_idx on public.photo_sessions (place_id);
create index if not exists photos_session_idx on public.photos (session_id);

-- 5. Pole updated_at uzupełnia się samo
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists places_touch on public.places;
create trigger places_touch before update on public.places
  for each row execute function public.touch_updated_at();

-- 6. Tabela dla codziennego automatu podtrzymującego bazę
create table if not exists public.heartbeat (
  id      integer primary key default 1,
  last_at timestamptz default now()
);
insert into public.heartbeat (id) values (1) on conflict (id) do nothing;

-- 7. Zabezpieczenia: dostęp tylko dla adresów z allowed_users.
--    Cotygodniowy przegląd i automaty używają klucza service_role, który omija te reguły.
alter table public.allowed_users  enable row level security;
alter table public.places         enable row level security;
alter table public.routes         enable row level security;
alter table public.photo_sessions enable row level security;
alter table public.photos         enable row level security;
alter table public.heartbeat      enable row level security;

drop policy if exists "allowed read places"  on public.places;
drop policy if exists "allowed write places" on public.places;
create policy "allowed read places"  on public.places for select using (public.is_allowed());
create policy "allowed write places" on public.places for all    using (public.is_allowed()) with check (public.is_allowed());

drop policy if exists "allowed read routes"  on public.routes;
drop policy if exists "allowed write routes" on public.routes;
create policy "allowed read routes"  on public.routes for select using (public.is_allowed());
create policy "allowed write routes" on public.routes for all    using (public.is_allowed()) with check (public.is_allowed());

drop policy if exists "allowed sessions" on public.photo_sessions;
create policy "allowed sessions" on public.photo_sessions for all using (public.is_allowed()) with check (public.is_allowed());

drop policy if exists "allowed photos" on public.photos;
create policy "allowed photos" on public.photos for all using (public.is_allowed()) with check (public.is_allowed());

-- 8. Prywatny magazyn na zdjęcia
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "allowed photo files read"   on storage.objects;
drop policy if exists "allowed photo files write"  on storage.objects;
drop policy if exists "allowed photo files delete" on storage.objects;
create policy "allowed photo files read"   on storage.objects for select using (bucket_id = 'photos' and public.is_allowed());
create policy "allowed photo files write"  on storage.objects for insert with check (bucket_id = 'photos' and public.is_allowed());
create policy "allowed photo files delete" on storage.objects for delete using (bucket_id = 'photos' and public.is_allowed());

-- 9. Zmiany w miejscach widoczne w aplikacji od razu (realtime)
do $$ begin
  alter publication supabase_realtime add table public.places;
exception when duplicate_object then null; end $$;

-- 10. WPISZ SWÓJ ADRES E-MAIL (ten sam, którym będziesz się logować)
-- insert into public.allowed_users (email) values ('twoj@adres.pl');
