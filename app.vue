<script setup>
const route = useRoute()

import LoadingComponent from '@/components/LoadingComponent.vue'
import { useLoading } from '@/composables/useLoading'

const { isLoading } = useLoading()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <!-- <NuxtWelcome /> -->
    <!-- <NuxtUIProvider> -->
    <NuxtLayout>
      <NuxtLayout name="navbar" v-if="route.path !== '/login' && route.path !== '/customer' && !route.path.startsWith('/invoice')">
        <NuxtPage />
      </NuxtLayout>
      <NuxtPage v-if="route.path == '/login' || route.path == '/customer' || route.path.startsWith('/invoice')" />
    </NuxtLayout>
    <UModals />
    <div class="pointer-events-none">
      <UNotifications />
    </div>

    <!-- </NuxtUIProvider> -->
  </div>
</template>

<style>
/* Allow clicks to pass through the notifications container, but keep the toasts clickable */
[aria-live="assertive"],
[role="region"][aria-live="assertive"] {
  pointer-events: none;
}
[aria-live="assertive"] .pointer-events-auto,
[aria-live="assertive"] .ui-notification,
[aria-live="assertive"] .notification,
[aria-live="assertive"] .group {
  pointer-events: auto;
}
</style>
