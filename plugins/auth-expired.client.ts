export default defineNuxtPlugin((nuxtApp) => {
    // Prevent multiple concurrent logout flows and debounce repeated 401s
    let isHandling = false
    let lastHandledAt = 0
    let hasShownNotification = false
    let hasValidToken = false
    let isInitialLoad = true
    let initialLoadTimeout: NodeJS.Timeout | null = null

    // Check if user has a valid token on app start
    const checkInitialToken = () => {
        if (process.client) {
            const token = useCookie('token').value
            // More thorough token validation
            hasValidToken = !!(token && 
                token !== '' && 
                token !== 'null' && 
                token !== 'undefined' && 
                token.length > 10)
        }
    }

    const handleOnce = async () => {
        const now = Date.now()
        
        // Enhanced debouncing logic:
        // 1. Prevent multiple calls within 5 seconds (reduced from 10)
        // 2. Prevent if already handling
        // 3. Prevent if notification already shown
        // 4. During initial load (first 3 seconds), be more aggressive about preventing duplicates
        const isInitialLoadPeriod = isInitialLoad && now - lastHandledAt < 3000
        
        if (isHandling || 
            now - lastHandledAt < 5000 || 
            hasShownNotification || 
            isInitialLoadPeriod) {
            console.log('Auth error handling skipped - debounced or already handled')
            return
        }
        
        isHandling = true
        lastHandledAt = now

        try {
            const { useAuthStore } = await import('@/stores/auth')
            const auth = useAuthStore()
            
            // Only logout if user was actually logged in
            if (auth.isLoggedIn) {
                console.log('Logging out user due to 401 error')
                auth.logout()
            }
        } catch (error) {
            console.error('Error during logout:', error)
        }
        
        try {
            // Only show notification if:
            // 1. Not already on login page
            // 2. Not shown before
            // 3. User had a valid token (was actually logged in)
            // 4. Not during initial load period
            if (process.client && 
                !location.pathname.startsWith('/login') && 
                !hasShownNotification && 
                hasValidToken && 
                !isInitialLoad) {
                
                const { useNotificationStore } = await import('@/stores/notification')
                const notification = useNotificationStore()
                notification.error('Token Expired', 'Your session has expired. Please sign in again.', 4000)
                hasShownNotification = true // Mark as shown to prevent duplicates
                console.log('Token expired notification shown')
            }
        } catch (error) {
            console.error('Error showing notification:', error)
        }
        
        try {
            // Only redirect to login if user was actually logged in and not during initial load
            if (process.client && 
                !location.pathname.startsWith('/login') && 
                hasValidToken && 
                !isInitialLoad) {
                console.log('Redirecting to login due to 401 error')
                await navigateTo('/login')
            }
        } catch (error) {
            console.error('Error redirecting to login:', error)
        }

        setTimeout(() => { isHandling = false }, 2000)
    }

    // Reset notification flag when user logs in successfully
    const resetNotificationFlag = () => {
        hasShownNotification = false
        hasValidToken = true // User is now logged in with valid token
        isInitialLoad = false // Exit initial load period
    }

    // End initial load period after 3 seconds
    const endInitialLoadPeriod = () => {
        if (initialLoadTimeout) {
            clearTimeout(initialLoadTimeout)
        }
        initialLoadTimeout = setTimeout(() => {
            isInitialLoad = false
            console.log('Initial load period ended')
        }, 3000)
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
            } else {
                // If user is not logged in, ensure token flag is false
                hasValidToken = false
            }
            // End initial load period
            endInitialLoadPeriod()
        })
    }

    // Wrap $fetch to capture 401
    const wrapped = $fetch.create({
        onResponseError: async (ctx) => {
            const status = ctx.response?.status
            if (status === 401 && process.client) {
                console.log('401 error detected via $fetch interceptor')
                await handleOnce()
            }
        }
    })

    nuxtApp.$fetch = wrapped as any

    // Patch native fetch (used by some libs) - but only if not already patched
    if (process.client && !(window.fetch as any)._authPatched) {
        const originalFetch = window.fetch
        window.fetch = async (...args) => {
            const response = await originalFetch(...args)
            if (response?.status === 401 && process.client) {
                console.log('401 error detected via native fetch interceptor')
                await handleOnce()
            }
            return response
        }
        // Mark as patched to prevent double patching
        ;(window.fetch as any)._authPatched = true
    }

    // Initialize token check on app start
    if (process.client) {
        checkInitialToken()
        // Start the initial load period timer
        endInitialLoadPeriod()
    }
})
