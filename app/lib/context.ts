import { createContext } from "react-router";

/**
 * Kontekst loaderów/akcji (React Router 8) niosący środowisko Cloudflare
 * Workera: bindings z `env` (sekrety, R2, vars) oraz `ExecutionContext`.
 *
 * W loaderze/akcji:  const { env } = context.get(cloudflareContext);
 */
export const cloudflareContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
}>();
