/**
 * Stale customer session guard.
 *
 * Background: the browser keeps the `token` cookie for 7 days. If someone was
 * logged into the customer portal and later signs in as staff (or vice versa),
 * an old CUSTOMER token can still be attached to /api/admin/* requests. The
 * backend correctly rejects it with 403 "Customer token cannot access this
 * resource", but the generic auth interceptor only listens for 401 — so the
 * user stayed on the dashboard staring at errors.
 *
 * This plugin detects that specific 403, wipes the stale session and sends the
 * user to the staff login so they can authenticate again with the right role.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!process.client) return

  const STALE_MARKER = 'Customer token cannot access this resource'
  let isRecovering = false

  const isStaleCustomerToken = async (response: Response): Promise<boolean> => {
    if (response.status !== 403) return false
    try {
      // Clone so the caller can still read the body.
      const body = await response.clone().json()
      const message = String(body?.message || '')
      return message.includes(STALE_MARKER)
    } catch {
      return false
    }
  }

  const recover = async () => {
    if (isRecovering) return
    // Already on the staff login page: nothing to recover.
    if (location.pathname.startsWith('/employee')) return

    isRecovering = true
    try {
      const authStore = useAuthStore()
      authStore.logout()

      // Staff pages go back to the staff login; the portal to its own login.
      const target = location.pathname.startsWith('/customer')
        ? '/customer/login'
        : '/employee'

      console.warn('[auth] stale customer token detected, redirecting to', target)

      const { useNotificationStore } = await import('@/stores/notification')
      useNotificationStore().error(
        'Sesi tidak sesuai',
        target === '/customer/login'
          ? 'Sesi pelanggan tidak valid untuk data ini. Silakan login ulang.'
          : 'Sesi lama masih tersimpan. Silakan login ulang sebagai staf.',
        5000
      )

      await navigateTo(target)
    } catch (error) {
      console.error('[auth] failed to recover from stale token:', error)
    } finally {
      // Allow future recoveries once navigation settles.
      setTimeout(() => { isRecovering = false }, 3000)
    }
  }

  // --- $fetch (Nuxt ofetch) -------------------------------------------------
  const originalFetch = nuxtApp.$fetch
  nuxtApp.$fetch = ((...args: any[]) => {
    return (originalFetch as any)(...args).catch((error: any) => {
      const message = String(error?.data?.message || error?.message || '')
      if (message.includes(STALE_MARKER)) {
        void recover()
      }
      throw error
    })
  }) as any

  // --- native fetch (used by all api/*.ts modules) --------------------------
  const nativeFetch = window.fetch
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await nativeFetch(...args)
    if (await isStaleCustomerToken(response)) {
      void recover()
    }
    return response
  }
})
