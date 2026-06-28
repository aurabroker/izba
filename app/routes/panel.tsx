import { data, Form, NavLink, Outlet } from "react-router";
import type { Route } from "./+types/panel";
import { getEnv } from "~/lib/context";
import { requireUser } from "~/lib/auth.server";
import { ROLE_LABEL, type AppRole } from "~/lib/types";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { profile, headers } = await requireUser(request, getEnv(context));
  return data(
    {
      profile: {
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
      },
    },
    { headers },
  );
}

type NavItem = { to: string; label: string; end?: boolean };

// Nawigacja per rola.
const NAV: Record<AppRole, NavItem[]> = {
  client: [
    { to: "/panel", label: "Pulpit", end: true },
    { to: "/panel/produkty", label: "Produkty" },
    { to: "/panel/wnioski", label: "Wnioski" },
    { to: "/panel/certyfikaty", label: "Certyfikaty" },
    { to: "/panel/platnosci", label: "Płatności" },
    { to: "/panel/podmioty", label: "Moje podmioty" },
  ],
  izba: [{ to: "/panel", label: "Pulpit", end: true }],
  agency: [
    { to: "/panel", label: "Pulpit", end: true },
    { to: "/panel/agencja/wnioski", label: "Wnioski" },
    { to: "/panel/agencja/produkty", label: "Produkty" },
    { to: "/panel/agencja/platnosci", label: "Płatności" },
  ],
  admin: [
    { to: "/panel", label: "Pulpit", end: true },
    { to: "/panel/agencja/wnioski", label: "Wnioski" },
    { to: "/panel/agencja/produkty", label: "Produkty" },
    { to: "/panel/agencja/platnosci", label: "Płatności" },
  ],
};

export default function PanelLayout({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  const items = NAV[profile.role];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar */}
      <aside className="flex flex-col border-r border-slate-100 bg-white lg:min-h-screen">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient font-serif text-base font-semibold text-white">
            PI
          </div>
          <div className="leading-tight">
            <p className="font-serif text-sm font-semibold text-brand-navy">
              PISKP
            </p>
            <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {ROLE_LABEL[profile.role]}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-brand-navy"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-4 py-4">
          <p className="truncate text-sm font-medium text-slate-700">
            {profile.full_name || profile.email}
          </p>
          <p className="truncate text-xs text-slate-400">{profile.email}</p>
          <Form method="post" action="/logout" className="mt-3">
            <button
              type="submit"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Wyloguj się
            </button>
          </Form>
        </div>
      </aside>

      {/* Treść */}
      <main className="px-6 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
