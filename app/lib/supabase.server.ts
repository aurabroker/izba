import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Serwerowy klient Supabase dla loaderów/akcji React Router.
 * Sesja trzymana w cookies; zwracamy też `headers` z Set-Cookie, które trasa
 * MUSI dołączyć do odpowiedzi (redirect/json), aby odświeżona sesja przetrwała.
 */
export function createSupabaseServerClient(request: Request, env: Env) {
  const headers = new Headers();

  const supabase = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "").map(
            (c) => ({ name: c.name, value: c.value ?? "" }),
          );
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            );
          }
        },
      },
    },
  );

  return { supabase, headers };
}

export type SupabaseServerClient = ReturnType<
  typeof createSupabaseServerClient
>["supabase"];
