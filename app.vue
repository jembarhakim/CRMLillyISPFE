<script setup>
const route = useRoute()

import LoadingComponent from '@/components/LoadingComponent.vue'
import NotificationModal from '@/components/NotificationModal.vue'
import { useLoading } from '@/composables/useLoading'
import { useNotification } from '@/composables/useNotification'

const { isLoading } = useLoading()
const { isVisible, currentTitle, currentMessage, currentType, currentDuration, close } = useNotification()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <!-- <NuxtWelcome /> -->
    <!-- <NuxtUIProvider> -->
    <NuxtLayout>
      <NuxtLayout name="navbar" v-if="route.path !== '/login' && route.path !== '/customer' && route.path !== '/landing' && !route.path.startsWith('/invoice')">
        <NuxtPage />
      </NuxtLayout>
      <NuxtPage v-if="route.path == '/login' || route.path == '/customer' || route.path == '/landing' || route.path.startsWith('/invoice')" />
    </NuxtLayout>
    <!-- Wrap UI components in ClientOnly to prevent Icon SSR recursion -->
    <ClientOnly>
      <UModals />
      <UNotifications />
    </ClientOnly>
    
    <!-- Custom Notification Modal -->
    <NotificationModal
      :is-visible="isVisible"
      :title="currentTitle"
      :message="currentMessage"
      :type="currentType"
      :duration="currentDuration"
      @close="close"
    />

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
