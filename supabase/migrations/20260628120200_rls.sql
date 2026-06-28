-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ 0003 · Funkcje ról/własności + Row Level Security (prefiks izba_)       ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Role: client (Klient), izba (Izba), agency (Agencja), admin (Admin).
-- Wszystkie funkcje SECURITY DEFINER omijają RLS w samym sprawdzeniu, dzięki
-- czemu polityki mogą ich używać bez rekurencji.

-- ── Rola bieżącego użytkownika ─────────────────────────────────────────────
create or replace function public.izba_current_app_role()
returns public.izba_app_role language sql stable security definer set search_path = public as $$
  select role from public.izba_profiles where id = auth.uid();
$$;

create or replace function public.izba_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.izba_current_app_role() in ('izba', 'agency', 'admin'), false);
$$;

create or replace function public.izba_is_agency_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.izba_current_app_role() in ('agency', 'admin'), false);
$$;

create or replace function public.izba_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.izba_current_app_role() = 'admin', false);
$$;

-- ── Funkcje własności ──────────────────────────────────────────────────────
create or replace function public.izba_owns_station(_station uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.izba_stations s
    where s.id = _station and s.owner_profile_id = auth.uid()
  );
$$;

create or replace function public.izba_owns_diagnostician(_diag uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.izba_diagnosticians d
    left join public.izba_stations s on s.id = d.station_id
    where d.id = _diag
      and (d.profile_id = auth.uid() or s.owner_profile_id = auth.uid())
  );
$$;

create or replace function public.izba_owns_application(_app uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.izba_applications a
    where a.id = _app and a.applicant_profile_id = auth.uid()
  );
$$;

-- ── Trigger: ochrona kolumny role (brak self-elevacji) ─────────────────────
create or replace function public.izba_protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.izba_is_admin() then
    raise exception 'Zmiana roli wymaga uprawnień administratora';
  end if;
  return new;
end;
$$;

create trigger trg_izba_protect_profile_role
  before update on public.izba_profiles
  for each row execute function public.izba_protect_profile_role();

-- ── Trigger: walidacja własności ubezpieczonego we wniosku ─────────────────
create or replace function public.izba_validate_application_ownership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.izba_is_agency_or_admin() then
    return new;
  end if;
  if new.insured_type = 'station' and not public.izba_owns_station(new.station_id) then
    raise exception 'Brak uprawnień do wskazanej stacji';
  end if;
  if new.insured_type = 'diagnostician' and not public.izba_owns_diagnostician(new.diagnostician_id) then
    raise exception 'Brak uprawnień do wskazanego diagnosty';
  end if;
  return new;
end;
$$;

create trigger trg_izba_validate_application_ownership
  before insert or update on public.izba_applications
  for each row execute function public.izba_validate_application_ownership();

-- ══════════════════════════════════════════════════════════════════════════
-- Włączenie RLS
-- ══════════════════════════════════════════════════════════════════════════
alter table public.izba_profiles          enable row level security;
alter table public.izba_stations          enable row level security;
alter table public.izba_diagnosticians    enable row level security;
alter table public.izba_diagnostician_pii enable row level security;
alter table public.izba_products          enable row level security;
alter table public.izba_applications      enable row level security;
alter table public.izba_certificates      enable row level security;
alter table public.izba_payments          enable row level security;
alter table public.izba_audit_log         enable row level security;

-- ── izba_profiles ─────────────────────────────────────────────────────────
create policy izba_profiles_select on public.izba_profiles for select to authenticated
  using (id = auth.uid() or public.izba_is_staff());
-- Self-provision przy pierwszym logowaniu (zawsze rola 'client').
create policy izba_profiles_insert_self on public.izba_profiles for insert to authenticated
  with check (id = auth.uid() and role = 'client');
create policy izba_profiles_update_self on public.izba_profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy izba_profiles_update_admin on public.izba_profiles for update to authenticated
  using (public.izba_is_admin()) with check (public.izba_is_admin());

-- ── izba_stations ─────────────────────────────────────────────────────────
create policy izba_stations_select on public.izba_stations for select to authenticated
  using (public.izba_owns_station(id) or public.izba_is_staff());
create policy izba_stations_insert on public.izba_stations for insert to authenticated
  with check (owner_profile_id = auth.uid() or public.izba_is_agency_or_admin());
