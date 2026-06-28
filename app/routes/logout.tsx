import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { getEnv } from "~/lib/context";
import { createSupabaseServerClient } from "~/lib/supabase.server";

// Wylogowanie tylko przez POST (chroni przed wylogowaniem z linku/GET).
export async function action({ request, context }: Route.ActionArgs) {
  const { supabase, headers } = createSupabaseServerClient(
    request,
    getEnv(context),
  );
  await supabase.auth.signOut();
  throw redirect("/login", { headers });
}

export async function loader() {
  throw redirect("/");
}
