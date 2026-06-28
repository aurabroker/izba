import { useState } from "react";
import { Form, Link, data, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/register";
import { getEnv } from "~/lib/context";
import { getUserContext } from "~/lib/auth.server";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { AuthLayout, Field } from "~/components/auth-layout";
import { regonMessage, useRegonLookup } from "~/components/use-regon";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Rejestracja — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user, headers } = await getUserContext(request, getEnv(context));
  if (user) throw redirect("/panel", { headers });
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const fullName = String(form.get("full_name") ?? "").trim();

  if (password.length < 8) {
    return data(
      { error: "Hasło musi mieć co najmniej 8 znaków.", confirmEmail: false },
      { status: 400 },
    );
  }

  const { supabase, headers } = createSupabaseServerClient(
    request,
    getEnv(context),
  );
  const { data: result, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return data({ error: error.message, confirmEmail: false }, { status: 400, headers });
  }

  // Gdy potwierdzanie e-mail jest włączone, sesja nie powstaje od razu.
  if (!result.session) {
    return data({ error: null, confirmEmail: true }, { headers });
  }
  throw redirect("/panel", { headers });
}

export default function Register({ actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  // REGON: pole NIP + autouzupełnienie nazwy (pole "Imię i nazwisko / nazwa").
  const regon = useRegonLookup();
  const [nip, setNip] = useState("");
  const [fullName, setFullName] = useState("");
  const [seen, setSeen] = useState<typeof regon.data>(undefined);
  if (regon.data !== seen) {
    setSeen(regon.data);
    if (regon.data?.company?.nazwa) setFullName(regon.data.company.nazwa);
  }
  const regonMsg = regonMessage(regon.data);
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

  if (actionData?.confirmEmail) {
    return (
      <AuthLayout title="Sprawdź skrzynkę" subtitle="Potwierdzenie rejestracji">
        <p className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
          Wysłaliśmy link aktywacyjny na podany adres e-mail. Po potwierdzeniu
          zaloguj się do panelu.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block font-medium text-emerald-600 hover:underline"
        >
          Przejdź do logowania
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Załóż konto"
      subtitle="Dołącz do programu ubezpieczenia PISKP."
      footer={
        <>
          Masz już konto?{" "}
          <Link to="/login" className="font-medium text-emerald-600 hover:underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      <Form method="post" className="space-y-4">
        {actionData?.error && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {actionData.error}
          </p>
        )}
        {/* NIP + pobranie danych z REGON (opcjonalnie, dla stacji/firm) */}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            NIP (opcjonalnie)
          </span>
          <div className="flex gap-2">
            <input
              name="nip"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="pobierz dane firmy z REGON"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => regon.lookup(nip)}
              disabled={regon.busy}
              className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
            >
              {regon.busy ? "…" : "REGON"}
            </button>
          </div>
          {regonMsg && (
            <span className="mt-1 block text-xs text-amber-600">{regonMsg}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Imię i nazwisko / nazwa
          </span>
          <input
            name="full_name"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </label>

        <Field label="E-mail" name="email" type="email" required autoComplete="email" />
        <Field
          label="Hasło"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="min. 8 znaków"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {busy ? "Tworzenie konta…" : "Zarejestruj się"}
        </button>
      </Form>
    </AuthLayout>
  );
}
