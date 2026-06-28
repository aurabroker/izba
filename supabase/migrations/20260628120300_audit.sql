-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ 0004 · Audyt zdarzeń cyklu życia (prefiks izba_)                        ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Zapis do izba_audit_log z pominięciem RLS (SECURITY DEFINER). Wywoływane
-- przez triggery oraz, w razie potrzeby, z warstwy aplikacji (np. wgląd w PESEL).
create or replace function public.izba_log_audit(
  _action      text,
  _entity_type text,
  _entity_id   uuid,
  _metadata    jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.izba_audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), _action, _entity_type, _entity_id, _metadata);
end;
$$;

-- ── Wniosek: utworzenie i zmiana statusu ───────────────────────────────────
create or replace function public.izba_audit_application()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.izba_log_audit('application.created', 'application', new.id,
      jsonb_build_object('status', new.status));
  elsif new.status is distinct from old.status then
    perform public.izba_log_audit('application.status_changed', 'application', new.id,
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

create trigger trg_izba_audit_application
  after insert or update on public.izba_applications
  for each row execute function public.izba_audit_application();

-- ── Certyfikat: wystawienie i zmiana statusu ───────────────────────────────
create or replace function public.izba_audit_certificate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.izba_log_audit('certificate.issued', 'certificate', new.id,
      jsonb_build_object('number', new.certificate_number, 'application_id', new.application_id));
  elsif new.status is distinct from old.status then
    perform public.izba_log_audit('certificate.status_changed', 'certificate', new.id,
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

create trigger trg_izba_audit_certificate
  after insert or update on public.izba_certificates
  for each row execute function public.izba_audit_certificate();

-- ── Płatność: utworzenie i zmiana statusu ──────────────────────────────────
create or replace function public.izba_audit_payment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.izba_log_audit('payment.created', 'payment', new.id,
      jsonb_build_object('status', new.status, 'amount', new.amount));
  elsif new.status is distinct from old.status then
    perform public.izba_log_audit('payment.status_changed', 'payment', new.id,
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

create trigger trg_izba_audit_payment
  after insert or update on public.izba_payments
  for each row execute function public.izba_audit_payment();
