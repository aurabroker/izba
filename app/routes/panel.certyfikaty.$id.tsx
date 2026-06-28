import { data, Link } from "react-router";
import type { Route } from "./+types/panel.certyfikaty.$id";
import { getEnv } from "~/lib/context";
import { requireUser } from "~/lib/auth.server";
import { formatDate, formatPLN } from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Certyfikat — PISKP" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { supabase, headers } = await requireUser(request, getEnv(context));

  const { data: cert } = await supabase
    .from("izba_certificates")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!cert) {
    throw new Response("Nie znaleziono certyfikatu", { status: 404, headers });
  }

  const { data: application } = await supabase
    .from("izba_applications")
    .select("*")
    .eq("id", cert.application_id)
    .single();

  const [product, station, diagnostician] = await Promise.all([
    supabase
      .from("izba_products")
      .select("name,sum_insured,coverage_scope")
      .eq("id", application!.product_id)
      .maybeSingle(),
    application?.station_id
      ? supabase
          .from("izba_stations")
          .select("name,nip,city")
          .eq("id", application.station_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    application?.diagnostician_id
      ? supabase
          .from("izba_diagnosticians")
          .select("first_name,last_name,license_number")
          .eq("id", application.diagnostician_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const insured = station.data
    ? `${station.data.name}${station.data.nip ? ` (NIP ${station.data.nip})` : ""}`
    : diagnostician.data
      ? `${diagnostician.data.first_name} ${diagnostician.data.last_name} (uprawnienia ${diagnostician.data.license_number})`
      : "—";

  return data(
    {
      cert,
      productName: product.data?.name ?? "—",
      sumInsured: product.data?.sum_insured ?? null,
      coverage: product.data?.coverage_scope ?? null,
      premium: application?.premium_snapshot ?? null,
      insured,
    },
    { headers },
  );
}

export default function CertificateDoc({ loaderData }: Route.ComponentProps) {
  const { cert, productName, sumInsured, coverage, premium, insured } = loaderData;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/panel/certyfikaty" className="text-sm text-slate-500 hover:underline">
          ← Powrót
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Drukuj / zapisz PDF
        </button>
      </div>

      <article className="card p-10">
        <header className="border-b border-slate-100 pb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-hero-gradient font-serif text-lg font-semibold text-white">
            PI
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Polska Izba Stacji Kontroli Pojazdów
          </p>
          <h1 className="mt-2 font-serif text-3xl text-brand-navy">
            Certyfikat ubezpieczenia
          </h1>
          <p className="mt-1 font-serif text-lg text-slate-600">
            {cert.certificate_number}
          </p>
        </header>

        <dl className="mt-8 grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-8">
          <Row label="Produkt" value={productName} />
          <Row label="Ubezpieczony" value={insured} />
          <Row label="Ważny od" value={formatDate(cert.valid_from)} />
          <Row label="Ważny do" value={formatDate(cert.valid_to)} />
          {sumInsured != null && (
            <Row label="Suma ubezpieczenia" value={formatPLN(sumInsured)} />
          )}
          {premium != null && <Row label="Składka" value={formatPLN(premium)} />}
        </dl>

        {coverage && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Zakres ochrony
            </p>
            <p className="mt-1 text-sm text-slate-700">{coverage}</p>
          </div>
        )}

        <footer className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          Dokument wygenerowany w systemie programu ubezpieczenia PISKP. Status:{" "}
          {cert.status === "active" ? "aktywny" : cert.status}.
        </footer>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
    </div>
  );
}
