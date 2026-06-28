import { data } from "react-router";
import type { Route } from "./+types/panel.index";
import { getEnv } from "~/lib/context";
import { requireUser } from "~/lib/auth.server";
import { ButtonLink, PageHeader, StatCard, formatPLN } from "~/components/ui";
import { ROLE_LABEL, type AppRole } from "~/lib/types";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Pulpit — PISKP" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase, profile, headers } = await requireUser(
    request,
    getEnv(context),
  );

  // Zapytania respektują RLS: Klient widzi swoje dane, personel — całość.
  const [apps, certs, pays, claims] = await Promise.all([
    supabase.from("izba_applications").select("status"),
    supabase.from("izba_certificates").select("status"),
    supabase.from("izba_payments").select("amount,status"),
    supabase.from("izba_claims").select("status,amount_claimed"),
  ]);

  const a = apps.data ?? [];
  const p = pays.data ?? [];
  const cl = claims.data ?? [];
  const sumPay = (s: string) =>
    p.filter((x) => x.status === s).reduce((acc, x) => acc + Number(x.amount), 0);

  return data(
    {
      role: profile.role,
      name: profile.full_name || profile.email || "",
      stats: {
        appsTotal: a.length,
        appsOpen: a.filter((x) => x.status === "submitted" || x.status === "review").length,
        appsApproved: a.filter((x) => x.status === "approved").length,
        appsDraft: a.filter((x) => x.status === "draft").length,
        certsActive: (certs.data ?? []).filter((c) => c.status === "active").length,
        payPending: sumPay("pending"),
        payOverdue: sumPay("overdue"),
        payPaid: sumPay("paid"),
        claimsTotal: cl.length,
        claimsOpen: cl.filter((x) => x.status === "reported" || x.status === "in_review").length,
      },
    },
    { headers },
  );
}

type Stats = Route.ComponentProps["loaderData"]["stats"];

function cardsFor(role: AppRole, s: Stats) {
  if (role === "client") {
    return [
      { label: "Moje wnioski", value: s.appsTotal, hint: `${s.appsDraft} szkiców` },
      { label: "Aktywne certyfikaty", value: s.certsActive },
      { label: "Do zapłaty", value: formatPLN(s.payPending + s.payOverdue) },
      { label: "Otwarte szkody", value: s.claimsOpen, hint: `z ${s.claimsTotal} łącznie` },
    ];
  }
  if (role === "izba") {
    return [
      { label: "Wnioski łącznie", value: s.appsTotal },
      { label: "Aktywne certyfikaty", value: s.certsActive },
      { label: "Składki opłacone", value: formatPLN(s.payPaid) },
      { label: "Szkody (otwarte)", value: s.claimsOpen },
    ];
  }
  // agency / admin
  return [
    { label: "Wnioski do obsługi", value: s.appsOpen, hint: `${s.appsApproved} zatwierdzonych` },
    { label: "Aktywne certyfikaty", value: s.certsActive },
    { label: "Po terminie", value: formatPLN(s.payOverdue), hint: `oczekuje ${formatPLN(s.payPending)}` },
    { label: "Szkody do analizy", value: s.claimsOpen },
  ];
}

function quickLinks(role: AppRole) {
  if (role === "client")
    return [
      { to: "/panel/wnioski", label: "Złóż wniosek" },
      { to: "/panel/szkody", label: "Zgłoś szkodę" },
      { to: "/panel/podmioty", label: "Moje podmioty" },
    ];
  if (role === "izba")
    return [
      { to: "/panel/izba/statystyki", label: "Statystyki" },
      { to: "/panel/izba/certyfikaty", label: "Certyfikaty" },
      { to: "/panel/izba/szkody", label: "Szkody" },
    ];
  if (role === "agency")
    return [
      { to: "/panel/agencja/wnioski", label: "Kolejka wniosków" },
      { to: "/panel/agencja/szkody", label: "Szkody" },
      { to: "/panel/agencja/platnosci", label: "Płatności" },
    ];
  return [
    { to: "/panel/agencja/wnioski", label: "Kolejka wniosków" },
    { to: "/panel/admin/uzytkownicy", label: "Użytkownicy" },
    { to: "/panel/admin/audyt", label: "Audyt" },
  ];
}

export default function PanelIndex({ loaderData }: Route.ComponentProps) {
  const { role, name, stats } = loaderData;
  const cards = cardsFor(role, stats);
  const links = quickLinks(role);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={`Witaj, ${name}`} description={`Panel: ${ROLE_LABEL[role]}`} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} hint={c.hint} />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-serif text-lg text-brand-navy">Szybkie akcje</h2>
        <div className="flex flex-wrap gap-3">
          {links.map((l) => (
            <ButtonLink key={l.to} to={l.to} variant="secondary">
              {l.label}
            </ButtonLink>
          ))}
        </div>
      </div>
    </div>
  );
}
