import { data } from "react-router";
import type { Route } from "./+types/panel.admin.audyt";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import { EmptyState, PageHeader, Table } from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Rejestr zdarzeń (Admin) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "admin",
  ]);

  const { data: entries } = await supabase
    .from("izba_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const actorIds = [
    ...new Set((entries ?? []).map((e) => e.actor_id).filter(Boolean)),
  ] as string[];
  const { data: profiles } = actorIds.length
    ? await supabase
        .from("izba_profiles")
        .select("id,full_name,email")
        .in("id", actorIds)
    : { data: [] };

  return data({ entries: entries ?? [], profiles: profiles ?? [] }, { headers });
}

const ACTION_LABEL: Record<string, string> = {
  "application.created": "Utworzono wniosek",
  "application.status_changed": "Zmiana statusu wniosku",
  "certificate.issued": "Wystawiono certyfikat",
  "certificate.status_changed": "Zmiana statusu certyfikatu",
  "payment.created": "Utworzono płatność",
  "payment.status_changed": "Zmiana statusu płatności",
};

export default function AdminAudyt({ loaderData }: Route.ComponentProps) {
  const { entries, profiles } = loaderData;
  const actorName = (id: string | null) => {
    if (!id) return "system";
    const p = profiles.find((x) => x.id === id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Rejestr zdarzeń"
        description="Audyt operacji na wnioskach, certyfikatach i płatnościach (ostatnie 200)."
      />
      {entries.length === 0 ? (
        <EmptyState title="Brak zdarzeń" />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Czas</th>
              <th className="px-4 py-3">Użytkownik</th>
              <th className="px-4 py-3">Zdarzenie</th>
              <th className="px-4 py-3">Szczegóły</th>
            </tr>
          }
        >
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                {new Date(e.created_at).toLocaleString("pl-PL")}
              </td>
              <td className="px-4 py-3 text-slate-700">{actorName(e.actor_id)}</td>
              <td className="px-4 py-3 text-slate-800">
                {ACTION_LABEL[e.action] ?? e.action}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {Object.keys(e.metadata).length > 0
                  ? JSON.stringify(e.metadata)
                  : "—"}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
