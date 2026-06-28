import { Form, data, useActionData } from "react-router";
import type { Route } from "./+types/panel.podmioty";
import { getEnv } from "~/lib/context";
import { requireRole } from "~/lib/auth.server";
import {
  Button,
  EmptyState,
  Field,
  FormError,
  PageHeader,
  Table,
} from "~/components/ui";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Moje podmioty — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, headers } = await requireRole(request, getEnv(context), [
    "client",
  ]);

  const [{ data: stations }, { data: diagnosticians }] = await Promise.all([
    supabase.from("izba_stations").select("*").order("created_at"),
    supabase.from("izba_diagnosticians").select("*").order("created_at"),
  ]);

  return data(
    { stations: stations ?? [], diagnosticians: diagnosticians ?? [] },
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
  const intent = String(form.get("intent"));

  if (intent === "create_station") {
    const { error } = await supabase.from("izba_stations").insert({
      owner_profile_id: user.id,
      name: String(form.get("name") ?? "").trim(),
      nip: emptyToNull(form.get("nip")),
      skp_number: emptyToNull(form.get("skp_number")),
      city: emptyToNull(form.get("city")),
      street: emptyToNull(form.get("street")),
      postal_code: emptyToNull(form.get("postal_code")),
    });
    if (error) return data({ error: error.message }, { status: 400, headers });
  }

  if (intent === "delete_station") {
    const { error } = await supabase
      .from("izba_stations")
      .delete()
      .eq("id", String(form.get("id")));
    if (error)
      return data(
        { error: "Nie można usunąć stacji (mogą istnieć powiązane wnioski)." },
        { status: 400, headers },
      );
  }

  if (intent === "create_diagnostician") {
    const { data: diag, error } = await supabase
      .from("izba_diagnosticians")
      .insert({
        station_id: String(form.get("station_id")),
        first_name: String(form.get("first_name") ?? "").trim(),
        last_name: String(form.get("last_name") ?? "").trim(),
        license_number: String(form.get("license_number") ?? "").trim(),
        email: emptyToNull(form.get("email")),
      })
      .select("id")
      .single();
    if (error) return data({ error: error.message }, { status: 400, headers });

    const pesel = emptyToNull(form.get("pesel"));
    if (pesel) {
      await supabase
        .from("izba_diagnostician_pii")
        .insert({ diagnostician_id: diag.id, pesel });
    }
  }

  if (intent === "delete_diagnostician") {
    await supabase
      .from("izba_diagnosticians")
      .delete()
      .eq("id", String(form.get("id")));
  }

  return data({ error: null }, { headers });
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export default function Podmioty({ loaderData }: Route.ComponentProps) {
  const { stations, diagnosticians } = loaderData;
  const actionData = useActionData<typeof action>();
  const stationName = (id: string | null) =>
    stations.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <PageHeader
        title="Moje podmioty"
        description="Zarządzaj swoimi stacjami kontroli pojazdów oraz przypisanymi diagnostami. Te dane wykorzystasz przy składaniu wniosków."
      />

      <FormError message={actionData?.error} />

      {/* Stacje */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl text-brand-navy">Stacje (SKP)</h2>

        {stations.length === 0 ? (
          <EmptyState
            title="Brak stacji"
            description="Dodaj pierwszą stację kontroli pojazdów."
          />
        ) : (
          <Table
            head={
              <tr>
                <th className="px-4 py-3">Nazwa</th>
                <th className="px-4 py-3">NIP</th>
                <th className="px-4 py-3">Nr uprawnień</th>
                <th className="px-4 py-3">Miasto</th>
                <th className="px-4 py-3"></th>
              </tr>
            }
          >
            {stations.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.nip ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{s.skp_number ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{s.city ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Form method="post">
                    <input type="hidden" name="id" value={s.id} />
                    <Button name="intent" value="delete_station" variant="secondary">
                      Usuń
                    </Button>
                  </Form>
                </td>
              </tr>
            ))}
          </Table>
        )}

        <Form method="post" className="card grid gap-4 p-6 sm:grid-cols-2">
          <h3 className="font-serif text-base text-brand-navy sm:col-span-2">
            Dodaj stację
          </h3>
          <Field label="Nazwa stacji" name="name" required />
          <Field label="NIP" name="nip" />
          <Field label="Numer uprawnień (SKP)" name="skp_number" />
          <Field label="Miasto" name="city" />
          <Field label="Ulica" name="street" />
          <Field label="Kod pocztowy" name="postal_code" />
          <div className="sm:col-span-2">
            <Button name="intent" value="create_station">
              Dodaj stację
            </Button>
          </div>
        </Form>
      </section>

      {/* Diagności */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl text-brand-navy">Diagności</h2>

        {diagnosticians.length === 0 ? (
          <EmptyState
            title="Brak diagnostów"
            description="Najpierw dodaj stację, następnie przypisz do niej diagnostów."
          />
        ) : (
          <Table
            head={
              <tr>
                <th className="px-4 py-3">Imię i nazwisko</th>
                <th className="px-4 py-3">Nr uprawnień</th>
                <th className="px-4 py-3">Stacja</th>
                <th className="px-4 py-3"></th>
              </tr>
            }
          >
            {diagnosticians.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {d.first_name} {d.last_name}
                </td>
                <td className="px-4 py-3 text-slate-600">{d.license_number}</td>
                <td className="px-4 py-3 text-slate-600">
                  {stationName(d.station_id)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Form method="post">
                    <input type="hidden" name="id" value={d.id} />
                    <Button
                      name="intent"
                      value="delete_diagnostician"
                      variant="secondary"
                    >
                      Usuń
                    </Button>
                  </Form>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {stations.length > 0 && (
          <Form method="post" className="card grid gap-4 p-6 sm:grid-cols-2">
            <h3 className="font-serif text-base text-brand-navy sm:col-span-2">
              Dodaj diagnostę
            </h3>
            <Field label="Imię" name="first_name" required />
            <Field label="Nazwisko" name="last_name" required />
            <Field label="Numer uprawnień diagnosty" name="license_number" required />
            <Field label="PESEL (opcjonalnie)" name="pesel" />
            <Field label="E-mail" name="email" type="email" />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Stacja
              </span>
              <select
                name="station_id"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <Button name="intent" value="create_diagnostician">
                Dodaj diagnostę
              </Button>
            </div>
          </Form>
        )}
      </section>
    </div>
  );
}
