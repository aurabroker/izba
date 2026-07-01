import { Link, data } from "react-router";
import type { Route } from "./+types/panel.szukaj";
import { getEnv } from "~/lib/context";
import { requireUser } from "~/lib/auth.server";
import {
  EmptyState,
  PageHeader,
  SearchBox,
  formatPLN,
} from "~/components/ui";
import { CLAIM_STATUS_LABEL, type AppRole } from "~/lib/types";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Wyszukiwanie — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, profile, headers } = await requireUser(
    request,
    getEnv(context),
  );
  const raw = (new URL(request.url).searchParams.get("q") ?? "").trim();
  // Sanityzacja pod ilike/or (usuń znaki sterujące PostgREST).
  const q = raw.replace(/[%_,()*]/g, " ").trim();
  const like = `%${q}%`;

  if (!q) {
    return data(
      { q: raw, role: profile.role, empty: true, results: null },
      { headers },
    );
  }

  const [certs, stations, diags, products, claims] = await Promise.all([
    supabase
      .from("izba_certificates")
      .select("id,certificate_number,status")
      .ilike("certificate_number", like)
      .limit(8),
    supabase
      .from("izba_stations")
      .select("id,name,nip,city")
      .or(`name.ilike.${like},nip.ilike.${like},city.ilike.${like}`)
      .limit(8),
    supabase
      .from("izba_diagnosticians")
      .select("id,first_name,last_name,license_number")
      .or(
        `first_name.ilike.${like},last_name.ilike.${like},license_number.ilike.${like}`,
      )
      .limit(8),
    supabase
      .from("izba_products")
      .select("id,name,premium")
      .ilike("name", like)
      .limit(8),
    supabase
      .from("izba_claims")
      .select("id,description,status,amount_claimed")
      .ilike("description", like)
      .limit(8),
  ]);

  return data(
    {
      q: raw,
      role: profile.role,
      empty: false,
      results: {
        certificates: certs.data ?? [],
        stations: stations.data ?? [],
        diagnosticians: diags.data ?? [],
        products: products.data ?? [],
        claims: claims.data ?? [],
      },
    },
    { headers },
  );
}

function productPath(role: AppRole) {
  if (role === "client") return "/panel/produkty";
  if (role === "izba") return "/panel/izba/produkty";
  return "/panel/agencja/produkty";
}
function claimsPath(role: AppRole) {
  if (role === "client") return "/panel/szkody";
  if (role === "izba") return "/panel/izba/szkody";
  return "/panel/agencja/szkody";
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-serif text-lg text-brand-navy">{title}</h2>
      <div className="card divide-y divide-slate-50">{children}</div>
    </section>
  );
}

function Row({
  to,
  primary,
  secondary,
}: {
  to?: string;
  primary: string;
  secondary?: string;
}) {
  const body = (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="font-medium text-slate-800">{primary}</span>
      {secondary && <span className="text-sm text-slate-500">{secondary}</span>}
    </div>
  );
  return to ? (
    <Link to={to} className="block transition hover:bg-slate-50">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function Szukaj({ loaderData }: Route.ComponentProps) {
  const { q, role, empty, results } = loaderData;

  const total = results
    ? results.certificates.length +
      results.stations.length +
      results.diagnosticians.length +
      results.products.length +
      results.claims.length
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Wyszukiwanie"
        description="Szukaj w certyfikatach, stacjach, diagnostach, produktach i szkodach."
      />

      <SearchBox placeholder="Wpisz numer, nazwę, NIP, nazwisko…" />

      {empty ? (
        <p className="text-sm text-slate-500">Wpisz frazę, aby wyszukać.</p>
      ) : total === 0 ? (
        <EmptyState title="Brak wyników" description={`Nic nie znaleziono dla „${q}”.`} />
      ) : (
        <div className="space-y-8">
          {results!.certificates.length > 0 && (
            <Group title="Certyfikaty">
              {results!.certificates.map((c) => (
                <Row
                  key={c.id}
                  to={`/panel/certyfikaty/${c.id}`}
                  primary={c.certificate_number}
                  secondary={c.status}
                />
              ))}
            </Group>
          )}

          {results!.stations.length > 0 && (
            <Group title="Stacje">
              {results!.stations.map((s) => (
                <Row
                  key={s.id}
                  to={role === "client" ? "/panel/podmioty" : undefined}
                  primary={s.name}
                  secondary={[s.city, s.nip].filter(Boolean).join(" · ")}
                />
              ))}
            </Group>
          )}

          {results!.diagnosticians.length > 0 && (
            <Group title="Diagnoci">
              {results!.diagnosticians.map((d) => (
                <Row
                  key={d.id}
                  to={role === "client" ? "/panel/podmioty" : undefined}
                  primary={`${d.first_name} ${d.last_name}`}
                  secondary={d.license_number}
                />
              ))}
            </Group>
          )}

          {results!.products.length > 0 && (
            <Group title="Produkty">
              {results!.products.map((p) => (
                <Row
                  key={p.id}
                  to={productPath(role)}
                  primary={p.name}
                  secondary={formatPLN(p.premium)}
                />
              ))}
            </Group>
          )}

          {results!.claims.length > 0 && (
            <Group title="Szkody">
              {results!.claims.map((c) => (
                <Row
                  key={c.id}
                  to={claimsPath(role)}
                  primary={c.description.slice(0, 80)}
                  secondary={CLAIM_STATUS_LABEL[c.status]}
                />
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}
