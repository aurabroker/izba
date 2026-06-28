import type { Route } from "./+types/api.regon.lookup";
import { getEnv } from "~/lib/context";
import { requireUser } from "~/lib/auth.server";
import { cleanNip, isValidNip, lookupByNip } from "~/lib/regon.server";

/**
 * Serwerowy proxy do API GUS BIR (REGON). Klucz GUS pozostaje na serwerze.
 * Wymaga zalogowania; walidacja NIP lokalnie przed odpytaniem GUS.
 * GET /api/regon/lookup?nip=1234567890
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  await requireUser(request, env);

  const nip = new URL(request.url).searchParams.get("nip") ?? "";

  if (!env.GUS_API_KEY) {
    return Response.json({ available: false }, { status: 200 });
  }
  if (!isValidNip(nip)) {
    return Response.json(
      { found: false, error: "Nieprawidłowy NIP" },
      { status: 400 },
    );
  }

  try {
    const company = await lookupByNip(env.GUS_API_KEY, cleanNip(nip));
    if (!company) return Response.json({ found: false });
    return Response.json({ found: true, company });
  } catch {
    return Response.json(
      { found: false, error: "Błąd połączenia z REGON" },
      { status: 502 },
    );
  }
}
