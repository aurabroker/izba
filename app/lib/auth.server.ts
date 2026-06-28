import { redirect } from "react-router";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase.server";
import type { AppRole, Profile } from "./types";

/**
 * Pobiera bieżącego użytkownika i jego profil PISKP. Profil zakładany jest
 * leniwie przy pierwszym zalogowaniu (projekt współdzielony — brak triggera
 * na auth.users; rola domyślna 'client').
 */
export async function getUserContext(request: Request, env: Env) {
  const { supabase, headers } = createSupabaseServerClient(request, env);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, headers, user: null, profile: null };
  }

  const profile = await ensureProfile(supabase, user);
  return { supabase, headers, user, profile };
}

async function ensureProfile(
  supabase: ReturnType<typeof createSupabaseServerClient>["supabase"],
  user: User,
): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from("izba_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data: inserted, error } = await supabase
    .from("izba_profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? "",
    })
    .select("*")
    .single();

  if (error) {
    // Wyścig: profil mógł powstać równolegle — spróbuj odczytać ponownie.
    const { data: retry } = await supabase
      .from("izba_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return retry ?? null;
  }
  return inserted;
}

type AuthedContext = Awaited<ReturnType<typeof getUserContext>> & {
  user: User;
  profile: Profile;
};

/** Wymaga zalogowania; w przeciwnym razie redirect do /login. */
export async function requireUser(
  request: Request,
  env: Env,
): Promise<AuthedContext> {
  const ctx = await getUserContext(request, env);
  if (!ctx.user || !ctx.profile) {
    throw redirect("/login", { headers: ctx.headers });
  }
  return ctx as AuthedContext;
}

/** Wymaga jednej ze wskazanych ról; inaczej redirect do panelu domyślnego. */
export async function requireRole(
  request: Request,
  env: Env,
  roles: AppRole[],
): Promise<AuthedContext> {
  const ctx = await requireUser(request, env);
  if (!roles.includes(ctx.profile.role)) {
    throw redirect("/panel", { headers: ctx.headers });
  }
  return ctx;
}