create policy izba_stations_update on public.izba_stations for update to authenticated
  using (public.izba_owns_station(id) or public.izba_is_agency_or_admin())
  with check (public.izba_owns_station(id) or public.izba_is_agency_or_admin());
create policy izba_stations_delete on public.izba_stations for delete to authenticated
  using (public.izba_is_agency_or_admin());

-- ── izba_diagnosticians ───────────────────────────────────────────────────
create policy izba_diag_select on public.izba_diagnosticians for select to authenticated
  using (public.izba_owns_diagnostician(id) or public.izba_is_staff());
create policy izba_diag_insert on public.izba_diagnosticians for insert to authenticated
  with check (public.izba_owns_station(station_id) or public.izba_is_agency_or_admin());
create policy izba_diag_update on public.izba_diagnosticians for update to authenticated
  using (public.izba_owns_diagnostician(id) or public.izba_is_agency_or_admin())
  with check (public.izba_owns_diagnostician(id) or public.izba_is_agency_or_admin());
create policy izba_diag_delete on public.izba_diagnosticians for delete to authenticated
  using (public.izba_is_agency_or_admin());

-- ── izba_diagnostician_pii (dane wrażliwe — bez Izby) ─────────────────────
create policy izba_pii_select on public.izba_diagnostician_pii for select to authenticated
  using (public.izba_owns_diagnostician(diagnostician_id) or public.izba_is_agency_or_admin());
create policy izba_pii_insert on public.izba_diagnostician_pii for insert to authenticated
  with check (public.izba_owns_diagnostician(diagnostician_id) or public.izba_is_agency_or_admin());
create policy izba_pii_update on public.izba_diagnostician_pii for update to authenticated
  using (public.izba_owns_diagnostician(diagnostician_id) or public.izba_is_agency_or_admin())
  with check (public.izba_owns_diagnostician(diagnostician_id) or public.izba_is_agency_or_admin());

-- ── izba_products ─────────────────────────────────────────────────────────
create policy izba_products_select on public.izba_products for select to authenticated
  using (active or public.izba_is_staff());
create policy izba_products_write on public.izba_products for all to authenticated
  using (public.izba_is_agency_or_admin()) with check (public.izba_is_agency_or_admin());

-- ── izba_applications ─────────────────────────────────────────────────────
create policy izba_app_select on public.izba_applications for select to authenticated
  using (public.izba_owns_application(id) or public.izba_is_staff());
create policy izba_app_insert on public.izba_applications for insert to authenticated
  with check (applicant_profile_id = auth.uid() or public.izba_is_agency_or_admin());
-- Klient edytuje/wysyła tylko własny szkic (draft → submitted).
create policy izba_app_update_owner on public.izba_applications for update to authenticated
  using (public.izba_owns_application(id) and status = 'draft')
  with check (public.izba_owns_application(id) and status in ('draft', 'submitted'));
-- Agencja/Admin: pełna obsługa (review, approve, reject).
create policy izba_app_update_staff on public.izba_applications for update to authenticated
  using (public.izba_is_agency_or_admin()) with check (public.izba_is_agency_or_admin());
create policy izba_app_delete on public.izba_applications for delete to authenticated
  using ((public.izba_owns_application(id) and status = 'draft') or public.izba_is_agency_or_admin());

-- ── izba_certificates ─────────────────────────────────────────────────────
create policy izba_cert_select on public.izba_certificates for select to authenticated
  using (public.izba_owns_application(application_id) or public.izba_is_staff());
create policy izba_cert_write on public.izba_certificates for all to authenticated
  using (public.izba_is_agency_or_admin()) with check (public.izba_is_agency_or_admin());

-- ── izba_payments ─────────────────────────────────────────────────────────
create policy izba_pay_select on public.izba_payments for select to authenticated
  using (public.izba_owns_application(application_id) or public.izba_is_staff());
create policy izba_pay_write on public.izba_payments for all to authenticated
  using (public.izba_is_agency_or_admin()) with check (public.izba_is_agency_or_admin());

-- ── izba_audit_log (odczyt: Izba/Admin; zapis: funkcje SECURITY DEFINER) ───
create policy izba_audit_select on public.izba_audit_log for select to authenticated
  using (public.izba_current_app_role() in ('izba', 'admin'));
