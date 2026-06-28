import { data } from "react-router";
import type { Route } from "./+types/panel.izba.statystyki";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import { PageHeader, StatCard, formatPLN } from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Statystyki (Izba) — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "izba",
    "admin",
  ]);

  const [products, applications, certificates, payments] = await Promise.all([
    supabase.from("izba_products").select("active"),
    supabase.from("izba_applications").select("status"),
    supabase.from("izba_certificates").select("status"),
    supabase.from("izba_payments").select("amount,status"),
  ]);

  const apps = applications.data ?? [];
  const pays = payments.data ?? [];
  const sumBy = (s: string) =>
    pays.filter((p) => p.status === s).reduce((acc, p) => acc + Number(p.amount), 0);

  return data(
    {
      productsActive: (products.data ?? []).filter((p) => p.active).length,
      productsTotal: (products.data ?? []).length,
      appsTotal: apps.length,
      appsSubmitted: apps.filter((a) => a.status === "submitted").length,
      appsReview: apps.filter((a) => a.status === "review").length,
      appsApproved: apps.filter((a) => a.status === "approved").length,
      appsRejected: apps.filter((a) => a.status === "rejected").length,
      certsActive: (certificates.data ?? []).filter((c) => c.status === "active")
        .length,
      certsTotal: (certificates.data ?? []).length,
      paidSum: sumBy("paid"),
      pendingSum: sumBy("pending"),
      overdueSum: sumBy("overdue"),
    },
    { headers },
  );
}

export default function IzbaStatystyki({ loaderData }: Route.ComponentProps) {
  const d = loaderData;
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Statystyki programu"
        description="Przegląd kondycji programu ubezpieczenia PISKP."
      />

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-brand-navy">Wnioski</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Wszystkie wnioski" value={d.appsTotal} />
          <StatCard label="Złożone" value={d.appsSubmitted} />
          <StatCard label="W weryfikacji" value={d.appsReview} />
          <StatCard label="Zatwierdzone" value={d.appsApproved} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-brand-navy">Certyfikaty i produkty</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Aktywne certyfikaty" value={d.certsActive} />
          <StatCard label="Wszystkie certyfikaty" value={d.certsTotal} />
          <StatCard
            label="Aktywne produkty"
            value={d.productsActive}
            hint={`z ${d.productsTotal} łącznie`}
          />
          <StatCard label="Odrzucone wnioski" value={d.appsRejected} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-brand-navy">Płatności</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Opłacone" value={formatPLN(d.paidSum)} />
          <StatCard label="Oczekujące" value={formatPLN(d.pendingSum)} />
          <StatCard label="Po terminie" value={formatPLN(d.overdueSum)} />
        </div>
      </section>
    </div>
  );
}
