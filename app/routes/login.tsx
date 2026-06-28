import { Form, Link, data, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { getEnv } from "~/lib/context";
import { getUserContext } from "~/lib/auth.server";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { AuthLayout, Field } from "~/components/auth-layout";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Logowanie — PISKP" }];
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

  const { supabase, headers } = createSupabaseServerClient(
    request,
    getEnv(context),
  );
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return data(
      { error: "Nieprawidłowy e-mail lub hasło." },
      { status: 400, headers },
    );
  }
  throw redirect("/panel", { headers });
}

export default function Login({ actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <AuthLayout
      title="Zaloguj się"
      subtitle="Dostęp do programu ubezpieczenia PISKP."
      footer={
        <>
          Nie masz konta?{" "}
          <Link to="/register" className="font-medium text-emerald-600 hover:underline">
            Zarejestruj się
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
        <Field label="E-mail" name="email" type="email" required autoComplete="email" />
        <Field
          label="Hasło"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {busy ? "Logowanie…" : "Zaloguj się"}
        </button>
      </Form>
    </AuthLayout>
  );
}
