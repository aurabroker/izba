import { createContext, type RouterContextProvider } from "react-router";

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

/** Skrót po środowisko Workera w loaderze/akcji. */
export function getEnv(context: Readonly<RouterContextProvider>): Env {
  return context.get(cloudflareContext).env;
}
