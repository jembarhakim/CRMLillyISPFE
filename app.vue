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
      <NuxtLayout name="navbar" v-if="route.path !== '/login' && route.path !== '/customer' && !route.path.startsWith('/invoice')">
        <NuxtPage />
      </NuxtLayout>
      <NuxtPage v-if="route.path == '/login' || route.path == '/customer' || route.path.startsWith('/invoice')" />
    </NuxtLayout>
    <UModals />
    <UNotifications />
    
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