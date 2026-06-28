import { data } from "react-router";
import type { Route } from "./+types/panel.izba.produkty";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import { EmptyState, PageHeader, Table, formatPLN } from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Produkty (Izba) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "izba",
    "admin",
  ]);
  const { data: products } = await supabase
    .from("izba_products")
    .select("*")
    .order("name");
  return data({ products: products ?? [] }, { headers });
}

export default function IzbaProdukty({ loaderData }: Route.ComponentProps) {
  const { products } = loaderData;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Produkty programu"
        description="Dostępne produkty ubezpieczeniowe (podgląd)."
      />
      {products.length === 0 ? (
        <EmptyState title="Brak produktów" />
      ) : (
        <Table
          head={
            <tr>
              <th className="px-4 py-3">Nazwa</th>
              <th className="px-4 py-3">Składka</th>
              <th className="px-4 py-3">Okres</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          }
        >
          {products.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
              <td className="px-4 py-3 text-slate-700">{formatPLN(p.premium)}</td>
              <td className="px-4 py-3 text-slate-600">{p.period_months} mies.</td>
              <td className="px-4 py-3 text-slate-600">
                {p.active ? "Aktywny" : "Nieaktywny"}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
