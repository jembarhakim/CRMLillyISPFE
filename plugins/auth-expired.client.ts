export default defineNuxtPlugin((nuxtApp) => {
    // Prevent multiple concurrent logout flows and debounce repeated 401s
    let isHandling = false
    let lastHandledAt = 0

    const handleOnce = async () => {
        const now = Date.now()
        if (isHandling || now - lastHandledAt < 5000) return
        isHandling = true
        lastHandledAt = now

        try {
            const { useAuthStore } = await import('@/stores/auth')
            const auth = useAuthStore()
            auth.logout()
        } catch {}
        try {
            const { useNotificationStore } = await import('@/stores/notification')
            const notification = useNotificationStore()
            notification.error('Invalid Token', 'You have been logged out. Please sign in again.', 4000)
        } catch {}
        try {
            if (process.client && !location.pathname.startsWith('/login')) {
                await navigateTo('/login')
            }
        } catch {}

        setTimeout(() => { isHandling = false }, 2000)
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
