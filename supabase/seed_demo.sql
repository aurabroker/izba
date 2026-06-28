-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ SEED DEMO — konta testowe + dane mockowe (PISKP)                       ║
-- ╠══════════════════════════════════════════════════════════════════════╣
-- ║ WYŁĄCZNIE do prezentacji/testów. Idempotentny (stałe UUID + on conflict)║
-- ║ Hasło dla wszystkich kont demo: Demo1234!                              ║
-- ║                                                                        ║
-- ║ Konta:                                                                 ║
-- ║   demo-klient@piskp.demo   — Klient (stacja + diagności)               ║
-- ║   demo-agencja@piskp.demo  — Agencja                                   ║
-- ║   demo-izba@piskp.demo     — Izba                                      ║
-- ║   demo-admin@piskp.demo    — Admin                                     ║
-- ║                                                                        ║
-- ║ Usunięcie danych demo: patrz koniec pliku (zakomentowane).             ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── 1. Konta auth (hasło: Demo1234!) ───────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111101','authenticated','authenticated','demo-klient@piskp.demo', crypt('Demo1234!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Stacja Demo Sp. z o.o."}','','','',''),
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111102','authenticated','authenticated','demo-agencja@piskp.demo', crypt('Demo1234!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Agencja Demo"}','','','',''),
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111103','authenticated','authenticated','demo-izba@piskp.demo', crypt('Demo1234!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Izba Demo"}','','','',''),
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111104','authenticated','authenticated','demo-admin@piskp.demo', crypt('Demo1234!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Admin Demo"}','','','','')
on conflict (id) do nothing;

-- ── 2. Tożsamości (email provider) ─────────────────────────────────────────
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111101','11111111-1111-1111-1111-111111111101', jsonb_build_object('sub','11111111-1111-1111-1111-111111111101','email','demo-klient@piskp.demo','email_verified',true), 'email', now(), now(), now()),
  ('11111111-1111-1111-1111-111111111102','11111111-1111-1111-1111-111111111102', jsonb_build_object('sub','11111111-1111-1111-1111-111111111102','email','demo-agencja@piskp.demo','email_verified',true), 'email', now(), now(), now()),
  ('11111111-1111-1111-1111-111111111103','11111111-1111-1111-1111-111111111103', jsonb_build_object('sub','11111111-1111-1111-1111-111111111103','email','demo-izba@piskp.demo','email_verified',true), 'email', now(), now(), now()),
  ('11111111-1111-1111-1111-111111111104','11111111-1111-1111-1111-111111111104', jsonb_build_object('sub','11111111-1111-1111-1111-111111111104','email','demo-admin@piskp.demo','email_verified',true), 'email', now(), now(), now())
on conflict do nothing;

-- ── 3. Profile PISKP z rolami ──────────────────────────────────────────────
insert into public.izba_profiles (id, role, full_name, email) values
  ('11111111-1111-1111-1111-111111111101','client','Stacja Demo Sp. z o.o.','demo-klient@piskp.demo'),
  ('11111111-1111-1111-1111-111111111102','agency','Agencja Demo','demo-agencja@piskp.demo'),
  ('11111111-1111-1111-1111-111111111103','izba','Izba Demo','demo-izba@piskp.demo'),
  ('11111111-1111-1111-1111-111111111104','admin','Admin Demo','demo-admin@piskp.demo')
on conflict (id) do nothing;

-- ── 4. Produkty (utworzone przez Agencję demo) ─────────────────────────────
insert into public.izba_products (id, name, description, applies_to, premium, sum_insured, coverage_scope, period_months, active, created_by) values
  ('33333333-3333-3333-3333-333333333301','OC diagnosty','Ubezpieczenie OC zawodowe diagnosty.','diagnostician', 480.00, 100000.00, 'Odpowiedzialność cywilna z tytułu wykonywania badań technicznych.', 12, true, '11111111-1111-1111-1111-111111111102'),
  ('33333333-3333-3333-3333-333333333302','OC działalności SKP','Ubezpieczenie OC stacji kontroli pojazdów.','station', 1200.00, 500000.00, 'OC działalności gospodarczej stacji kontroli pojazdów.', 12, true, '11111111-1111-1111-1111-111111111102'),
  ('33333333-3333-3333-3333-333333333303','Pakiet rozszerzony SKP+diagnosta','Łączna ochrona stacji i diagnostów.','both', 1800.00, 1000000.00, 'Pakiet łączony: OC stacji + OC diagnostów.', 12, true, '11111111-1111-1111-1111-111111111102')
