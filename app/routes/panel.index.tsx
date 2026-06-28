import { useRouteLoaderData } from "react-router";
import { ROLE_LABEL, type AppRole } from "~/lib/types";

type PanelData = {
  profile: { full_name: string; email: string | null; role: AppRole };
};

const INTRO: Record<AppRole, { title: string; desc: string }> = {
  client: {
    title: "Pulpit Klienta",
    desc: "Przeglądaj dostępne produkty, składaj wnioski i śledź swoje certyfikaty oraz płatności.",
  },
  izba: {
    title: "Pulpit Izby",
    desc: "Przegląd wystawionych certyfikatów, płatności i dostępnych produktów programu.",
  },
  agency: {
    title: "Pulpit Agencji",
    desc: "Zarządzaj produktami, obsługuj wnioski oraz zatwierdzaj i wystawiaj certyfikaty.",
  },
  admin: {
    title: "Pulpit Administratora",
    desc: "Pełny dostęp do danych, zarządzanie użytkownikami i rejestr zdarzeń.",
  },
};

export default function PanelIndex() {
  const data = useRouteLoaderData("routes/panel") as PanelData | undefined;
  const role = data?.profile.role ?? "client";
  const intro = INTRO[role];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="text-sm text-slate-400">{ROLE_LABEL[role]}</p>
        <h1 className="font-serif text-3xl text-brand-navy">{intro.title}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{intro.desc}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-slate-500">Witaj</p>
          <p className="mt-1 font-serif text-xl text-brand-navy">
            {data?.profile.full_name || data?.profile.email}
          </p>
        </div>
        <div className="card border-dashed p-6 text-sm text-slate-400">
          Kolejne sekcje panelu pojawią się wraz z rozwojem aplikacji.
        </div>
      </div>
    </div>
  );
}
