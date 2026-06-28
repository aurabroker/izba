import { Form, data } from "react-router";
import type { Route } from "./+types/panel.agencja.platnosci";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  Button,
  EmptyState,
  PageHeader,
  PaymentBadge,
  Table,
  formatDate,
  formatPLN,
} from "~/components/ui";
import type { PaymentStatus } from "~/lib/types";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Płatności (Agencja) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "agency",
    "admin",
  ]);

  const [payments, apps, products, profiles] = await Promise.all([
    supabase
      .from("izba_payments")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("izba_applications").select("id,product_id,applicant_profile_id"),
    supabase.from("izba_products").select("id,name"),
    supabase.from("izba_profiles").select("id,full_name,email"),
  ]);

  return data(
    {
      payments: payments.data ?? [],
      applications: apps.data ?? [],
      products: products.data ?? [],
      profiles: profiles.data ?? [],
    },
    { headers },
  );
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase, user, headers } = await requireRole(
    request,
    getEnv(context),
    ["agency", "admin"],
  );
  const form = await request.formData();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as PaymentStatus;

  await supabase
    .from("izba_payments")
    .update({
      status,
      recorded_by: user.id,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  return data({ ok: true }, { headers });
}

export default function AgencjaPlatnosci({ loaderData }: Route.ComponentProps) {
  const { payments, applications, products, profiles } = loaderData;

  const payerName = (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return "—";
    const p = profiles.find((x) => x.id === app.applicant_profile_id);
    const prod = products.find((x) => x.id === app.product_id)?.name ?? "";
    const who = p?.full_name || p?.email || "—";
    return `${who}${prod ? ` · ${prod}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Płatności — ewidencja"
        description="Oznaczaj płatności jako opłacone lub po terminie. Integracja bramki płatności zostanie dodana w kolejnym etapie."
      />

      {payments.length === 0 ? (
        <EmptyState
          title="Brak płatności"
          description="Płatności tworzone są automatycznie przy wystawieniu certyfikatu."
        />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Płatnik / produkt</th>
              <th className="px-4 py-3">Kwota</th>
              <th className="px-4 py-3">Termin</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Opłacono</th>
              <th className="px-4 py-3"></th>
            </tr>
          }
        >
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 text-slate-700">
                {payerName(p.application_id)}
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">
                {formatPLN(p.amount)}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(p.due_date)}</td>
              <td className="px-4 py-3">
                <PaymentBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(p.paid_at)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {p.status !== "paid" && (
                    <Form method="post">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="paid" />
                      <Button name="_" value="x">
                        Oznacz opłaconą
                      </Button>
                    </Form>
                  )}
                  {p.status === "pending" && (
                    <Form method="post">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="overdue" />
                      <Button name="_" value="x" variant="secondary">
                        Po terminie
                      </Button>
                    </Form>
                  )}
                  {p.status === "paid" && (
                    <Form method="post">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="pending" />
                      <Button name="_" value="x" variant="secondary">
                        Cofnij
                      </Button>
                    </Form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
