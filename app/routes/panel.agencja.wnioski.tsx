import { Form, data, useActionData } from "react-router";
import type { Route } from "./+types/panel.agencja.wnioski";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import { issueCertificateForApplication } from "~/lib/certificates.server";
import {
  ApplicationBadge,
  Button,
  EmptyState,
  FormError,
  PageHeader,
  formatDate,
  formatPLN,
} from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Wnioski (Agencja) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "agency",
    "admin",
  ]);

  const [apps, products, stations, diags, profiles, certs] = await Promise.all([
    supabase
      .from("izba_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("izba_products").select("id,name"),
    supabase.from("izba_stations").select("id,name"),
    supabase.from("izba_diagnosticians").select("id,first_name,last_name"),
    supabase.from("izba_profiles").select("id,full_name,email"),
    supabase.from("izba_certificates").select("application_id,certificate_number"),
  ]);

  return data(
    {
      applications: apps.data ?? [],
      products: products.data ?? [],
      stations: stations.data ?? [],
      diagnosticians: diags.data ?? [],
      profiles: profiles.data ?? [],
      certificates: certs.data ?? [],
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
  const intent = String(form.get("intent"));
  const id = String(form.get("id"));
  const now = new Date().toISOString();

  if (intent === "to_review") {
    await supabase
      .from("izba_applications")
      .update({ status: "review", reviewed_by: user.id })
      .eq("id", id);
  }

  if (intent === "reject") {
    await supabase
      .from("izba_applications")
      .update({
        status: "rejected",
        rejection_reason: String(form.get("reason") ?? "").trim() || null,
        reviewed_by: user.id,
        reviewed_at: now,
      })
      .eq("id", id);
  }

  if (intent === "approve") {
    const { error: updErr } = await supabase
      .from("izba_applications")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: now })
      .eq("id", id);
    if (updErr)
      return data({ error: updErr.message }, { status: 400, headers });

    const { error } = await issueCertificateForApplication(supabase, id, user.id);
    if (error) return data({ error }, { status: 400, headers });
  }

  return data({ error: null }, { headers });
}

export default function AgencjaWnioski({ loaderData }: Route.ComponentProps) {
  const { applications, products, stations, diagnosticians, profiles, certificates } =
    loaderData;
  const actionData = useActionData<typeof action>();

  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name ?? "—";
  const applicantName = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    return p?.full_name || p?.email || "—";
  };
  const insuredName = (a: (typeof applications)[number]) => {
    if (a.insured_type === "station")
      return stations.find((s) => s.id === a.station_id)?.name ?? "Stacja";
    const d = diagnosticians.find((x) => x.id === a.diagnostician_id);
    return d ? `${d.first_name} ${d.last_name}` : "Diagnosta";
  };
  const certNumber = (appId: string) =>
    certificates.find((c) => c.application_id === appId)?.certificate_number;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Wnioski — kolejka"
        description="Weryfikuj, zatwierdzaj (z wystawieniem certyfikatu) lub odrzucaj wnioski."
      />

      <FormError message={actionData?.error} />

      {applications.length === 0 ? (
        <EmptyState title="Brak wniosków" description="Nie wpłynęły jeszcze żadne wnioski." />
      ) : (
        <div className="space-y-4">
          {applications.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-lg text-brand-navy">
                      {productName(a.product_id)}
                    </h3>
                    <ApplicationBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Ubezpieczony: <strong>{insuredName(a)}</strong> ·{" "}
                    {a.insured_type === "station" ? "Stacja" : "Diagnosta"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Wnioskodawca: {applicantName(a.applicant_profile_id)} · Złożono:{" "}
                    {formatDate(a.created_at)} · Składka:{" "}
                    {formatPLN(a.premium_snapshot)}
                  </p>
                  {a.notes && (
                    <p className="mt-2 text-sm text-slate-600">Uwagi: {a.notes}</p>
                  )}
                  {a.status === "rejected" && a.rejection_reason && (
                    <p className="mt-2 text-sm text-red-600">
                      Powód odrzucenia: {a.rejection_reason}
                    </p>
                  )}
                  {certNumber(a.id) && (
                    <p className="mt-2 text-sm text-emerald-700">
                      Certyfikat: {certNumber(a.id)}
                    </p>
                  )}
                </div>

                {/* Akcje — dla statusów submitted / review */}
                {(a.status === "submitted" || a.status === "review") && (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      {a.status === "submitted" && (
                        <Form method="post">
                          <input type="hidden" name="id" value={a.id} />
                          <Button name="intent" value="to_review" variant="secondary">
                            Do weryfikacji
                          </Button>
                        </Form>
                      )}
                      <Form method="post">
                        <input type="hidden" name="id" value={a.id} />
                        <Button name="intent" value="approve">
                          Zatwierdź i wystaw certyfikat
                        </Button>
                      </Form>
                    </div>
                    <details className="text-right">
                      <summary className="cursor-pointer text-sm text-slate-500 hover:text-red-600">
                        Odrzuć wniosek
                      </summary>
                      <Form
                        method="post"
                        className="mt-2 flex items-center gap-2"
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <input
                          name="reason"
                          placeholder="Powód odrzucenia"
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                        />
                        <Button name="intent" value="reject" variant="danger">
                          Odrzuć
                        </Button>
                      </Form>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
