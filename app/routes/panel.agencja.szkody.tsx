import { Form, data, useActionData } from "react-router";
import type { Route } from "./+types/panel.agencja.szkody";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  Button,
  ClaimBadge,
  EmptyState,
  FilterBar,
  FormError,
  PageHeader,
  formatDate,
  formatPLN,
} from "~/components/ui";
import { CLAIM_STATUS_LABEL, type ClaimStatus } from "~/lib/types";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Szkody (Agencja) — PISKP" }];
}

const STATUS_FILTER = [
  { value: "", label: "Wszystkie" },
  { value: "reported", label: "Zgłoszone" },
  { value: "in_review", label: "W analizie" },
  { value: "accepted", label: "Uznane" },
  { value: "rejected", label: "Odrzucone" },
  { value: "paid", label: "Wypłacone" },
];

const ALLOWED: ClaimStatus[] = [
  "reported",
  "in_review",
  "accepted",
  "rejected",
  "paid",
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "agency",
    "admin",
  ]);
  const status = new URL(request.url).searchParams.get("status") ?? "";

  let q = supabase
    .from("izba_claims")
    .select("*")
    .order("created_at", { ascending: false });
  if (ALLOWED.includes(status as ClaimStatus)) {
    q = q.eq("status", status as ClaimStatus);
  }

  const [claims, certs, profiles] = await Promise.all([
    q,
    supabase.from("izba_certificates").select("id,certificate_number"),
    supabase.from("izba_profiles").select("id,full_name,email"),
  ]);

  return data(
    {
      claims: claims.data ?? [],
      certificates: certs.data ?? [],
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
  const status = String(form.get("status")) as ClaimStatus;
  if (!ALLOWED.includes(status)) {
    return data({ error: "Nieprawidłowy status." }, { status: 400, headers });
  }
  await supabase
    .from("izba_claims")
    .update({
      status,
      resolution_note: String(form.get("resolution_note") ?? "").trim() || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", String(form.get("id")));
  return data({ error: null }, { headers });
}

export default function AgencjaSzkody({ loaderData }: Route.ComponentProps) {
  const { claims, certificates, profiles } = loaderData;
  const actionData = useActionData<typeof action>();
  const certNo = (id: string) =>
    certificates.find((c) => c.id === id)?.certificate_number ?? "—";
  const reporter = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    return p?.full_name || p?.email || "—";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Szkody — obsługa"
        description="Analizuj zgłoszone szkody i aktualizuj ich status."
      />
      <FormError message={actionData?.error} />
      <FilterBar param="status" options={STATUS_FILTER} />

      {claims.length === 0 ? (
        <EmptyState title="Brak szkód" description="Brak szkód dla wybranego filtra." />
      ) : (
        <div className="space-y-4">
          {claims.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg text-brand-navy">
                      {certNo(c.certificate_id)}
                    </h3>
                    <ClaimBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{c.description}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Zgłaszający: {reporter(c.reported_by)} · Data zdarzenia:{" "}
                    {formatDate(c.incident_date)} · Kwota:{" "}
                    {c.amount_claimed != null ? formatPLN(c.amount_claimed) : "—"}
                  </p>
                  {c.resolution_note && (
                    <p className="mt-2 text-sm text-slate-600">
                      Notatka: {c.resolution_note}
                    </p>
                  )}
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-emerald-600">
                  Zmień status
                </summary>
                <Form method="post" className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={c.id} />
                  <textarea
                    name="resolution_note"
                    placeholder="Notatka / uzasadnienie (opcjonalnie)"
                    defaultValue={c.resolution_note ?? ""}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {ALLOWED.filter((s) => s !== c.status).map((s) => (
                      <Button
                        key={s}
                        name="status"
                        value={s}
                        variant={s === "rejected" ? "danger" : "secondary"}
                      >
                        {CLAIM_STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                </Form>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
