import { useState } from "react";
import { Form, useFetcher } from "react-router";
import { Button } from "./ui";
import type { RegonCompany } from "~/lib/regon.server";

type RegonResponse = {
  available?: boolean;
  found?: boolean;
  error?: string;
  company?: RegonCompany;
};

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const EMPTY = {
  name: "",
  nip: "",
  skp_number: "",
  street: "",
  city: "",
  postal_code: "",
};

/** Formularz dodania stacji z autouzupełnianiem danych z rejestru REGON (po NIP). */
export function StationForm() {
  const fetcher = useFetcher<RegonResponse>();
  const [f, setF] = useState(EMPTY);
  const set =
    (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  const busy = fetcher.state !== "idle";
  const resp = fetcher.data;

  // Dostosowanie stanu podczas renderu po nadejściu nowej odpowiedzi REGON
  // (wzorzec React zamiast useEffect — bez kaskadowych renderów).
  const [seen, setSeen] = useState<RegonResponse | undefined>(undefined);
  if (resp !== seen) {
    setSeen(resp);
    const c = resp?.company;
    if (c) {
      setF((prev) => ({
        ...prev,
        name: c.nazwa || prev.name,
        nip: c.nip || prev.nip,
        street:
          [c.ulica, c.nrNieruchomosci].filter(Boolean).join(" ") || prev.street,
        city: c.miejscowosc || prev.city,
        postal_code: c.kodPocztowy || prev.postal_code,
      }));
    }
  }

  const lookup = () => {
    if (f.nip.trim()) {
      fetcher.load(`/api/regon/lookup?nip=${encodeURIComponent(f.nip.trim())}`);
    }
  };

  const message =
    resp?.available === false
      ? "Integracja REGON nie jest skonfigurowana (brak klucza GUS)."
      : resp && resp.found === false
        ? (resp.error ?? "Nie znaleziono podmiotu w REGON.")
        : null;

  return (
    <Form method="post" className="card grid gap-4 p-6 sm:grid-cols-2">
      <h3 className="font-serif text-base text-brand-navy sm:col-span-2">
        Dodaj stację
      </h3>

      {/* NIP + przycisk REGON */}
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          NIP
        </span>
        <div className="flex gap-2">
          <input
            name="nip"
            value={f.nip}
            onChange={set("nip")}
            placeholder="10 cyfr"
            className={INPUT}
          />
          <button
            type="button"
            onClick={lookup}
            disabled={busy}
            className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {busy ? "Pobieranie…" : "Pobierz z REGON"}
          </button>
        </div>
        {message && <span className="mt-1 block text-xs text-amber-600">{message}</span>}
        {resp?.found && (
          <span className="mt-1 block text-xs text-emerald-600">
            Dane pobrane z rejestru REGON.
          </span>
        )}
      </label>

      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Nazwa stacji
        </span>
        <input name="name" value={f.name} onChange={set("name")} required className={INPUT} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Numer uprawnień (SKP)
        </span>
        <input
          name="skp_number"
          value={f.skp_number}
          onChange={set("skp_number")}
          className={INPUT}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Ulica</span>
        <input name="street" value={f.street} onChange={set("street")} className={INPUT} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Miasto</span>
        <input name="city" value={f.city} onChange={set("city")} className={INPUT} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Kod pocztowy
        </span>
        <input
          name="postal_code"
          value={f.postal_code}
          onChange={set("postal_code")}
          className={INPUT}
        />
      </label>

      <div className="sm:col-span-2">
        <Button name="intent" value="create_station">
          Dodaj stację
        </Button>
      </div>
    </Form>
  );
}
