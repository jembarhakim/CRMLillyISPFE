export default defineNuxtPlugin((nuxtApp) => {
    // Prevent multiple concurrent logout flows and debounce repeated 401s
    let isHandling = false
    let lastHandledAt = 0
    let hasShownNotification = false

    const handleOnce = async () => {
        const now = Date.now()
        // Prevent multiple calls within 10 seconds OR if notification already shown
        if (isHandling || now - lastHandledAt < 10000 || hasShownNotification) return
        isHandling = true
        lastHandledAt = now

        try {
            const { useAuthStore } = await import('@/stores/auth')
            const auth = useAuthStore()
            auth.logout()
        } catch {}
        try {
            // Only show notification if not already on login page AND not shown before
            if (process.client && !location.pathname.startsWith('/login') && !hasShownNotification) {
                const { useNotificationStore } = await import('@/stores/notification')
                const notification = useNotificationStore()
                notification.error('Invalid Token', 'You have been logged out. Please sign in again.', 4000)
                hasShownNotification = true // Mark as shown to prevent duplicates
            }
        } catch {}
        try {
            if (process.client && !location.pathname.startsWith('/login')) {
                await navigateTo('/login')
            }
        } catch {}

        setTimeout(() => { isHandling = false }, 2000)
    }

    // Reset notification flag when user logs in successfully
    const resetNotificationFlag = () => {
        hasShownNotification = false
    }

    // Listen for successful login events to reset the notification flag
    if (process.client) {
        // Reset when navigating to dashboard (successful login)
        const originalPushState = history.pushState
        history.pushState = function(...args) {
            const url = args[2]
            if (url && typeof url === 'string' && url.includes('/dashboard')) {
                resetNotificationFlag()
            }
            return originalPushState.apply(history, args)
        }

        // Also reset on successful login via store
        nuxtApp.hook('app:mounted', () => {
            const authStore = useAuthStore()
            if (authStore.isLoggedIn) {
                resetNotificationFlag()
            }
        })
    }

    // Wrap $fetch to capture 401
    const wrapped = $fetch.create({
        onResponseError: async (ctx) => {
            const status = ctx.response?.status
            if (status === 401 && process.client) {
                await handleOnce()
            }
        }
    })

    nuxtApp.$fetch = wrapped as any

    // Patch native fetch (used by some libs)
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
        const response = await originalFetch(...args)
        if (response?.status === 401 && process.client) {
            await handleOnce()
        }
        return response
    }
})
