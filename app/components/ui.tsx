import { Link, useSearchParams } from "react-router";
import {
  APPLICATION_STATUS_LABEL,
  CERTIFICATE_STATUS_LABEL,
  CLAIM_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  type ApplicationStatus,
  type CertificateStatus,
  type ClaimStatus,
  type PaymentStatus,
} from "~/lib/types";

// ── Badge: status pill (mapa status → etykieta + klasy) ───────────────────
const STATUS_CLASS: Record<string, string> = {
  // wnioski
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-50 text-blue-700",
  review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  // płatności
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  // certyfikaty
  active: "bg-emerald-50 text-emerald-700",
  expired: "bg-slate-100 text-slate-500",
  // szkody
  reported: "bg-blue-50 text-blue-700",
  in_review: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
};

export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  return <Pill label={APPLICATION_STATUS_LABEL[status]} status={status} />;
}
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Pill label={PAYMENT_STATUS_LABEL[status]} status={status} />;
}
export function CertificateBadge({ status }: { status: CertificateStatus }) {
  return <Pill label={CERTIFICATE_STATUS_LABEL[status]} status={status} />;
}
export function ClaimBadge({ status }: { status: ClaimStatus }) {
  return <Pill label={CLAIM_STATUS_LABEL[status]} status={status} />;
}

function Pill({ label, status }: { label: string; status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_CLASS[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

// ── Nagłówek strony ───────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl text-brand-navy">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}

// ── Przyciski (link i submit) ─────────────────────────────────────────────
const BTN_BASE =
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60";
const BTN_VARIANT = {
  primary: "bg-emerald-500 text-white hover:bg-emerald-600",
  secondary: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  danger: "bg-red-500 text-white hover:bg-red-600",
} as const;

export function ButtonLink({
  to,
  children,
  variant = "primary",
}: {
  to: string;
  children: React.ReactNode;
  variant?: keyof typeof BTN_VARIANT;
}) {
  return (
    <Link to={to} className={`${BTN_BASE} ${BTN_VARIANT[variant]}`}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  type = "submit",
  name,
  value,
  disabled,
}: {
  children: React.ReactNode;
  variant?: keyof typeof BTN_VARIANT;
  type?: "submit" | "button";
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      name={name}
      value={value}
      disabled={disabled}
      className={`${BTN_BASE} ${BTN_VARIANT[variant]}`}
    >
      {children}
    </button>
  );
}

// ── Tabela ────────────────────────────────────────────────────────────────
export function Table({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          {head}
        </thead>
        <tbody className="divide-y divide-slate-50">{children}</tbody>
      </table>
    </div>
  );
}

// ── Wyszukiwarka (GET, parametr ?q=) ──────────────────────────────────────
export function SearchBox({ placeholder }: { placeholder?: string }) {
  const [sp] = useSearchParams();
  const others = [...sp.entries()].filter(([k]) => k !== "q");
  return (
    <form method="get" className="flex gap-2">
      {others.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        name="q"
        defaultValue={sp.get("q") ?? ""}
        placeholder={placeholder ?? "Szukaj…"}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
      <button
        type="submit"
        className="rounded-full bg-brand-navy px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        Szukaj
      </button>
    </form>
  );
}

// ── Pasek filtrów (parametr URL) ─────────────────────────────────────────
export function FilterBar({
  param,
  options,
}: {
  param: string;
  options: { value: string; label: string }[];
}) {
  const [sp] = useSearchParams();
  const current = sp.get(param) ?? "";
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = current === o.value;
        const next = new URLSearchParams(sp);
        if (o.value) next.set(param, o.value);
        else next.delete(param);
        const qs = next.toString();
        return (
          <Link
            key={o.value || "all"}
            to={qs ? `?${qs}` : "?"}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-brand-navy text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

// ── Karta statystyki ───────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-serif text-3xl text-brand-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Pusty stan ──────────────────────────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-12 text-center">
      <p className="font-serif text-lg text-brand-navy">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

// ── Pola formularzy ──────────────────────────────────────────────────────
const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  defaultValue,
  placeholder,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string | number;
  placeholder?: string;
  step?: string;
  min?: string;
}) {
  return (
    <Label label={label}>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
        min={min}
        className={INPUT_CLASS}
      />
    </Label>
  );
}

export function Textarea({
  label,
  name,
  required,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Label label={label}>
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className={INPUT_CLASS}
      />
    </Label>
  );
}

export function Select({
  label,
  name,
  required,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Label label={label}>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={INPUT_CLASS}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}

// ── Formatowanie (re-eksport z czystego modułu app/lib/format) ────────────────
export { formatPLN, formatDate } from "~/lib/format";
