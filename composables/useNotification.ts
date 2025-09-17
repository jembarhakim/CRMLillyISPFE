import { useNotificationStore } from '@/stores/notification'

export function useNotification() {
  const store = useNotificationStore()

  return {
    // Store state
    isVisible: computed(() => store.isVisible),
    currentTitle: computed(() => store.currentTitle),
    currentMessage: computed(() => store.currentMessage),
    currentType: computed(() => store.currentType),
    currentDuration: computed(() => store.currentDuration),
    
    // Store actions
    success: store.success,
    error: store.error,
    info: store.info,
    warning: store.warning,
    close: store.closeCurrent,
    clearAll: store.clearAll,
    
    // Direct access to store for advanced usage
    store
  }
}
