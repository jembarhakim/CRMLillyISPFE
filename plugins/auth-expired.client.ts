export default defineNuxtPlugin((nuxtApp) => {
	// Create a wrapped $fetch with a global 401 handler
	const wrapped = $fetch.create({
		onResponseError: async (ctx) => {
			const status = ctx.response?.status
			if (status === 401 && process.client) {
				try {
					const { useAuthStore } = await import('@/stores/auth')
					const auth = useAuthStore()
					auth.logout()
				} catch {}
				try {
					const toast = useToast()
					toast.add({
						title: 'Session expired',
						description: 'Your session has expired. Please log in again.',
						color: 'amber'
					})
				} catch {}
				try { navigateTo('/login') } catch {}
			}
		}
	})

	// Replace Nuxt's $fetch with the wrapped version
	nuxtApp.$fetch = wrapped as any
})
