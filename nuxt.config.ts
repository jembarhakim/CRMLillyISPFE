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
          manualChunks: (id) => {
            // Exclude @nuxt/kit from client bundle
            if (id.includes('@nuxt/kit')) {
              return null
            }
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('vue-router')) {
                return 'vendor'
              }
              return 'vendor'
            }
          }
        }
      }
    },
    ssr: {
      noExternal: ['@nuxt/ui']
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
    components: [
      "DatasetComponent", 
      "GridComponent", 
      "TooltipComponent",
      "ToolboxComponent",
      "DataZoomComponent",
      "BrushComponent",
      "LegendComponent",
      "TitleComponent",
      "AxisPointerComponent",
      "MarkPointComponent",
      "MarkLineComponent"
    ],
    features: ["LabelLayout", "UniversalTransition"],
    renderer: ["svg", "canvas"],
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
  devtools: { enabled: true },
  ssr: false, // Temporarily disable SSR to fix hasOwnProperty error
  experimental: {
    payloadExtraction: false, // Disable payload extraction to prevent hydration issues
    inlineSSRStyles: false, // Prevent inline styles that can cause serialization issues
  },
  // Add hydration configuration
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => false
    }
  },
  nitro: {
    // Configure Nitro for better production builds
    experimental: {
      wasm: true
    },
    // Fix serialization issues that cause hasOwnProperty errors
    storage: {
      redis: {
        driver: 'redis',
        // Redis configuration if needed
      }
    },
    // Ensure proper serialization
    serialization: {
      // Use JSON serialization to avoid prototype chain issues
      serializers: {
        'application/json': {
          serialize: (obj: any) => JSON.stringify(obj),
          deserialize: (str: string) => JSON.parse(str)
        }
      }
    },
    // Ensure proper static asset handling
    publicAssets: [
      {
        baseURL: '/_nuxt',
        dir: 'public',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      }
    ],
    // Configure static asset serving
    storage: {
      redis: {
        driver: 'redis',
        // Redis configuration if needed
      }
    },
    // Ensure proper MIME types
    routeRules: {
      '/_nuxt/**': { 
        headers: { 
          'Cache-Control': 'public, max-age=31536000, immutable' 
        } 
      }
    }
  },
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
    disableVuex: true,
    autoImports: ['defineStore', 'storeToRefs'],
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
  // Configure build for better production handling
  build: {
    transpile: ['@nuxt/ui']
  },
  // Add runtime config to handle SSR serialization
  runtimeConfig: {
    public: {
      API_HOST: process.env.NUXT_PUBLIC_API_HOST || 'http://rndpolije.lilly.net.id',
      WA_HOST: process.env.NUXT_PUBLIC_WA_HOST || 'http://rndpolije.lilly.net.id',
    },
    // Add private runtime config for SSR
    ssr: {
      // Disable problematic SSR features that cause serialization issues
      noExternal: ['pinia', '@pinia/nuxt']
    }
  },
  // Configure router for better SPA handling
  router: {
    options: {
      hashMode: false
    }
  },
});
