import { useApiHost } from '@/composables/useApiHost'

export interface NewsArticlePayload {
  title: string
  summary: string
  content: string
  is_published: boolean
}

export const newsAdminApi = () => {
  const api = useApiHost()
  const headers = () => ({
    Authorization: `Bearer ${useCookie('token').value}`,
  })

  const parseResponse = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'News request failed.')
    }

    return response.json()
  }

  return {
    getAll: async () => parseResponse(await fetch(`${api}/api/admin/news`, {
      method: 'GET',
      cache: 'no-store',
      headers: headers(),
    })),
    getById: async (id: string) => parseResponse(await fetch(`${api}/api/admin/news/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
      headers: headers(),
    })),
    create: async (data: FormData) => parseResponse(await fetch(`${api}/api/admin/news`, {
      method: 'POST',
      headers: headers(),
      body: data,
    })),
    update: async (id: string, data: FormData) => parseResponse(await fetch(`${api}/api/admin/news/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: headers(),
      body: data,
    })),
    delete: async (id: string) => parseResponse(await fetch(`${api}/api/admin/news/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: headers(),
    })),
  }
}
