import type { Config } from "@react-router/dev/config";

export default {
  // SSR na Cloudflare Workers — ochrona tras per rola w loaderach.
  ssr: true,
} satisfies Config;
