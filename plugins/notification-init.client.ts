export default defineNuxtPlugin(async () => {
  // Initialize notification store
  const { useNotificationStore } = await import('@/stores/notification')
  const notificationStore = useNotificationStore()
  
  // Make notification store available globally
  return {
    provide: {
      notification: notificationStore
    }
  }
})
