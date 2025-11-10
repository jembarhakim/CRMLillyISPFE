// Augment vue-tsc to recognize Nuxt auto-imported composables used widely in the project
// This avoids adding imports in every file for type-checking only.

declare global {
  // Core Vue 3 composables (auto-imported by Nuxt)
  const ref: typeof import('vue')['ref']
  const reactive: typeof import('vue')['reactive']
  const computed: typeof import('vue')['computed']
  const watch: typeof import('vue')['watch']
  const watchEffect: typeof import('vue')['watchEffect']
  const readonly: typeof import('vue')['readonly']
  const unref: typeof import('vue')['unref']
  const toRef: typeof import('vue')['toRef']
  const toRefs: typeof import('vue')['toRefs']
  const isRef: typeof import('vue')['isRef']
  const onMounted: typeof import('vue')['onMounted']
  const onUnmounted: typeof import('vue')['onUnmounted']
  const onBeforeMount: typeof import('vue')['onBeforeMount']
  const onBeforeUnmount: typeof import('vue')['onBeforeUnmount']
  const onUpdated: typeof import('vue')['onUpdated']
  const onBeforeUpdate: typeof import('vue')['onBeforeUpdate']
  const nextTick: typeof import('vue')['nextTick']
  const defineProps: typeof import('vue')['defineProps']
  const defineEmits: typeof import('vue')['defineEmits']
  const defineExpose: typeof import('vue')['defineExpose']
  const withDefaults: typeof import('vue')['withDefaults']
  const provide: typeof import('vue')['provide']
  const inject: typeof import('vue')['inject']
  const useSlots: typeof import('vue')['useSlots']
  const useAttrs: typeof import('vue')['useAttrs']

  // Nuxt UI composables
  const useToast: typeof import('#imports')['useToast']
  const useModal: typeof import('#imports')['useModal']

  // Nuxt helpers
  const definePageMeta: typeof import('#imports')['definePageMeta']
  const navigateTo: typeof import('#app')['navigateTo']
  const useHead: typeof import('#app')['useHead']
  const useRoute: typeof import('vue-router')['useRoute']
  const useRouter: typeof import('vue-router')['useRouter']

  // Our composables
  const useApiHost: typeof import('@/composables/useApiHost')['useApiHost']
  const useWaHost: typeof import('@/composables/useApiHost')['useWaHost']

  // Pinia store accessor
  const useAuthStore: typeof import('@/stores/auth')['useAuthStore']
  const defineStore: typeof import('pinia')['defineStore']
  const storeToRefs: typeof import('pinia')['storeToRefs']

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


