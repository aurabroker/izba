-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ 0001 · Inicjalizacja: typy i funkcja updated_at (prefiks izba_)         ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Program ubezpieczenia PISKP współdzieli projekt Supabase z innymi
-- aplikacjami (wzorzec prefiksów: crm_, bond_, ud_…). Wszystkie obiekty tej
-- aplikacji mają prefiks `izba_`, a migracje są wyłącznie addytywne — nie
-- dotykają istniejących tabel/funkcji innych aplikacji.

create extension if not exists pgcrypto;

-- ── Typy domenowe ─────────────────────────────────────────────────────────
create type public.izba_app_role as enum ('client', 'izba', 'agency', 'admin');
create type public.izba_product_target as enum ('station', 'diagnostician', 'both');
create type public.izba_insured_type as enum ('station', 'diagnostician');
create type public.izba_application_status as enum (
  'draft', 'submitted', 'review', 'approved', 'rejected'
);
create type public.izba_certificate_status as enum ('active', 'expired', 'cancelled');
create type public.izba_payment_status as enum (
  'pending', 'paid', 'overdue', 'cancelled'
);

-- ── Trigger pomocniczy: automatyczne updated_at ────────────────────────────
create or replace function public.izba_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
