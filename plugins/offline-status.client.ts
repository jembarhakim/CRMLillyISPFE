// Shows a small banner whenever the customer is offline so users on flaky
// mobile connections understand why data stopped refreshing.
export default defineNuxtPlugin(() => {
  if (!process.client) return

  const isOffline = ref(typeof navigator !== 'undefined' ? !navigator.onLine : false)

  window.addEventListener('offline', () => {
    isOffline.value = true
  })
  window.addEventListener('online', () => {
    isOffline.value = false
  })

  return {
    provide: {
      isOffline,
    },
  }
})
