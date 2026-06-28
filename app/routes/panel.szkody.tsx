import { Form, data, useActionData } from "react-router";
import type { Route } from "./+types/panel.szkody";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  Button,
  ClaimBadge,
  EmptyState,
  Field,
  FormError,
  PageHeader,
  Table,
  Textarea,
  formatDate,
  formatPLN,
} from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Szkody — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "client",
  ]);
  const [claims, certs] = await Promise.all([
    supabase.from("izba_claims").select("*").order("created_at", { ascending: false }),
    supabase
      .from("izba_certificates")
      .select("id,certificate_number")
      .order("issued_at", { ascending: false }),
  ]);
  return data(
    { claims: claims.data ?? [], certificates: certs.data ?? [] },
    { headers },
  );
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase, user, headers } = await requireRole(
    request,
    getEnv(context),
    ["client"],
  );
  const form = await request.formData();
  const { error } = await supabase.from("izba_claims").insert({
    certificate_id: String(form.get("certificate_id")),
    reported_by: user.id,
    incident_date: String(form.get("incident_date") ?? "") || null,
    description: String(form.get("description") ?? "").trim(),
    amount_claimed: form.get("amount_claimed")
      ? Number(form.get("amount_claimed"))
      : null,
  });
  if (error)
    return data({ error: error.message, ok: false }, { status: 400, headers });
  return data({ error: null, ok: true }, { headers });
}

export default function Szkody({ loaderData }: Route.ComponentProps) {
  const { claims, certificates } = loaderData;
  const actionData = useActionData<typeof action>();
  const certNo = (id: string) =>
    certificates.find((c) => c.id === id)?.certificate_number ?? "—";

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Szkody"
        description="Zgłaszaj szkody do swoich aktywnych certyfikatów i śledź ich status."
      />

      <FormError message={actionData?.error} />
      {actionData?.ok && (
        <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          Szkoda została zgłoszona.
        </p>
      )}

      {claims.length === 0 ? (
        <EmptyState
          title="Brak zgłoszonych szkód"
          description="Nie zgłoszono dotąd żadnej szkody."
        />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Certyfikat</th>
              <th className="px-4 py-3">Data zdarzenia</th>
              <th className="px-4 py-3">Kwota</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Opis</th>
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
              <td className="px-4 py-3 max-w-xs truncate text-slate-500" title={c.description}>
                {c.description}
              </td>
            </tr>
          ))}
        </Table>
      )}

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-brand-navy">Zgłoś szkodę</h2>
        {certificates.length === 0 ? (
          <EmptyState
            title="Brak certyfikatów"
            description="Szkodę można zgłosić tylko do wystawionego certyfikatu."
          />
        ) : (
          <Form method="post" className="card grid gap-4 p-6 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Certyfikat
              </span>
              <select
                name="certificate_id"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                {certificates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.certificate_number}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Data zdarzenia" name="incident_date" type="date" />
            <Field label="Kwota roszczenia (PLN)" name="amount_claimed" type="number" step="0.01" min="0" />
            <div className="sm:col-span-2">
              <Textarea label="Opis zdarzenia" name="description" required rows={4} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Zgłoś szkodę</Button>
            </div>
          </Form>
        )}
      </section>
    </div>
  );
}
