# Program ubezpieczenia PISKP

Aplikacja produkcyjna do zarządzania grupowym programem ubezpieczenia
**Polskiej Izby Stacji Kontroli Pojazdów** — dla stacji kontroli (SKP),
diagnostów, Izby oraz Agencji prowadzącej program.

## Panele (role)

| Rola | Zakres |
|---|---|
| **Klient** (stacja SKP / diagnosta) | Podmioty (stacje + diagności), przegląd produktów, składanie wniosków, własne certyfikaty i płatności. |
| **Izba** (PISKP) | Statystyki programu, przegląd certyfikatów, płatności i produktów (tylko odczyt). |
| **Agencja** | Produkty (CRUD), kolejka wniosków, zatwierdzanie i wystawianie certyfikatów, ewidencja płatności. |
| **Admin** | Dostęp do widoków Agencji/Izby + zarządzanie użytkownikami/rolami + rejestr zdarzeń. |

## Cykl życia wniosku

```
draft → submitted → review → approved → (certyfikat + płatność)
                            ↘ rejected
```

Klient składa wniosek (wybór produktu i ubezpieczonego: stacja lub diagnosta).
Agencja weryfikuje, a przy zatwierdzeniu automatycznie wystawiany jest certyfikat
(numer `PISKP/RRRR/XXXXXX`, daty ważności z okresu produktu) i tworzona płatność
(status `pending`, termin 14 dni). Izba i Admin mają wgląd; wszystkie kluczowe
zdarzenia trafiają do rejestru audytu.

## Stack

| Warstwa | Technologia |
|---|---|
| Framework | React Router 8 (framework mode) + TypeScript, SSR na Cloudflare Workers |
| Style | Tailwind CSS 4 (build) + design system PISKP |
| Baza + Auth | Supabase (Postgres + Auth + RLS) |
| Hosting | Cloudflare Workers (`wrangler`) |
| Testy | Vitest |

Baza współdzieli projekt Supabase z innymi aplikacjami — **wszystkie obiekty tej
aplikacji mają prefiks `izba_`** (tabele, typy, funkcje), a migracje są wyłącznie
addytywne.

## Szybki start (lokalnie)

```bash
npm install
cp .dev.vars.example .dev.vars   # uzupełnij SUPABASE_URL / SUPABASE_ANON_KEY
npm run dev                      # http://localhost:5173
```

> Uwaga: w środowisku z ograniczonym egressem fetch Workera do `*.supabase.co`
> może być blokowany przez politykę sieciową — auth/zapytania zadziałają po
> wdrożeniu na Cloudflare (otwarty egress) lub w sieci dopuszczającej Supabase.

## Skrypty

```bash
npm run dev         # serwer deweloperski
npm run build       # build produkcyjny
npm run deploy      # build + wrangler deploy (Cloudflare)
npm run typecheck   # typy Cloudflare + React Router + tsc
npm run lint        # ESLint
npm run test        # Vitest
```

## Baza danych (migracje)

Migracje SQL w `supabase/migrations/` są źródłem prawdy. Zastosowane na projekcie
Supabase z prefiksem `izba_`:

- `0001_init` — typy enum + funkcja `izba_set_updated_at`
- `0002_tables` — 9 tabel (profiles, stations, diagnosticians, diagnostician_pii,
  products, applications, certificates, payments, audit_log)
- `0003_rls` — funkcje ról/własności + polityki RLS per rola
- `0004_audit` — funkcja `izba_log_audit` + triggery cyklu życia
- `0005/0006_harden` — `search_path` i odbiór `EXECUTE` od ról API

## Wdrożenie na Cloudflare

```bash
# Sekrety (NIE trafiają do repo):
npx wrangler secret put GUS_API_KEY            # klucz API GUS BIR (REGON)
# npx wrangler secret put SUPABASE_SECRET_KEY  # gdy potrzebne operacje admin-API

npm run deploy
```

`SUPABASE_URL` i `SUPABASE_ANON_KEY` są wartościami publicznymi (klucz publiczny
Supabase jest z założenia widoczny w kliencie) i znajdują się w `wrangler.jsonc → vars`.

### Integracja REGON (GUS BIR 1.1)

Formularz dodawania stacji ma przycisk **„Pobierz z REGON"** — po podaniu NIP
pobiera nazwę i adres z rejestru REGON i wypełnia pola. Wymaga sekretu
`GUS_API_KEY` (klucz produkcyjny z api.stat.gov.pl). Wywołania idą przez
serwerowy proxy `/api/regon/lookup` (klucz nie trafia do przeglądarki). Bez
klucza przycisk poinformuje, że integracja nie jest skonfigurowana.

## Pierwszy administrator (bootstrap)

Nowi użytkownicy dostają rolę `client`. Aby nadać pierwszą rolę `admin`
(np. po rejestracji konta), wykonaj w bazie:

```sql
update public.izba_profiles set role = 'admin'
where id = (select id from auth.users where email = 'TWOJ_EMAIL');
```

Kolejnych użytkowników admin promuje już z panelu (`/panel/admin/uzytkownicy`).

## RODO / bezpieczeństwo

- **Minimalizacja danych:** PESEL diagnosty trzymany w osobnej tabeli
  `izba_diagnostician_pii` ze ściślejszym RLS (dostęp need-to-know: właściciel,
  Agencja, Admin — **Izba nie ma dostępu**).
- **RLS** egzekwuje dostęp per rola na poziomie bazy (nie tylko w UI).
- **Audit log** rejestruje operacje na wnioskach, certyfikatach i płatnościach.
- **Ochrona ról:** trigger blokuje samodzielne podniesienie uprawnień; zmianę
  roli wykonuje wyłącznie Admin.
- Pozostałe (opcjonalne) utwardzenia: szyfrowanie kolumnowe PESEL (Vault/pgsodium),
  przeniesienie funkcji pomocniczych RLS do nieeksponowanego schematu (wyciszenie
  7 ostrzeżeń `authenticated_security_definer_function_executable`), polityka
  retencji danych.

## Płatności

Obecnie ewidencja ręczna (Agencja oznacza status w panelu). Warstwa integracji
jest wymienna — `app/lib/payments.server.ts` definiuje interfejs `PaymentProvider`
gotowy pod Przelewy24 / Tpay / Stripe; tabela `izba_payments` ma już pola
`external_provider` / `external_ref`.

## Struktura

```
app/
  routes/             # ekrany (home, login, register, panel.*)
  components/         # auth-layout, ui (Badge, Table, pola, StatCard)
  lib/                # supabase.server, auth.server, certificates.server,
                      # payments.server, context, types, format
  app.css             # Tailwind + tokeny design systemu
workers/app.ts        # entry Workera
supabase/migrations/  # migracje SQL (schemat + RLS + audyt)
```
