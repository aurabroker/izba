import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),

  // API (resource routes)
  route("api/regon/lookup", "routes/api.regon.lookup.tsx"),

  // Panel — wspólny layout z nawigacją per rola.
  route("panel", "routes/panel.tsx", [
    index("routes/panel.index.tsx"),

    // Klient
    route("podmioty", "routes/panel.podmioty.tsx"),
    route("produkty", "routes/panel.produkty.tsx"),
    route("wnioski", "routes/panel.wnioski.tsx"),
    route("certyfikaty", "routes/panel.certyfikaty.tsx"),
    route("certyfikaty/:id", "routes/panel.certyfikaty.$id.tsx"),
    route("platnosci", "routes/panel.platnosci.tsx"),

    // Agencja / Admin — zarządzanie programem
    route("agencja/produkty", "routes/panel.agencja.produkty.tsx"),
    route("agencja/wnioski", "routes/panel.agencja.wnioski.tsx"),
    route("agencja/platnosci", "routes/panel.agencja.platnosci.tsx"),

    // Izba — przegląd (odczyt) + statystyki
    route("izba/statystyki", "routes/panel.izba.statystyki.tsx"),
    route("izba/certyfikaty", "routes/panel.izba.certyfikaty.tsx"),
    route("izba/platnosci", "routes/panel.izba.platnosci.tsx"),
    route("izba/produkty", "routes/panel.izba.produkty.tsx"),

    // Admin — użytkownicy/role + audit log
    route("admin/uzytkownicy", "routes/panel.admin.uzytkownicy.tsx"),
    route("admin/audyt", "routes/panel.admin.audyt.tsx"),
  ]),
] satisfies RouteConfig;
