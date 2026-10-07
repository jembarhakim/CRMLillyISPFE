import { useApiHost } from '@/composables/useApiHost'

export const publicNewsApi = () => {
  const api = useApiHost()

  const parseResponse = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to load news.')
    }

    return response.json()
  }

  return {
    getPublished: async (page = 1, limit = 3) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      const response = await fetch(`${api}/api/news?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })

      return parseResponse(response)
    },
    getPublishedById: async (id: string) => {
      const response = await fetch(`${api}/api/news/${encodeURIComponent(id)}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })

      return parseResponse(response)
    },
  }
}
