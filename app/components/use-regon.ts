import { useFetcher } from "react-router";
import type { RegonCompany } from "~/lib/regon.server";

export type RegonResponse = {
  available?: boolean;
  found?: boolean;
  error?: string;
  company?: RegonCompany;
};

/** Hook do wyszukiwania podmiotu w REGON po NIP (przez /api/regon/lookup). */
export function useRegonLookup() {
  const fetcher = useFetcher<RegonResponse>();
  return {
    busy: fetcher.state !== "idle",
    data: fetcher.data,
    lookup: (nip: string) => {
      const n = nip.trim();
      if (n) fetcher.load(`/api/regon/lookup?nip=${encodeURIComponent(n)}`);
    },
  };
}

export function regonMessage(resp?: RegonResponse): string | null {
  if (!resp) return null;
  if (resp.available === false)
    return "Integracja REGON nie jest skonfigurowana (brak klucza GUS).";
  if (resp.found === false) return resp.error ?? "Nie znaleziono podmiotu w REGON.";
  return null;
}
