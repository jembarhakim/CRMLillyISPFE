import { defineStore } from 'pinia'

export interface NotificationData {
  id: string
  title: string
  message?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as NotificationData[],
    currentNotification: null as NotificationData | null,
    isVisible: false
  }),

  getters: {
    hasNotifications: (state) => state.notifications.length > 0,
    currentTitle: (state) => state.currentNotification?.title || '',
    currentMessage: (state) => state.currentNotification?.message || '',
    currentType: (state) => state.currentNotification?.type || 'info',
    currentDuration: (state) => state.currentNotification?.duration || 2000
  },

  actions: {
    // Add notification to queue
    addNotification(notification: Omit<NotificationData, 'id'>) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const newNotification: NotificationData = {
        id,
        duration: 2000,
        ...notification
      }
      
      this.notifications.push(newNotification)
      
      // If no notification is currently showing, show this one
      if (!this.isVisible) {
        this.showNext()
      }
    },

    // Show next notification in queue
    showNext() {
      if (this.notifications.length === 0) {
        this.isVisible = false
        this.currentNotification = null
        return
      }

      this.currentNotification = this.notifications.shift()!
      this.isVisible = true
    },

    // Close current notification
    closeCurrent() {
      this.isVisible = false
      this.currentNotification = null
      
      // Show next notification after a short delay
      setTimeout(() => {
        this.showNext()
      }, 300)
    },

    // Clear all notifications
    clearAll() {
      this.notifications = []
      this.isVisible = false
      this.currentNotification = null
    },

    // Convenience methods for different notification types
    success(title: string, message?: string, duration?: number) {
      this.addNotification({
        title,
        message,
        type: 'success',
        duration
      })
    },

    error(title: string, message?: string, duration?: number) {
      this.addNotification({
        title,
        message,
        type: 'error',
        duration: duration || 5000 // Error notifications stay longer by default
      })
    },

    info(title: string, message?: string, duration?: number) {
      this.addNotification({
        title,
        message,
        type: 'info',
        duration
      })
    },

    warning(title: string, message?: string, duration?: number) {
      this.addNotification({
        title,
        message,
        type: 'warning',
        duration
      })
    }
  }
})
