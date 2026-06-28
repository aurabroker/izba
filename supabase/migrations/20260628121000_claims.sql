-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ 0007 · Szkody (claims) — zgłoszenia roszczeń do certyfikatów           ║
-- ╚══════════════════════════════════════════════════════════════════════╝

create type public.izba_claim_status as enum (
  'reported', 'in_review', 'accepted', 'rejected', 'paid'
);

create table public.izba_claims (
  id              uuid primary key default gen_random_uuid(),
  certificate_id  uuid not null references public.izba_certificates (id) on delete restrict,
  reported_by     uuid not null references public.izba_profiles (id) on delete restrict,
  incident_date   date,
  description     text not null,
  amount_claimed  numeric(12, 2) check (amount_claimed >= 0),
  status          public.izba_claim_status not null default 'reported',
  resolution_note text,
  reviewed_by     uuid references public.izba_profiles (id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.izba_claims is 'PISKP: szkody/roszczenia zgłaszane do wystawionych certyfikatów.';
create index idx_izba_claims_certificate on public.izba_claims (certificate_id);
create index idx_izba_claims_status on public.izba_claims (status);
create index idx_izba_claims_reporter on public.izba_claims (reported_by);

create trigger trg_izba_claims_updated_at
  before update on public.izba_claims
  for each row execute function public.izba_set_updated_at();

-- Własność certyfikatu (przez powiązany wniosek) — do RLS szkód.
create or replace function public.izba_owns_certificate(_cert uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.izba_certificates c
    join public.izba_applications a on a.id = c.application_id
    where c.id = _cert and a.applicant_profile_id = auth.uid()
  );
$$;

alter table public.izba_claims enable row level security;

create policy izba_claims_select on public.izba_claims for select to authenticated
  using (public.izba_owns_certificate(certificate_id) or public.izba_is_staff());
create policy izba_claims_insert on public.izba_claims for insert to authenticated
  with check (
    (reported_by = auth.uid() and public.izba_owns_certificate(certificate_id))
    or public.izba_is_agency_or_admin()
  );
create policy izba_claims_update_staff on public.izba_claims for update to authenticated
  using (public.izba_is_agency_or_admin()) with check (public.izba_is_agency_or_admin());
create policy izba_claims_delete on public.izba_claims for delete to authenticated
  using (public.izba_is_admin());

-- Audyt zdarzeń szkód
create or replace function public.izba_audit_claim()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.izba_log_audit('claim.created', 'claim', new.id,
      jsonb_build_object('status', new.status, 'certificate_id', new.certificate_id));
  elsif new.status is distinct from old.status then
    perform public.izba_log_audit('claim.status_changed', 'claim', new.id,
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;
create trigger trg_izba_audit_claim
  after insert or update on public.izba_claims
  for each row execute function public.izba_audit_claim();

-- Utwardzenie: odbiór EXECUTE od ról API (jak pozostałe funkcje).
revoke execute on function public.izba_audit_claim() from anon, authenticated;
revoke execute on function public.izba_owns_certificate(uuid) from anon;
grant execute on function public.izba_owns_certificate(uuid) to authenticated;
