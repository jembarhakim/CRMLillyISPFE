// https://nuxt.com/docs/api/configuration/nuxt-config
import type { NuxtPage } from "nuxt/schema";

export default defineNuxtConfig({
  css: [
    "~/assets/css/tailwind.css",
    "~/assets/css/global.css",
  ],
  plugins: [
    "~/plugins/auth-init.client.ts",
    "~/plugins/auth-persistence.client.ts", 
    "~/plugins/echarts.ts"
  ],
  echarts: {
    charts: ["BarChart", "LineChart", "PieChart"],
    components: ["DatasetComponent", "GridComponent", "TooltipComponent"],
    features: ["LabelLayout", "UniversalTransition"],
    renderer: ["svg", "canvas"],
  },
  runtimeConfig: {
    public: {
      API_HOST: process.env.NUXT_PUBLIC_API_HOST, // Memastikan API_HOST tersedia
      WA_HOST: process.env.NUXT_PUBLIC_WA_HOST, // Memastikan API_HOST tersedia
    },
  },
  // Remove automatic middleware assignment to prevent race conditions
  // Middleware will be applied manually in each page that needs it
  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      ],
    },
  },
  typescript: {
    typeCheck: true,
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: false, // Disable SSR to avoid auth issues during refresh
  modules: [
    "@pinia/nuxt",
    "@nuxt/ui",
    "@nuxtjs/leaflet",
    "@i2d/nuxt-pdf-frame",
    "nuxt-echarts",
  ],
  // tailwindcss: {
  //   cssPath: ["~/assets/css/tailwind.css", { injectPosition: "first" }],
  //   config: {},
  //   exposeConfig: true,
  //   viewer: true,
  //   // and more...
  // },
  pinia: {
    storesDirs: ["./stores/**"],
  },
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
});
