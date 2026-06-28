import { useState } from "react";
import {
  Form,
  data,
  useActionData,
  useSearchParams,
} from "react-router";
import type { Route } from "./+types/panel.wnioski";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  ApplicationBadge,
  Button,
  EmptyState,
  FormError,
  PageHeader,
  Table,
  Textarea,
  formatDate,
  formatPLN,
} from "~/components/ui";
import type { InsuredType } from "~/lib/types";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Wnioski — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "client",
  ]);

  const [products, stations, diagnosticians, applications] = await Promise.all([
    supabase.from("izba_products").select("*").eq("active", true).order("name"),
    supabase.from("izba_stations").select("id,name").order("name"),
    supabase
      .from("izba_diagnosticians")
      .select("id,first_name,last_name")
      .order("last_name"),
    supabase
      .from("izba_applications")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return data(
    {
      products: products.data ?? [],
      stations: stations.data ?? [],
      diagnosticians: diagnosticians.data ?? [],
      applications: applications.data ?? [],
    },
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

  const productId = String(form.get("product_id"));
  const insuredType = String(form.get("insured_type")) as InsuredType;
  const submit = form.get("intent") === "submit";

  // Składkę bierzemy autorytatywnie z bazy (nie ufamy klientowi).
  const { data: product } = await supabase
    .from("izba_products")
    .select("premium")
    .eq("id", productId)
    .single();

  if (!product) {
    return data(
      { error: "Wybrany produkt jest niedostępny.", ok: false },
      { status: 400, headers },
    );
  }

  const { error } = await supabase.from("izba_applications").insert({
    product_id: productId,
    applicant_profile_id: user.id,
    insured_type: insuredType,
    station_id: insuredType === "station" ? String(form.get("station_id")) : null,
    diagnostician_id:
      insuredType === "diagnostician"
        ? String(form.get("diagnostician_id"))
        : null,
    premium_snapshot: product.premium,
    notes: String(form.get("notes") ?? "").trim() || null,
    status: submit ? "submitted" : "draft",
  });

  if (error)
    return data({ error: error.message, ok: false }, { status: 400, headers });
  return data({ error: null, ok: true }, { headers });
}

export default function Wnioski({ loaderData }: Route.ComponentProps) {
  const { products, stations, diagnosticians, applications } = loaderData;
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get("product") ?? "";
  const [insuredType, setInsuredType] = useState<InsuredType>("station");

  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name ?? "—";
  const canApply =
    products.length > 0 &&
    (stations.length > 0 || diagnosticians.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Wnioski"
        description="Składaj wnioski o objęcie ochroną i śledź ich status."
      />

      <FormError message={actionData?.error} />
      {actionData?.ok && (
        <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          Wniosek został zapisany.
        </p>
      )}

      {/* Lista wniosków */}
      {applications.length === 0 ? (
        <EmptyState
          title="Brak wniosków"
          description="Nie złożono jeszcze żadnego wniosku."
        />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Produkt</th>
              <th className="px-4 py-3">Ubezpieczony</th>
              <th className="px-4 py-3">Składka</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Złożono</th>
            </tr>
          }
        >
          {applications.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium text-slate-800">
                {productName(a.product_id)}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {a.insured_type === "station" ? "Stacja" : "Diagnosta"}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {formatPLN(a.premium_snapshot)}
              </td>
              <td className="px-4 py-3">
                <ApplicationBadge status={a.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatDate(a.created_at)}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Formularz nowego wniosku */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl text-brand-navy">Nowy wniosek</h2>

        {!canApply ? (
          <EmptyState
            title="Nie można złożyć wniosku"
            description="Aby złożyć wniosek, musi istnieć dostępny produkt oraz co najmniej jedna stacja lub diagnosta w sekcji „Moje podmioty”."
          />
        ) : (
          <Form method="post" className="card grid gap-4 p-6 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Produkt
              </span>
              <select
                name="product_id"
                required
                defaultValue={preselect}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="" disabled>
                  Wybierz produkt…
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatPLN(p.premium)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Typ ubezpieczonego
              </span>
              <select
                name="insured_type"
                value={insuredType}
                onChange={(e) => setInsuredType(e.target.value as InsuredType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="station">Stacja</option>
                <option value="diagnostician">Diagnosta</option>
              </select>
            </label>

            {insuredType === "station" ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Stacja
                </span>
                <select
                  name="station_id"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Diagnosta
                </span>
                <select
                  name="diagnostician_id"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  {diagnosticians.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.first_name} {d.last_name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="sm:col-span-2">
              <Textarea label="Uwagi (opcjonalnie)" name="notes" />
            </div>

            <div className="flex gap-3 sm:col-span-2">
              <Button name="intent" value="submit">
                Złóż wniosek
              </Button>
              <Button name="intent" value="draft" variant="secondary">
                Zapisz szkic
              </Button>
            </div>
          </Form>
        )}
      </section>
    </div>
  );
}
