import { Form, data, useActionData } from "react-router";
import type { Route } from "./+types/panel.agencja.produkty";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  Button,
  EmptyState,
  Field,
  FilterBar,
  FormError,
  PageHeader,
  Select,
  Textarea,
  formatPLN,
} from "~/components/ui";

const TARGET_OPTIONS = [
  { value: "both", label: "Stacja lub diagnosta" },
  { value: "station", label: "Stacja" },
  { value: "diagnostician", label: "Diagnosta" },
];

export function meta(_: Route.MetaArgs) {
  return [{ title: "Produkty (Agencja) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "agency",
    "admin",
  ]);
  const activeParam = new URL(request.url).searchParams.get("active");

  let query = supabase
    .from("izba_products")
    .select("*")
    .order("created_at", { ascending: false });
  if (activeParam === "true" || activeParam === "false") {
    query = query.eq("active", activeParam === "true");
  }

  const { data: products } = await query;
  return data({ products: products ?? [] }, { headers });
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase, user, headers } = await requireRole(
    request,
    getEnv(context),
    ["agency", "admin"],
  );
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "create") {
    const premium = Number(form.get("premium"));
    const sumInsured = form.get("sum_insured")
      ? Number(form.get("sum_insured"))
      : null;
    const { error } = await supabase.from("izba_products").insert({
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || null,
      applies_to: String(form.get("applies_to")) as
        | "station"
        | "diagnostician"
        | "both",
      premium,
      sum_insured: sumInsured,
      coverage_scope: String(form.get("coverage_scope") ?? "").trim() || null,
      period_months: Number(form.get("period_months")) || 12,
      created_by: user.id,
    });
    if (error) return data({ error: error.message }, { status: 400, headers });
  }

  if (intent === "update") {
    const sumInsured = form.get("sum_insured")
      ? Number(form.get("sum_insured"))
      : null;
    const { error } = await supabase
      .from("izba_products")
      .update({
        name: String(form.get("name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim() || null,
        applies_to: String(form.get("applies_to")) as
          | "station"
          | "diagnostician"
          | "both",
        premium: Number(form.get("premium")),
        sum_insured: sumInsured,
        coverage_scope: String(form.get("coverage_scope") ?? "").trim() || null,
        period_months: Number(form.get("period_months")) || 12,
      })
      .eq("id", String(form.get("id")));
    if (error) return data({ error: error.message }, { status: 400, headers });
  }

  if (intent === "toggle_active") {
    await supabase
      .from("izba_products")
      .update({ active: form.get("active") === "true" })
      .eq("id", String(form.get("id")));
  }

  if (intent === "delete") {
    const { error } = await supabase
      .from("izba_products")
      .delete()
      .eq("id", String(form.get("id")));
    if (error)
      return data(
        { error: "Nie można usunąć produktu (istnieją powiązane wnioski). Dezaktywuj go zamiast usuwać." },
        { status: 400, headers },
      );
  }

  return data({ error: null }, { headers });
}

export default function AgencjaProdukty({ loaderData }: Route.ComponentProps) {
  const { products } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Produkty — zarządzanie"
        description="Dodawaj i konfiguruj produkty ubezpieczeniowe programu PISKP."
      />

      <FormError message={actionData?.error} />

      <FilterBar
        param="active"
        options={[
          { value: "", label: "Wszystkie" },
          { value: "true", label: "Aktywne" },
          { value: "false", label: "Nieaktywne" },
        ]}
      />

      {products.length === 0 ? (
        <EmptyState title="Brak produktów" description="Dodaj pierwszy produkt poniżej." />
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg text-brand-navy">{p.name}</h3>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.active ? "Aktywny" : "Nieaktywny"}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {formatPLN(p.premium)} · {p.period_months} mies. ·{" "}
                    {TARGET_OPTIONS.find((t) => t.value === p.applies_to)?.label}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Form method="post">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={(!p.active).toString()} />
                    <Button name="intent" value="toggle_active" variant="secondary">
                      {p.active ? "Dezaktywuj" : "Aktywuj"}
                    </Button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="id" value={p.id} />
                    <Button name="intent" value="delete" variant="secondary">
                      Usuń
                    </Button>
                  </Form>
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-emerald-600">
                  Edytuj
                </summary>
                <Form method="post" className="mt-3 grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="id" value={p.id} />
                  <div className="sm:col-span-2">
                    <Field label="Nazwa produktu" name="name" required defaultValue={p.name} />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea label="Opis" name="description" defaultValue={p.description ?? ""} />
                  </div>
                  <Select
                    label="Dla kogo"
                    name="applies_to"
                    defaultValue={p.applies_to}
                    options={TARGET_OPTIONS}
                  />
                  <Field
                    label="Okres (miesiące)"
                    name="period_months"
                    type="number"
                    min="1"
                    defaultValue={p.period_months}
                  />
                  <Field
                    label="Składka (PLN)"
                    name="premium"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={p.premium}
                  />
                  <Field
                    label="Suma ubezpieczenia (PLN)"
                    name="sum_insured"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={p.sum_insured ?? ""}
                  />
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Zakres ochrony"
                      name="coverage_scope"
                      defaultValue={p.coverage_scope ?? ""}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button name="intent" value="update">
                      Zapisz zmiany
                    </Button>
                  </div>
                </Form>
              </details>
            </div>
          ))}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-brand-navy">Nowy produkt</h2>
        <Form method="post" className="card grid gap-4 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nazwa produktu" name="name" required />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Opis" name="description" />
          </div>
          <Select
            label="Dla kogo"
            name="applies_to"
            defaultValue="both"
            options={TARGET_OPTIONS}
          />
          <Field label="Okres (miesiące)" name="period_months" type="number" min="1" defaultValue={12} />
          <Field label="Składka (PLN)" name="premium" type="number" step="0.01" min="0" required />
          <Field label="Suma ubezpieczenia (PLN)" name="sum_insured" type="number" step="0.01" min="0" />
          <div className="sm:col-span-2">
            <Textarea label="Zakres ochrony" name="coverage_scope" />
          </div>
          <div className="sm:col-span-2">
            <Button name="intent" value="create">
              Dodaj produkt
            </Button>
          </div>
        </Form>
      </section>
    </div>
  );
}
