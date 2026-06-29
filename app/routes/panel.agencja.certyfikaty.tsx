import { Link, data } from "react-router";
import type { Route } from "./+types/panel.agencja.certyfikaty";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  CertificateBadge,
  EmptyState,
  PageHeader,
  SearchBox,
  Table,
  formatDate,
} from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Certyfikaty (Agencja) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "agency",
    "admin",
  ]);
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase();

  const [certs, apps, stations, diags, profiles] = await Promise.all([
    supabase
      .from("izba_certificates")
      .select("*")
      .order("issued_at", { ascending: false }),
    supabase
      .from("izba_applications")
      .select("id,applicant_profile_id,insured_type,station_id,diagnostician_id"),
    supabase.from("izba_stations").select("id,name,nip"),
    supabase.from("izba_diagnosticians").select("id,first_name,last_name,license_number"),
    supabase.from("izba_profiles").select("id,full_name,email"),
  ]);

  const appById = new Map((apps.data ?? []).map((a) => [a.id, a]));
  const stationById = new Map((stations.data ?? []).map((s) => [s.id, s]));
  const diagById = new Map((diags.data ?? []).map((d) => [d.id, d]));
  const profileById = new Map((profiles.data ?? []).map((p) => [p.id, p]));

  const rows = (certs.data ?? []).map((c) => {
    const app = appById.get(c.application_id);
    let insured = "—";
    let extra = "";
    if (app?.insured_type === "station" && app.station_id) {
      const s = stationById.get(app.station_id);
      insured = s?.name ?? "Stacja";
      extra = s?.nip ?? "";
    } else if (app?.diagnostician_id) {
      const d = diagById.get(app.diagnostician_id);
      insured = d ? `${d.first_name} ${d.last_name}` : "Diagnosta";
      extra = d?.license_number ?? "";
    }
    const prof = app ? profileById.get(app.applicant_profile_id) : undefined;
    const applicant = prof?.full_name || prof?.email || "—";
    const haystack = [c.certificate_number, insured, extra, applicant]
      .join(" ")
      .toLowerCase();
    return {
      id: c.id,
      number: c.certificate_number,
      insured,
      applicant,
      validTo: c.valid_to,
      status: c.status,
      haystack,
    };
  });

  const filtered = q ? rows.filter((r) => r.haystack.includes(q)) : rows;

  return data({ rows: filtered, total: rows.length, q }, { headers });
}

export default function AgencjaCertyfikaty({ loaderData }: Route.ComponentProps) {
  const { rows, total, q } = loaderData;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Certyfikaty"
        description="Wszystkie wystawione certyfikaty programu. Wyszukaj po numerze, ubezpieczonym, NIP lub wnioskodawcy."
      />

      <SearchBox placeholder="Numer, ubezpieczony, NIP, wnioskodawca…" />

      {q && (
        <p className="text-sm text-slate-500">
          Wyniki dla „{q}”: {rows.length} z {total}
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Brak certyfikatów"
          description={q ? "Brak wyników dla zapytania." : "Nie wystawiono jeszcze certyfikatów."}
        />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Numer</th>
              <th className="px-4 py-3">Ubezpieczony</th>
              <th className="px-4 py-3">Wnioskodawca</th>
              <th className="px-4 py-3">Ważny do</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          }
        >
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-slate-800">{r.number}</td>
              <td className="px-4 py-3 text-slate-600">{r.insured}</td>
              <td className="px-4 py-3 text-slate-600">{r.applicant}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(r.validTo)}</td>
              <td className="px-4 py-3">
                <CertificateBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/panel/certyfikaty/${r.id}`}
                  className="font-medium text-emerald-600 hover:underline"
                >
                  Podgląd
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
