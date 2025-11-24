<script setup>
const route = useRoute()

import LoadingComponent from '@/components/LoadingComponent.vue'
import NotificationModal from '@/components/NotificationModal.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import { useLoading } from '@/composables/useLoading'
import { useNotification } from '@/composables/useNotification'
import { useCustomToast } from '@/composables/useCustomToast'

const { isLoading } = useLoading()
const { isVisible, currentTitle, currentMessage, currentType, currentDuration, close } = useNotification()
// const { toasts, removeToast } = useCustomToast() // No longer needed as UNotifications handles it
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <!-- <NuxtWelcome /> -->
    <!-- <NuxtUIProvider> -->
    <NuxtLayout>
      <NuxtLayout name="navbar" v-if="route.path !== '/login' && route.path !== '/employee' && route.path !== '/customer' && route.path !== '/landing' && !route.path.startsWith('/invoice')">
        <NuxtPage />
      </NuxtLayout>
      <NuxtPage v-if="route.path == '/login' || route.path == '/employee' || route.path == '/customer' || route.path == '/landing' || route.path.startsWith('/invoice')" />
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

    <!-- Custom Toast Notifications (Handled by UNotifications) -->
    <!-- <div class="fixed top-0 right-0 p-4 pointer-events-none z-40">
      <TransitionGroup name="toast" tag="div">
        <ToastNotification
          v-for="toast in toasts"
          :key="toast.id"
          :title="toast.title"
          :description="toast.description"
          :type="toast.type"
          :duration="toast.duration"
          is-visible
          @close="removeToast(toast.id)"
        />
      </TransitionGroup>
    </div> -->

    <!-- </NuxtUIProvider> -->
  </div>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

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
