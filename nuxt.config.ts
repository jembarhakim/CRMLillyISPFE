// https://nuxt.com/docs/api/configuration/nuxt-config
import type { NuxtPage } from "nuxt/schema";

export default defineNuxtConfig({
  css: [
    "~/assets/css/tailwind.css",
    "~/assets/css/global.css",
  ],
  plugins: [
    "~/plugins/notification-init.client.ts",
    "~/plugins/auth-init.client.ts",
    "~/plugins/auth-persistence.client.ts", 
    "~/plugins/echarts.ts"
  ],
  // SSR mode - no prerendering needed
  echarts: {
    charts: ["BarChart", "LineChart", "PieChart"],
    components: ["DatasetComponent", "GridComponent", "TooltipComponent"],
    features: ["LabelLayout", "UniversalTransition"],
    renderer: ["svg", "canvas"],
  },
  runtimeConfig: {
    public: {
      API_HOST: process.env.NUXT_PUBLIC_API_HOST || 'http://rndpolije.lilly.net.id',
      WA_HOST: process.env.NUXT_PUBLIC_WA_HOST || 'http://rndpolije.lilly.net.id',
    },
  },
  // Remove automatic middleware assignment to prevent race conditions
  // Middleware will be applied manually in each page that needs it
  
  // Add debugging configuration
  debug: true,
  devtools: { enabled: true },
  app: {
    head: {
      title: "CRM System",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        { name: "description", content: "Customer Relationship Management System" },
      ],
    },
  },
  typescript: {
    typeCheck: false,
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: true, // Re-enable SSR after removing conflicting @nuxt/icon package
  modules: [
    "@pinia/nuxt",
    "@nuxt/ui",
    "@nuxtjs/leaflet",
    "@i2d/nuxt-pdf-frame",
    "nuxt-echarts"
  ],
  // Configure Nuxt UI icons - bundle instead of dynamic loading
  icon: {
    serverBundle: 'local',  // Bundle icons in build instead of API endpoint
    clientBundle: {
      scan: true,          // Scan and bundle all icons used in the app
      includeCustomCollections: true
    }
  },
  imports: {
    dirs: ["composables", "stores"],
  },
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
  // Allow external connections for mobile development
  devServer: {
    host: '0.0.0.0', // Allow connections from any IP
    port: 3000
  },
});
