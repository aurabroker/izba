import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Program ubezpieczenia PISKP" },
    {
      name: "description",
      content:
        "Grupowy program ubezpieczenia dla stacji kontroli pojazdów i diagnostów — Polska Izba Stacji Kontroli Pojazdów.",
    },
  ];
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient font-serif text-lg font-semibold text-white">
              PI
            </div>
            <div className="leading-tight">
              <p className="font-serif text-sm font-semibold text-brand-navy">
                PISKP
              </p>
              <p className="text-xs text-slate-500">
                Polska Izba Stacji Kontroli Pojazdów
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <a
              href="/login"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition hover:text-brand-navy"
            >
              Zaloguj się
            </a>
            <a
              href="/register"
              className="rounded-full bg-emerald-500 px-4 py-2 font-medium text-white transition hover:bg-emerald-600"
            >
              Dołącz do programu
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-6xl px-6 py-20 text-white">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            Program grupowy
          </p>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            Ubezpieczenie dla stacji kontroli pojazdów i diagnostów
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Negocjowany przez Izbę program ochrony — wnioski, certyfikaty
            i płatności w jednym miejscu. Dla stacji SKP, diagnostów, Izby
            i Agencji.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/register"
              className="rounded-full bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-400"
            >
              Złóż wniosek
            </a>
            <a
              href="/login"
              className="rounded-full border border-white/30 px-6 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Mam już konto
            </a>
          </div>
        </div>
      </section>

      {/* Panele / role */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-serif text-2xl text-brand-navy">
          Cztery panele, jeden program
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Klient",
              desc: "Stacja SKP / diagnosta — przegląd produktów, składanie wniosków, własne certyfikaty i płatności.",
            },
            {
              title: "Izba",
              desc: "Przegląd wystawionych certyfikatów, płatności i dostępnych produktów programu.",
            },
            {
              title: "Agencja",
              desc: "Zarządzanie programem — dodawanie produktów, zatwierdzanie i wystawianie certyfikatów.",
            },
            {
              title: "Administrator",
              desc: "Pełny dostęp, zarządzanie użytkownikami i rolami, rejestr zdarzeń.",
            },
          ].map((panel) => (
            <div key={panel.title} className="card p-6">
              <h3 className="font-serif text-lg text-brand-navy">
                {panel.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{panel.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
          © {new Date().getFullYear()} Polska Izba Stacji Kontroli Pojazdów
        </div>
      </footer>
    </main>
  );
}
