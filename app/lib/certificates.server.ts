import type { SupabaseServerClient } from "./supabase.server";
import { addMonths, generateCertificateNumber, isoDate } from "./format";

/**
 * Wystawia certyfikat dla zatwierdzonego wniosku i tworzy powiązaną płatność
 * (status: pending). Zwraca błąd jako string lub null przy sukcesie.
 * Wykonywane przez Agencję/Admina (RLS pilnuje uprawnień zapisu).
 */
export async function issueCertificateForApplication(
  supabase: SupabaseServerClient,
  applicationId: string,
  issuedBy: string,
): Promise<{ error: string | null; certificateId?: string }> {
  const { data: application, error: appErr } = await supabase
    .from("izba_applications")
    .select("id, product_id, premium_snapshot")
    .eq("id", applicationId)
    .single();
  if (appErr || !application) {
    return { error: "Nie znaleziono wniosku." };
  }

  // Już wystawiony?
  const { data: existing } = await supabase
    .from("izba_certificates")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (existing) {
    return { error: "Certyfikat dla tego wniosku już istnieje.", certificateId: existing.id };
  }

  const { data: product } = await supabase
    .from("izba_products")
    .select("period_months")
    .eq("id", application.product_id)
    .single();

  const validFrom = new Date();
  const validTo = addMonths(validFrom, product?.period_months ?? 12);

  const { data: cert, error: certErr } = await supabase
    .from("izba_certificates")
    .insert({
      application_id: applicationId,
      certificate_number: generateCertificateNumber(),
      issued_by: issuedBy,
      valid_from: isoDate(validFrom),
      valid_to: isoDate(validTo),
      status: "active",
    })
    .select("id")
    .single();
  if (certErr || !cert) {
    return { error: certErr?.message ?? "Nie udało się wystawić certyfikatu." };
  }

  // Płatność za składkę — termin 14 dni, status pending (ewidencja ręczna).
  const due = new Date();
  due.setDate(due.getDate() + 14);
  await supabase.from("izba_payments").insert({
    application_id: applicationId,
    certificate_id: cert.id,
    amount: application.premium_snapshot,
    currency: "PLN",
    due_date: isoDate(due),
    status: "pending",
    method: "manual",
  });

  return { error: null, certificateId: cert.id };
}
