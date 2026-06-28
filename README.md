# Program ubezpieczenia PISKP

Aplikacja produkcyjna do zarządzania grupowym programem ubezpieczenia
**Polskiej Izby Stacji Kontroli Pojazdów** — dla stacji kontroli (SKP),
diagnostów, Izby oraz Agencji prowadzącej program.

## Panele (role)

| Rola | Zakres |
|---|---|
| **Klient** (stacja SKP / diagnosta) | Przegląd produktów, składanie wniosków, własne certyfikaty i płatności. |
| **Izba** (PISKP) | Przegląd wystawionych certyfikatów, płatności i dostępnych produktów. |
| **Agencja** | Zarządzanie programem: produkty, zatwierdzanie i wystawianie certyfikatów. |
| **Admin** | Pełny dostęp, zarządzanie użytkownikami/rolami, rejestr zdarzeń (audit log). |

## Stack

| Warstwa | Technologia |
|---|---|
| Framework | React Router 8 (framework mode) + TypeScript, SSR na Cloudflare Workers |
| Style | Tailwind CSS 4 (build) + design system PISKP |
| Baza + Auth | Supabase (Postgres + Auth + RLS), region `eu-central-1` |
| Pliki | Cloudflare R2 (skany, PDF certyfikatów) |
| Hosting | Cloudflare Workers (`wrangler`) |

## Szybki start

```bash
npm install
cp .dev.vars.example .dev.vars   # uzupełnij SUPABASE_URL / SUPABASE_ANON_KEY
npm run dev                      # serwer deweloperski (Vite + Cloudflare)
```

## Skrypty

```bash
npm run dev         # serwer deweloperski
npm run build       # build produkcyjny
npm run preview     # podgląd buildu
npm run deploy      # build + wrangler deploy (Cloudflare)
npm run typecheck   # typy Cloudflare + React Router + tsc
npm run lint        # ESLint
npm run test        # Vitest
npm run db:types    # generacja typów z Supabase (wymaga `supabase link`)
```

## Struktura

```
app/
  root.tsx            # dokument HTML, Layout, ErrorBoundary
  routes.ts           # konfiguracja tras
  routes/             # ekrany (jeden plik = jedna trasa)
  entry.server.tsx    # render SSR (Web Streams, runtime workerd)
  lib/                # klient Supabase, kontekst, helpery serwerowe
  app.css             # Tailwind + tokeny design systemu
workers/app.ts        # entry Workera (request handler RR)
supabase/migrations/  # migracje SQL (schemat + RLS)
```

## Sekrety i środowisko

- Wartości publiczne (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) — w `wrangler.jsonc → vars`.
- Sekrety (`SUPABASE_SERVICE_ROLE_KEY`) — lokalnie w `.dev.vars`, na produkcji
  przez `wrangler secret put`. **Nigdy** nie commitować.
