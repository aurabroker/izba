import { data } from "react-router";
import type { Route } from "./+types/panel.certyfikaty";
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
  return [{ title: "Certyfikaty — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "client",
  ]);
  const { data: certificates } = await supabase
    .from("izba_certificates")
    .select("*")
    .order("issued_at", { ascending: false });
  return data({ certificates: certificates ?? [] }, { headers });
}

export default function Certyfikaty({ loaderData }: Route.ComponentProps) {
  const { certificates } = loaderData;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Certyfikaty"
        description="Certyfikaty wystawione w ramach zatwierdzonych wniosków."
      />

      {certificates.length === 0 ? (
        <EmptyState
          title="Brak certyfikatów"
          description="Certyfikaty pojawią się po zatwierdzeniu wniosków przez Agencję."
        />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Numer</th>
              <th className="px-4 py-3">Ważny od</th>
              <th className="px-4 py-3">Ważny do</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dokument</th>
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
              <td className="px-4 py-3">
                {c.pdf_path ? (
                  <a
                    href={`/panel/certyfikaty/${c.id}/pdf`}
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    Pobierz PDF
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
