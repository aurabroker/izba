import { Link, data } from "react-router";
import type { Route } from "./+types/panel.izba.certyfikaty";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  CertificateBadge,
  EmptyState,
  PageHeader,
  Table,
  formatDate,
} from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Certyfikaty (Izba) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "izba",
    "admin",
  ]);
  const { data: certificates } = await supabase
    .from("izba_certificates")
    .select("*")
    .order("issued_at", { ascending: false });
  return data({ certificates: certificates ?? [] }, { headers });
}

export default function IzbaCertyfikaty({ loaderData }: Route.ComponentProps) {
  const { certificates } = loaderData;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Wystawione certyfikaty"
        description="Wszystkie certyfikaty wystawione w ramach programu."
      />
      {certificates.length === 0 ? (
        <EmptyState title="Brak certyfikatów" />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Numer</th>
              <th className="px-4 py-3">Ważny od</th>
              <th className="px-4 py-3">Ważny do</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          }
        >
          {certificates.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-medium text-slate-800">
                {c.certificate_number}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(c.valid_from)}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(c.valid_to)}</td>
              <td className="px-4 py-3">
                <CertificateBadge status={c.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/panel/certyfikaty/${c.id}`}
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
