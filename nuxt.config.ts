// https://nuxt.com/docs/api/configuration/nuxt-config
import type { NuxtPage } from "nuxt/schema";
import Icons from 'unplugin-icons/vite'

export default defineNuxtConfig({
  vite: {
    plugins: [
      Icons({
        autoInstall: true,
        compiler: 'vue3'
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router'],
            ui: ['@nuxt/ui']
          }
        }
      }
    }
  },
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
      link: [
        {
          rel: "stylesheet",
          href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        }
      ]
    },
  },
  typescript: {
    typeCheck: false,
  },
  compatibilityDate: "2024-11-01",
  ssr: true, // Enable SSR for proper API calls
  modules: [
    "@pinia/nuxt",
    "@nuxt/ui",
    "@nuxtjs/leaflet",
    "@i2d/nuxt-pdf-frame",
    "nuxt-echarts"
  ],
  // Nuxt UI configuration
  // Note: Icon configuration is handled via unplugin-icons in Vite plugins
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

  // Configure router for better SPA handling
  router: {
    options: {
      hashMode: false
    }
  },
});
