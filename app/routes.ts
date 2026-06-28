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

  // Panel — wspólny layout z nawigacją per rola.
  route("panel", "routes/panel.tsx", [
    index("routes/panel.index.tsx"),
  ]),
] satisfies RouteConfig;
