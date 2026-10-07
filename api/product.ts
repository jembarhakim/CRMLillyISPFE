import { useApiHost } from '@/composables/useApiHost'

export const productApi = () => {
  const api = useApiHost()

  return {
    getAll: async () => {
      const response = await fetch(`${api}/api/product`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to load internet packages.')
      }

      return response.json()
    },
  }
}
