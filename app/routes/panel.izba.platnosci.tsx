import { data } from "react-router";
import type { Route } from "./+types/panel.izba.platnosci";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  EmptyState,
  PageHeader,
  PaymentBadge,
  Table,
  formatDate,
  formatPLN,
} from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Płatności (Izba) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "izba",
    "admin",
  ]);
  const { data: payments } = await supabase
    .from("izba_payments")
    .select("*")
    .order("created_at", { ascending: false });
  return data({ payments: payments ?? [] }, { headers });
}

export default function IzbaPlatnosci({ loaderData }: Route.ComponentProps) {
  const { payments } = loaderData;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Płatności"
        description="Przegląd wszystkich płatności w programie."
      />
      {payments.length === 0 ? (
        <EmptyState title="Brak płatności" />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Kwota</th>
              <th className="px-4 py-3">Termin</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Opłacono</th>
            </tr>
          }
        >
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium text-slate-800">
                {formatPLN(p.amount)}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(p.due_date)}</td>
              <td className="px-4 py-3">
                <PaymentBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(p.paid_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
