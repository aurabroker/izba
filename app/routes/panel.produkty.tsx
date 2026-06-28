import { data } from "react-router";
import type { Route } from "./+types/panel.produkty";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import { ButtonLink, EmptyState, PageHeader, formatPLN } from "~/components/ui";
import type { ProductTarget } from "~/lib/types";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Produkty — PISKP" }];
}

const TARGET_LABEL: Record<ProductTarget, string> = {
  station: "Stacja",
  diagnostician: "Diagnosta",
  both: "Stacja lub diagnosta",
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "client",
  ]);
  const { data: products } = await supabase
    .from("izba_products")
    .select("*")
    .eq("active", true)
    .order("premium");
  return data({ products: products ?? [] }, { headers });
}

export default function Produkty({ loaderData }: Route.ComponentProps) {
  const { products } = loaderData;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dostępne produkty"
        description="Wybierz produkt ubezpieczeniowy programu PISKP i złóż wniosek."
      />

      {products.length === 0 ? (
        <EmptyState
          title="Brak dostępnych produktów"
          description="Aktualnie żaden produkt nie jest dostępny. Zajrzyj później."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className="card flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text-lg text-brand-navy">{p.name}</h2>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {TARGET_LABEL[p.applies_to]}
                </span>
              </div>
              {p.description && (
                <p className="mt-2 text-sm text-slate-600">{p.description}</p>
              )}
              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Składka</dt>
                  <dd className="font-serif text-brand-navy">
                    {formatPLN(p.premium)}
                  </dd>
                </div>
                {p.sum_insured != null && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Suma ubezpieczenia</dt>
                    <dd className="text-slate-700">{formatPLN(p.sum_insured)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Okres</dt>
                  <dd className="text-slate-700">{p.period_months} mies.</dd>
                </div>
              </dl>
              {p.coverage_scope && (
                <p className="mt-3 text-xs text-slate-500">{p.coverage_scope}</p>
              )}
              <div className="mt-5 pt-1">
                <ButtonLink to={`/panel/wnioski?product=${p.id}`}>
                  Złóż wniosek
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
