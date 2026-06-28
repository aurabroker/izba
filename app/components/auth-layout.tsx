import { Link } from "react-router";

/** Wspólny układ ekranów logowania/rejestracji: granatowy panel + karta formularza. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel brandowy */}
      <div className="hidden bg-hero-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-serif text-lg font-semibold">
            PI
          </div>
          <div className="leading-tight">
            <p className="font-serif text-sm font-semibold">PISKP</p>
            <p className="text-xs text-white/70">
              Polska Izba Stacji Kontroli Pojazdów
            </p>
          </div>
        </Link>
        <div>
          <h2 className="max-w-md font-serif text-3xl leading-snug">
            Program ubezpieczenia dla stacji kontroli pojazdów i diagnostów
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Wnioski, certyfikaty i płatności w jednym miejscu.
          </p>
        </div>
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} PISKP
        </p>
      </div>

      {/* Formularz */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-serif text-2xl text-brand-navy">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/** Pole formularza (label + input) — bezstanowe, sterowane propsami. */
export function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
