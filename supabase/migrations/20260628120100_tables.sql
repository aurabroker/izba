-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ 0002 · Tabele rdzenia (prefiks izba_)                                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── izba_profiles ──────────────────────────────────────────────────────────
-- Rozszerza auth.users o rolę i dane kontaktowe specyficzne dla programu PISKP.
-- UWAGA: brak triggera na auth.users (projekt współdzielony) — profil zakłada
-- aplikacja przy pierwszym zalogowaniu (polityka self-provision, rola 'client').
create table public.izba_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.izba_app_role not null default 'client',
  full_name   text not null default '',
  email       text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.izba_profiles is 'PISKP: profil użytkownika z rolą; 1:1 z auth.users.';

create trigger trg_izba_profiles_updated_at
  before update on public.izba_profiles
  for each row execute function public.izba_set_updated_at();

-- ── izba_stations (stacje kontroli pojazdów, SKP) ──────────────────────────
create table public.izba_stations (
  id                uuid primary key default gen_random_uuid(),
  owner_profile_id  uuid not null references public.izba_profiles (id) on delete restrict,
  name              text not null,
  nip               text,
  skp_number        text,                 -- numer uprawnień stacji
  street            text,
  city              text,
  postal_code       text,
  email             text,
  phone             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.izba_stations is 'PISKP: stacja kontroli pojazdów (SKP) — podmiot Klienta.';
create index idx_izba_stations_owner on public.izba_stations (owner_profile_id);

create trigger trg_izba_stations_updated_at
  before update on public.izba_stations
  for each row execute function public.izba_set_updated_at();

-- ── izba_diagnosticians (diagności) ────────────────────────────────────────
-- Dane niewrażliwe. PESEL osobno (izba_diagnostician_pii) — minimalizacja RODO.
create table public.izba_diagnosticians (
  id              uuid primary key default gen_random_uuid(),
  station_id      uuid references public.izba_stations (id) on delete set null,
  profile_id      uuid references public.izba_profiles (id) on delete set null,
  first_name      text not null,
  last_name       text not null,
  license_number  text not null,          -- numer uprawnień diagnosty
  email           text,
  phone           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.izba_diagnosticians is 'PISKP: diagnosta — osoba ubezpieczona.';
create index idx_izba_diagnosticians_station on public.izba_diagnosticians (station_id);
create index idx_izba_diagnosticians_profile on public.izba_diagnosticians (profile_id);

create trigger trg_izba_diagnosticians_updated_at
  before update on public.izba_diagnosticians
  for each row execute function public.izba_set_updated_at();

-- ── izba_diagnostician_pii (dane wrażliwe diagnosty) ───────────────────────
-- Osobna tabela ze ściślejszym RLS (need-to-know). Izba NIE ma dostępu.
create table public.izba_diagnostician_pii (
  diagnostician_id  uuid primary key references public.izba_diagnosticians (id) on delete cascade,
  pesel             text,                  -- TODO hardening: szyfrowanie kolumnowe (Vault/pgsodium)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.izba_diagnostician_pii is 'PISKP: dane wrażliwe diagnosty (PESEL). RODO: need-to-know.';

create trigger trg_izba_diagnostician_pii_updated_at
  before update on public.izba_diagnostician_pii
  for each row execute function public.izba_set_updated_at();

-- ── izba_products (produkty ubezpieczeniowe) ───────────────────────────────
create table public.izba_products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  applies_to      public.izba_product_target not null default 'both',
  premium         numeric(10, 2) not null check (premium >= 0),
  sum_insured     numeric(12, 2) check (sum_insured >= 0),
  coverage_scope  text,
  period_months   integer not null default 12 check (period_months > 0),
  active          boolean not null default true,
  created_by      uuid references public.izba_profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.izba_products is 'PISKP: produkt ubezpieczeniowy programu.';
create index idx_izba_products_active on public.izba_products (active);

create trigger trg_izba_products_updated_at
  before update on public.izba_products
  for each row execute function public.izba_set_updated_at();

-- ── izba_applications (wnioski) ────────────────────────────────────────────
create table public.izba_applications (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references public.izba_products (id) on delete restrict,
  applicant_profile_id  uuid not null references public.izba_profiles (id) on delete restrict,
  insured_type          public.izba_insured_type not null,
  station_id            uuid references public.izba_stations (id) on delete restrict,
  diagnostician_id      uuid references public.izba_diagnosticians (id) on delete restrict,
  status                public.izba_application_status not null default 'draft',
  premium_snapshot      numeric(10, 2) not null check (premium_snapshot >= 0),
  notes                 text,
  rejection_reason      text,
  reviewed_by           uuid references public.izba_profiles (id) on delete set null,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint chk_izba_insured_target check (
    (insured_type = 'station'       and station_id is not null and diagnostician_id is null)
    or
    (insured_type = 'diagnostician' and diagnostician_id is not null and station_id is null)
  )
);
comment on table public.izba_applications is 'PISKP: wniosek; statusy draft→submitted→review→approved|rejected.';
create index idx_izba_applications_applicant on public.izba_applications (applicant_profile_id);
create index idx_izba_applications_status on public.izba_applications (status);
create index idx_izba_applications_station on public.izba_applications (station_id);
create index idx_izba_applications_diagnostician on public.izba_applications (diagnostician_id);

create trigger trg_izba_applications_updated_at
  before update on public.izba_applications
  for each row execute function public.izba_set_updated_at();

-- ── izba_certificates (certyfikaty) ────────────────────────────────────────
create table public.izba_certificates (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid not null unique references public.izba_applications (id) on delete restrict,
  certificate_number  text not null unique,
  issued_by           uuid references public.izba_profiles (id) on delete set null,
  issued_at           timestamptz not null default now(),
  valid_from          date not null,
  valid_to            date not null,
  pdf_path            text,                 -- klucz obiektu w Cloudflare R2
  status              public.izba_certificate_status not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint chk_izba_validity check (valid_to >= valid_from)
);
comment on table public.izba_certificates is 'PISKP: certyfikat wystawiony po zatwierdzeniu wniosku.';
create index idx_izba_certificates_status on public.izba_certificates (status);

create trigger trg_izba_certificates_updated_at
  before update on public.izba_certificates
  for each row execute function public.izba_set_updated_at();

-- ── izba_payments (płatności) ──────────────────────────────────────────────
-- Warstwa bramki wymienna: external_provider/external_ref pod przyszłe
-- Przelewy24/Tpay/Stripe. Na razie ewidencja ręczna.
create table public.izba_payments (
  id                 uuid primary key default gen_random_uuid(),
  application_id     uuid not null references public.izba_applications (id) on delete restrict,
  certificate_id     uuid references public.izba_certificates (id) on delete set null,
  amount             numeric(10, 2) not null check (amount >= 0),
  currency           text not null default 'PLN',
  due_date           date,
  status             public.izba_payment_status not null default 'pending',
  paid_at            timestamptz,
  method             text,
  external_provider  text,
  external_ref       text,
  recorded_by        uuid references public.izba_profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.izba_payments is 'PISKP: płatność za wniosek/certyfikat; warstwa bramki wymienna.';
create index idx_izba_payments_application on public.izba_payments (application_id);
create index idx_izba_payments_status on public.izba_payments (status);

create trigger trg_izba_payments_updated_at
  before update on public.izba_payments
  for each row execute function public.izba_set_updated_at();

-- ── izba_audit_log ─────────────────────────────────────────────────────────
create table public.izba_audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid references public.izba_profiles (id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
comment on table public.izba_audit_log is 'PISKP: rejestr zdarzeń (RODO + wymóg ubezpieczeniowy).';
create index idx_izba_audit_entity on public.izba_audit_log (entity_type, entity_id);
create index idx_izba_audit_created on public.izba_audit_log (created_at desc);
