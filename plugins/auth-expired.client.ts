export default defineNuxtPlugin((nuxtApp) => {
	// Create a wrapped $fetch with a global 401 handler
	const wrapped = $fetch.create({
		onResponseError: async (ctx) => {
			const status = ctx.response?.status
			if (status === 401 && process.client) {
				await window.handleTokenExpiration()
			}
		}
	})

	// Replace Nuxt's $fetch with the wrapped version
	nuxtApp.$fetch = wrapped as any

	// Global function to handle token expiration
	window.handleTokenExpiration = async () => {
		// Show confirmation modal before logout
		await window.showLogoutConfirmation()
	}

	// Function to show logout confirmation modal
	window.showLogoutConfirmation = async () => {
		// Create modal element
		const modal = document.createElement('div')
		modal.id = 'token-expired-modal'
		modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
		modal.innerHTML = `
			<div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
				<div class="flex items-center mb-4">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-lg font-medium text-gray-900">Session Expired</h3>
					</div>
				</div>
				<div class="mb-6">
					<p class="text-sm text-gray-600">
						Your session has expired due to inactivity. You will be logged out for security reasons.
					</p>
				</div>
				<div class="flex justify-end">
					<button 
						id="confirm-logout-btn"
						class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
					>
						OKE
					</button>
				</div>
			</div>
		`

		// Add modal to body
		document.body.appendChild(modal)

		// Add event listener to button
		const confirmBtn = document.getElementById('confirm-logout-btn')
		confirmBtn?.addEventListener('click', async () => {
			// Remove modal
			document.body.removeChild(modal)
			
			// Perform logout
			try {
				const { useAuthStore } = await import('@/stores/auth')
				const auth = useAuthStore()
				auth.logout()
			} catch {}
			try {
				const { useNotificationStore } = await import('@/stores/notification')
				const notification = useNotificationStore()
				notification.success('Logged out', 'You have been logged out successfully.', 3000)
			} catch {}
			try { 
				await navigateTo('/login') 
			} catch {}
		})

		// Auto logout after 30 seconds if user doesn't click
		setTimeout(async () => {
			if (document.getElementById('token-expired-modal')) {
				document.body.removeChild(modal)
				
				// Perform logout
				try {
					const { useAuthStore } = await import('@/stores/auth')
					const auth = useAuthStore()
					auth.logout()
				} catch {}
				try {
					const { useNotificationStore } = await import('@/stores/notification')
					const notification = useNotificationStore()
					notification.warning('Auto logged out', 'You have been automatically logged out.', 4000)
				} catch {}
				try { 
					await navigateTo('/login') 
				} catch {}
			}
		}, 30000) // 30 seconds timeout
	}

	// Override global fetch to handle 401 responses
	const originalFetch = window.fetch
	window.fetch = async (...args) => {
		try {
			const response = await originalFetch(...args)
			// Check if response is 401 (Unauthorized)
			if (response.status === 401 && process.client) {
				await window.handleTokenExpiration()
			}
			return response
		} catch (error) {
			// Surface network errors while keeping behavior the same
			throw error
		}
	}
})

// Helper function to handle token expiration
async function handleTokenExpiration() {
	try {
		const { useAuthStore } = await import('@/stores/auth')
		const auth = useAuthStore()
		auth.logout()
	} catch {}
	try {
		const { useNotificationStore } = await import('@/stores/notification')
		const notification = useNotificationStore()
		notification.warning('Session expired', 'Please log in again.', 5000)
	} catch {}
	try { 
		await navigateTo('/login') 
	} catch {}
}
