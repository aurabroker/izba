// Rozszerzenie typu Env Workera o sekrety nieobecne w wrangler.jsonc.
// GUS_API_KEY ustawiany jest jako sekret: `wrangler secret put GUS_API_KEY`.
declare global {
  interface Env {
    GUS_API_KEY: string;
  }
}

export {};
