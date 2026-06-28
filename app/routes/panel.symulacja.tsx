import { useState } from "react";
import { data } from "react-router";
import type { Route } from "./+types/panel.symulacja";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import { PageHeader, StatCard, formatPLN } from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Symulacja — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { headers } = await requireRole(request, getEnv(context), [
    "agency",
    "izba",
    "admin",
  ]);
  return data({}, { headers });
}

// Wartości domyślne (przybliżone dane rynkowe PL — edytowalne).
const DEFAULTS = {
  stationCount: 5400, // liczba stacji kontroli pojazdów (SKP) w Polsce
  stationPenetration: 30, // % stacji objętych programem
  stationPremium: 1200, // średnia składka roczna na stację (PLN)
  stationCommission: 15, // prowizja % od składki stacji
  diagCount: 26000, // liczba uprawnionych diagnostów w Polsce
  diagPenetration: 30, // % diagnostów objętych programem
  diagPremium: 480, // średnia składka roczna na diagnostę (PLN)
  diagCommission: 15, // prowizja % od składki diagnosty
};

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
        {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}

export default function Symulacja() {
  const [v, setV] = useState(DEFAULTS);
  const set = (k: keyof typeof DEFAULTS) => (val: number) =>
    setV((prev) => ({ ...prev, [k]: val }));

  const n = (x: number) => (Number.isFinite(x) ? x : 0);

  const stationsActive = Math.round(
    (n(v.stationCount) * n(v.stationPenetration)) / 100,
  );
  const diagActive = Math.round((n(v.diagCount) * n(v.diagPenetration)) / 100);

  const stationPremiumTotal = stationsActive * n(v.stationPremium);
  const diagPremiumTotal = diagActive * n(v.diagPremium);
  const premiumTotal = stationPremiumTotal + diagPremiumTotal;

  const stationCommissionTotal =
    (stationPremiumTotal * n(v.stationCommission)) / 100;
  const diagCommissionTotal = (diagPremiumTotal * n(v.diagCommission)) / 100;
  const commissionTotal = stationCommissionTotal + diagCommissionTotal;

  const fmtCount = (x: number) => x.toLocaleString("pl-PL");

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Symulacja przychodów programu"
        description="Oszacuj roczną składkę i prowizję w zależności od liczby uczestników, penetracji programu, średniej składki i stawki prowizji. Wartości domyślne są przybliżeniem rynku PL — dostosuj je do założeń."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stacje */}
        <section className="card space-y-4 p-6">
          <h2 className="font-serif text-lg text-brand-navy">Stacje kontroli (SKP)</h2>
          <NumberField label="Liczba stacji w Polsce" value={v.stationCount} onChange={set("stationCount")} />
          <NumberField label="Penetracja programu" value={v.stationPenetration} onChange={set("stationPenetration")} suffix="%" />
          <NumberField label="Średnia składka roczna / stacja" value={v.stationPremium} onChange={set("stationPremium")} suffix="zł" />
          <NumberField label="Prowizja" value={v.stationCommission} onChange={set("stationCommission")} suffix="%" />
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Uczestniczące stacje: <strong>{fmtCount(stationsActive)}</strong>
          </div>
        </section>

        {/* Diagności */}
        <section className="card space-y-4 p-6">
          <h2 className="font-serif text-lg text-brand-navy">Diagności</h2>
          <NumberField label="Liczba diagnostów w Polsce" value={v.diagCount} onChange={set("diagCount")} />
          <NumberField label="Penetracja programu" value={v.diagPenetration} onChange={set("diagPenetration")} suffix="%" />
          <NumberField label="Średnia składka roczna / diagnosta" value={v.diagPremium} onChange={set("diagPremium")} suffix="zł" />
          <NumberField label="Prowizja" value={v.diagCommission} onChange={set("diagCommission")} suffix="%" />
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Uczestniczący diagności: <strong>{fmtCount(diagActive)}</strong>
          </div>
        </section>
      </div>

      {/* Wyniki łączne */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl text-brand-navy">Wynik roczny (łącznie)</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <StatCard
            label="Składka roczna — łącznie"
            value={formatPLN(premiumTotal)}
            hint={`stacje ${formatPLN(stationPremiumTotal)} · diagności ${formatPLN(diagPremiumTotal)}`}
          />
          <StatCard
            label="Prowizja roczna — łącznie"
            value={formatPLN(commissionTotal)}
            hint={`stacje ${formatPLN(stationCommissionTotal)} · diagności ${formatPLN(diagCommissionTotal)}`}
          />
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Symulacja ma charakter poglądowy i nie stanowi oferty. Dane domyślne są
        przybliżeniem (liczba SKP i diagnostów w PL) — zweryfikuj przed użyciem
        biznesowym.
      </p>
    </div>
  );
}
