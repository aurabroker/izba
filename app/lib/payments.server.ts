// Wymienna warstwa płatności.
//
// Na obecnym etapie program korzysta z ewidencji ręcznej (provider "manual"):
// Agencja oznacza płatności jako opłacone w panelu. Interfejs poniżej jest
// przygotowany pod realną integrację bramki (Przelewy24 / Tpay / Stripe) —
// wystarczy dodać nową implementację PaymentProvider i przełączyć getProvider,
// bez zmian w schemacie (tabela izba_payments ma już external_provider/external_ref).

export type InitPaymentInput = {
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
};

export type InitPaymentResult = {
  /** URL przekierowania do bramki (null dla trybu ręcznego). */
  redirectUrl: string | null;
  /** Identyfikator transakcji po stronie bramki. */
  externalRef: string | null;
  provider: string;
};

export interface PaymentProvider {
  readonly name: string;
  initPayment(input: InitPaymentInput): Promise<InitPaymentResult>;
  /** Weryfikacja podpisu webhooka bramki. */
  verifyWebhook(request: Request, secret: string): Promise<boolean>;
}

/** Tryb ręczny — brak realnej bramki; status ustawia Agencja w panelu. */
const manualProvider: PaymentProvider = {
  name: "manual",
  async initPayment(): Promise<InitPaymentResult> {
    return { redirectUrl: null, externalRef: null, provider: "manual" };
  },
  async verifyWebhook(): Promise<boolean> {
    return false;
  },
};

/**
 * Zwraca aktywnego dostawcę płatności. Po wyborze bramki: odczytaj
 * env.PAYMENT_PROVIDER i zwróć odpowiednią implementację (z sekretami z env).
 */
export function getPaymentProvider(_env: Env): PaymentProvider {
  // TODO: switch (env.PAYMENT_PROVIDER) { case "przelewy24": ... }
  return manualProvider;
}
