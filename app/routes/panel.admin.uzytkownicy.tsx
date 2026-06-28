import { Form, data, useActionData } from "react-router";
import type { Route } from "./+types/panel.admin.uzytkownicy";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  Button,
  EmptyState,
  FormError,
  PageHeader,
  Table,
  formatDate,
} from "~/components/ui";
import { ROLE_LABEL, type AppRole } from "~/lib/types";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Użytkownicy (Admin) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers, profile } = await requireRole(
    request,
    getEnv(context),
    ["admin"],
  );
  const { data: profiles } = await supabase
    .from("izba_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return data({ profiles: profiles ?? [], selfId: profile.id }, { headers });
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "admin",
  ]);
  const form = await request.formData();
  const id = String(form.get("id"));
  const role = String(form.get("role")) as AppRole;

  const { error } = await supabase
    .from("izba_profiles")
    .update({ role })
    .eq("id", id);
  if (error) return data({ error: error.message }, { status: 400, headers });
  return data({ error: null }, { headers });
}

const ROLES: AppRole[] = ["client", "izba", "agency", "admin"];

export default function AdminUzytkownicy({ loaderData }: Route.ComponentProps) {
  const { profiles, selfId } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Użytkownicy i role"
        description="Zarządzaj rolami użytkowników programu. Zmiana roli wymaga uprawnień administratora."
      />
      <FormError message={actionData?.error} />

      {profiles.length === 0 ? (
        <EmptyState title="Brak użytkowników" />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Użytkownik</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Dołączył</th>
              <th className="px-4 py-3">Rola</th>
            </tr>
          }
        >
          {profiles.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium text-slate-800">
                {p.full_name || "—"}
                {p.id === selfId && (
                  <span className="ml-2 text-xs text-slate-400">(Ty)</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{p.email ?? "—"}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(p.created_at)}</td>
              <td className="px-4 py-3">
                <Form method="post" className="flex items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <select
                    name="role"
                    defaultValue={p.role}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                  <Button name="_" value="x" variant="secondary">
                    Zapisz
                  </Button>
                </Form>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
