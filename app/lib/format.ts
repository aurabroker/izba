// Czyste funkcje pomocnicze (formatowanie, daty, numer certyfikatu).
// Wydzielone z komponentów/serwera, by były łatwo testowalne.

export function formatPLN(value: number): string {
  return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pl-PL");
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Numer certyfikatu w formacie PISKP/RRRR/XXXXXX. */
export function generateCertificateNumber(now: Date = new Date()): string {
  const year = now.getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PISKP/${year}/${rand}`;
}
