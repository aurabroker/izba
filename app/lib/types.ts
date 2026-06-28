// Typy domenowe PISKP oraz minimalny typ `Database` dla supabase-js,
// obejmujący wyłącznie tabele z prefiksem izba_ (projekt jest współdzielony —
// pełny typegen objąłby tabele innych aplikacji).

export type AppRole = "client" | "izba" | "agency" | "admin";
export type ProductTarget = "station" | "diagnostician" | "both";
export type InsuredType = "station" | "diagnostician";
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "review"
  | "approved"
  | "rejected";
export type CertificateStatus = "active" | "expired" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled";

export type Profile = {
  id: string;
  role: AppRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type Station = {
  id: string;
  owner_profile_id: string;
  name: string;
  nip: string | null;
  skp_number: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type Diagnostician = {
  id: string;
  station_id: string | null;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  license_number: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type Product = {
  id: string;
  name: string;
  description: string | null;
  applies_to: ProductTarget;
  premium: number;
  sum_insured: number | null;
  coverage_scope: string | null;
  period_months: number;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type Application = {
  id: string;
  product_id: string;
  applicant_profile_id: string;
  insured_type: InsuredType;
  station_id: string | null;
  diagnostician_id: string | null;
  status: ApplicationStatus;
  premium_snapshot: number;
  notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Certificate = {
  id: string;
  application_id: string;
  certificate_number: string;
  issued_by: string | null;
  issued_at: string;
  valid_from: string;
  valid_to: string;
  pdf_path: string | null;
  status: CertificateStatus;
  created_at: string;
  updated_at: string;
}

export type Payment = {
  id: string;
  application_id: string;
  certificate_id: string | null;
  amount: number;
  currency: string;
  due_date: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  method: string | null;
  external_provider: string | null;
  external_ref: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AuditLogEntry = {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Insert/Update pozostawiamy permisywne (Partial) — typowanie odczytów (Row)
// jest kluczowe, a poprawność wstawień egzekwują ograniczenia DB i RLS.
type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      izba_profiles: TableDef<Profile>;
      izba_stations: TableDef<Station>;
      izba_diagnosticians: TableDef<Diagnostician>;
      izba_diagnostician_pii: TableDef<{
        diagnostician_id: string;
        pesel: string | null;
        created_at: string;
        updated_at: string;
      }>;
      izba_products: TableDef<Product>;
      izba_applications: TableDef<Application>;
      izba_certificates: TableDef<Certificate>;
      izba_payments: TableDef<Payment>;
      izba_audit_log: TableDef<AuditLogEntry>;
    };
    // Puste sekcje muszą być mapowanym typem pustym (nie Record<string,never>),
    // inaczej intersekcja Tables & Views zamienia tabele w `never`.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      izba_app_role: AppRole;
      izba_product_target: ProductTarget;
      izba_insured_type: InsuredType;
      izba_application_status: ApplicationStatus;
      izba_certificate_status: CertificateStatus;
      izba_payment_status: PaymentStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

// Etykiety PL dla statusów i ról — używane w UI (Badge itp.).
export const ROLE_LABEL: Record<AppRole, string> = {
  client: "Klient",
  izba: "Izba",
  agency: "Agencja",
  admin: "Administrator",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Szkic",
  submitted: "Złożony",
  review: "W weryfikacji",
  approved: "Zatwierdzony",
  rejected: "Odrzucony",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Oczekuje",
  paid: "Opłacona",
  overdue: "Po terminie",
  cancelled: "Anulowana",
};

export const CERTIFICATE_STATUS_LABEL: Record<CertificateStatus, string> = {
  active: "Aktywny",
  expired: "Wygasły",
  cancelled: "Anulowany",
};
