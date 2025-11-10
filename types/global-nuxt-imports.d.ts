// Augment vue-tsc to recognize Nuxt auto-imported composables used widely in the project
// This avoids adding imports in every file for type-checking only.

declare global {
  // Nuxt UI composables
  const useToast: typeof import('#imports')['useToast']
  const useModal: typeof import('#imports')['useModal']

  // Nuxt helpers
  const definePageMeta: typeof import('#imports')['definePageMeta']
  const navigateTo: typeof import('#app')['navigateTo']
  const useHead: typeof import('#app')['useHead']
  const useRoute: typeof import('vue-router')['useRoute']

  // Our composables
  const useApiHost: typeof import('@/composables/useApiHost')['useApiHost']
  const useWaHost: typeof import('@/composables/useApiHost')['useWaHost']

  // Pinia store accessor
  const useAuthStore: typeof import('@/stores/auth')['useAuthStore']

  // Custom auth composable
  const useAuth: typeof import('@/composables/useAuth')['useAuth']
}

// Vue component type augmentation for template type checking
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    navigateTo: typeof import('#imports')['navigateTo']
  }
}

export {}


