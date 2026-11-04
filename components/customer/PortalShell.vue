<script setup lang="ts">
// Shared header + bottom navigation for the customer portal pages.
// All spacing/colour comes from assets/css/portal.css so every page is
// visually identical and independent of Tailwind class scanning.

const props = defineProps<{
  title: string
  subtitle?: string
  customerName?: string
  /**
   * Page to return to when the back arrow is tapped.
   * When set, a back button is shown in the header (sub pages).
   */
  backTo?: string
}>()

const router = useRouter()
const route = useRoute()

// Offline indicator, provided by plugins/offline-status.client.ts
const { $isOffline } = useNuxtApp() as any

const items = [
  { label: 'Beranda', path: '/customer', icon: 'home' },
  { label: 'Tagihan', path: '/customer/bills', icon: 'credit-card' },
  { label: 'Keluhan', path: '/customer/tickets', icon: 'ticket' },
  { label: 'Layanan', path: '/customer/service', icon: 'package' },
]

function isActive(path: string) {
  return route.path === path
}

async function logout() {
  const authStore = useAuthStore()
  await authStore.logout()
  router.push('/customer/login')
}

function goBack() {
  if (props.backTo) {
    router.push(props.backTo)
    return
  }
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/customer')
  }
}
</script>

<template>
  <div class="portal-shell" style="font-family: 'Poppins', sans-serif;">
    <!-- Top bar: #111111 ink, mirrors the landing page -->
    <header class="portal-topbar">
      <div class="portal-topbar-inner">
        <button
          v-if="backTo"
          type="button"
          class="portal-topbar-icon-btn -ml-1.5"
          aria-label="Kembali"
          @click="goBack"
        >
          <LucideIcon name="arrow-left" :size="22" />
        </button>
        <div v-else class="portal-topbar-logo">
          <LucideIcon name="wifi" :size="18" />
        </div>

        <div class="portal-topbar-titles">
          <p class="portal-topbar-subtitle">{{ subtitle || 'Portal Pelanggan' }}</p>
          <h1 class="portal-topbar-title">{{ title }}</h1>
        </div>

        <button
          type="button"
          class="portal-topbar-icon-btn"
          title="Keluar"
          aria-label="Keluar"
          @click="logout"
        >
          <LucideIcon name="log-out" :size="18" />
        </button>
      </div>
    </header>

    <main class="portal-main">
      <!-- Offline banner -->
      <div v-if="$isOffline" class="portal-alert" style="margin-bottom: 1.25rem">
        <LucideIcon name="alert-triangle" :size="15" />
        <span>Anda sedang offline. Data mungkin tidak terbaru sampai koneksi kembali.</span>
      </div>

      <slot />
    </main>

    <!-- Bottom navigation -->
    <nav class="portal-bottomnav" style="padding-bottom: env(safe-area-inset-bottom);">
      <div class="portal-bottomnav-inner">
        <NuxtLink
          v-for="item in items"
          :key="item.path"
          :to="item.path"
          class="portal-navitem"
          :class="isActive(item.path) ? 'portal-navitem-active' : ''"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <LucideIcon :name="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>


