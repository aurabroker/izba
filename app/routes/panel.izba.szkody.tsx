import { data } from "react-router";
import type { Route } from "./+types/panel.izba.szkody";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  ClaimBadge,
  EmptyState,
  PageHeader,
  Table,
  formatDate,
  formatPLN,
} from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Szkody (Izba) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "izba",
    "admin",
  ]);
  const [claims, certs] = await Promise.all([
    supabase.from("izba_claims").select("*").order("created_at", { ascending: false }),
    supabase.from("izba_certificates").select("id,certificate_number"),
  ]);
  return data(
    { claims: claims.data ?? [], certificates: certs.data ?? [] },
    { headers },
  );
}

export default function IzbaSzkody({ loaderData }: Route.ComponentProps) {
  const { claims, certificates } = loaderData;
  const certNo = (id: string) =>
    certificates.find((c) => c.id === id)?.certificate_number ?? "—";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Szkody"
        description="Przegląd zgłoszonych szkód w programie."
      />
      {claims.length === 0 ? (
        <EmptyState title="Brak szkód" />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Certyfikat</th>
              <th className="px-4 py-3">Data zdarzenia</th>
              <th className="px-4 py-3">Kwota</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          }
        >
          {claims.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-medium text-slate-800">
                {certNo(c.certificate_id)}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(c.incident_date)}</td>
              <td className="px-4 py-3 text-slate-700">
                {c.amount_claimed != null ? formatPLN(c.amount_claimed) : "—"}
              </td>
              <td className="px-4 py-3">
                <ClaimBadge status={c.status} />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