on conflict (id) do nothing;

-- ── 5. Stacja klienta demo ─────────────────────────────────────────────────
insert into public.izba_stations (id, owner_profile_id, name, nip, skp_number, street, city, postal_code, email, phone) values
  ('44444444-4444-4444-4444-444444444401','11111111-1111-1111-1111-111111111101','Stacja Kontroli Pojazdów Demo','1234567890','PL/WA/001/2020','ul. Diagnostów 12','Warszawa','00-001','stacja@piskp.demo','+48 22 000 00 00')
on conflict (id) do nothing;

-- ── 6. Diagności + dane wrażliwe ───────────────────────────────────────────
insert into public.izba_diagnosticians (id, station_id, first_name, last_name, license_number, email) values
  ('55555555-5555-5555-5555-555555555501','44444444-4444-4444-4444-444444444401','Jan','Kowalski','DIAG/2020/001','jan.kowalski@piskp.demo'),
  ('55555555-5555-5555-5555-555555555502','44444444-4444-4444-4444-444444444401','Anna','Nowak','DIAG/2021/002','anna.nowak@piskp.demo')
on conflict (id) do nothing;

insert into public.izba_diagnostician_pii (diagnostician_id, pesel) values
  ('55555555-5555-5555-5555-555555555501','90010112345'),
  ('55555555-5555-5555-5555-555555555502','88052398765')
on conflict (diagnostician_id) do nothing;

-- ── 7. Wnioski (trigger walidacji własności wyłączony na czas seedu) ───────
alter table public.izba_applications disable trigger trg_izba_validate_application_ownership;

insert into public.izba_applications (id, product_id, applicant_profile_id, insured_type, station_id, diagnostician_id, status, premium_snapshot, notes, reviewed_by, reviewed_at) values
  ('66666666-6666-6666-6666-666666666601','33333333-3333-3333-3333-333333333302','11111111-1111-1111-1111-111111111101','station','44444444-4444-4444-4444-444444444401', null, 'submitted', 1200.00, 'Wniosek o OC stacji.', null, null),
  ('66666666-6666-6666-6666-666666666602','33333333-3333-3333-3333-333333333301','11111111-1111-1111-1111-111111111101','diagnostician', null, '55555555-5555-5555-5555-555555555501','approved', 480.00, 'Wniosek OC dla diagnosty Jan Kowalski.', '11111111-1111-1111-1111-111111111102', now()),
  ('66666666-6666-6666-6666-666666666603','33333333-3333-3333-3333-333333333301','11111111-1111-1111-1111-111111111101','diagnostician', null, '55555555-5555-5555-5555-555555555502','draft', 480.00, 'Szkic wniosku dla diagnosty Anna Nowak.', null, null)
on conflict (id) do nothing;

alter table public.izba_applications enable trigger trg_izba_validate_application_ownership;

-- ── 8. Certyfikat dla zatwierdzonego wniosku ───────────────────────────────
insert into public.izba_certificates (id, application_id, certificate_number, issued_by, issued_at, valid_from, valid_to, status) values
  ('77777777-7777-7777-7777-777777777701','66666666-6666-6666-6666-666666666602','PISKP/2026/DEMO01','11111111-1111-1111-1111-111111111102', now(), current_date, (current_date + interval '12 months')::date, 'active')
on conflict (id) do nothing;

-- ── 9. Płatności ───────────────────────────────────────────────────────────
insert into public.izba_payments (id, application_id, certificate_id, amount, currency, due_date, status, paid_at, method, recorded_by) values
  ('88888888-8888-8888-8888-888888888801','66666666-6666-6666-6666-666666666602','77777777-7777-7777-7777-777777777701', 480.00, 'PLN', current_date, 'paid', now(), 'manual','11111111-1111-1111-1111-111111111102'),
  ('88888888-8888-8888-8888-888888888802','66666666-6666-6666-6666-666666666601', null, 1200.00, 'PLN', (current_date + interval '14 days')::date, 'pending', null, 'manual', null)
on conflict (id) do nothing;

-- ── 10. Dodatkowe dane demo — pełna paleta statusów ───────────────────────
alter table public.izba_applications disable trigger trg_izba_validate_application_ownership;
insert into public.izba_applications (id, product_id, applicant_profile_id, insured_type, station_id, diagnostician_id, status, premium_snapshot, notes, rejection_reason, reviewed_by, reviewed_at) values
  -- w weryfikacji
  ('66666666-6666-6666-6666-666666666604','33333333-3333-3333-3333-333333333303','11111111-1111-1111-1111-111111111101','station','44444444-4444-4444-4444-444444444401', null, 'review', 1800.00, 'Pakiet rozszerzony — w trakcie weryfikacji.', null, '11111111-1111-1111-1111-111111111102', now()),
  -- odrzucony
  ('66666666-6666-6666-6666-666666666605','33333333-3333-3333-3333-333333333301','11111111-1111-1111-1111-111111111101','diagnostician', null, '55555555-5555-5555-5555-555555555502','rejected', 480.00, 'Wniosek OC dla Anny Nowak.', 'Brak kompletu dokumentów (uprawnienia).', '11111111-1111-1111-1111-111111111102', now()),
  -- zatwierdzony (do wygasłego certyfikatu)
  ('66666666-6666-6666-6666-666666666606','33333333-3333-3333-3333-333333333302','11111111-1111-1111-1111-111111111101','station','44444444-4444-4444-4444-444444444401', null, 'approved', 1200.00, 'Ubiegłoroczne OC stacji.', null, '11111111-1111-1111-1111-111111111102', now())
on conflict (id) do nothing;
alter table public.izba_applications enable trigger trg_izba_validate_application_ownership;

-- Wygasły certyfikat (ważność w przeszłości)
insert into public.izba_certificates (id, application_id, certificate_number, issued_by, issued_at, valid_from, valid_to, status) values
  ('77777777-7777-7777-7777-777777777702','66666666-6666-6666-6666-666666666606','PISKP/2025/DEMO02','11111111-1111-1111-1111-111111111102', (now() - interval '13 months'), (current_date - interval '13 months')::date, (current_date - interval '1 month')::date, 'expired')
on conflict (id) do nothing;

-- Płatności: po terminie (overdue) oraz opłacona za ubiegłoroczny certyfikat
insert into public.izba_payments (id, application_id, certificate_id, amount, currency, due_date, status, paid_at, method, recorded_by) values
  ('88888888-8888-8888-8888-888888888803','66666666-6666-6666-6666-666666666604', null, 1800.00, 'PLN', (current_date - interval '10 days')::date, 'overdue', null, 'manual', '11111111-1111-1111-1111-111111111102'),
  ('88888888-8888-8888-8888-888888888804','66666666-6666-6666-6666-666666666606','77777777-7777-7777-7777-777777777702', 1200.00, 'PLN', (current_date - interval '12 months')::date, 'paid', (now() - interval '12 months'), 'manual', '11111111-1111-1111-1111-111111111102')
on conflict (id) do nothing;

-- ── Usunięcie danych demo (odkomentuj w razie potrzeby) ────────────────────
-- delete from auth.users where email like 'demo-%@piskp.demo';
--   (kasuje też powiązane izba_* przez ON DELETE CASCADE/SET NULL — uwaga na
--    izba_stations.owner_profile_id = RESTRICT: najpierw usuń dane demo poniżej)
-- delete from public.izba_payments     where id::text like '88888888-%';
-- delete from public.izba_certificates where id::text like '77777777-%';
-- delete from public.izba_applications where id::text like '66666666-%';
-- delete from public.izba_diagnosticians where id::text like '55555555-%';
-- delete from public.izba_stations    where id::text like '44444444-%';
-- delete from public.izba_products    where id::text like '33333333-%';
