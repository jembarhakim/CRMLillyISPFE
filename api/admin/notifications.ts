import { useApiHost } from '@/composables/useApiHost'
import { useCookie } from '#app'

export interface NotificationTemplate {
  key: string
  name: string
  category: string
  body: string
  enabled: boolean
}

export interface QueuedNotification {
  id: string
  recipient: string
  template_key: string
  message: string
  status: string
  attempts: number
  max_attempts: number
  next_attempt_at: string
  gateway_message_id?: string
  last_error?: string
  created_at: string
  sent_at?: string
}

export interface NotificationPreference {
  customer_id: string
  customer_name: string
  phone: string
  invoice_reminders_enabled: boolean
}

interface APIResponse<T> {
  success: boolean
  message: string
  data: T
}

export const notificationsAdminApi = () => {
  const api = useApiHost()
  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${useCookie('token').value}`,
  })

  const request = async <T>(path: string, init: RequestInit = {}): Promise<APIResponse<T>> => {
    const response = await fetch(`${api}/api/admin/notifications${path}`, {
      ...init,
      headers: { ...headers(), ...init.headers },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || `Notification request failed (HTTP ${response.status})`)
    }
    return payload
  }

  return {
    getSummary: () => request<{ counts: Record<string, number>; gateway: string; rate_limit_per_minute: number; max_retries: number }>('/summary'),
    getTemplates: () => request<NotificationTemplate[]>('/templates'),
    saveTemplate: (template: NotificationTemplate, updating: boolean) => request<NotificationTemplate>(
      updating ? `/templates/${encodeURIComponent(template.key)}` : '/templates',
      { method: updating ? 'PUT' : 'POST', body: JSON.stringify(template) },
    ),
    deleteTemplate: (key: string) => request<null>(`/templates/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    preview: (body: string, variables: Record<string, unknown>) => request<{ message: string }>('/templates/preview', {
      method: 'POST',
      body: JSON.stringify({ body, variables }),
    }),
    getQueue: (status = '') => request<QueuedNotification[]>(`/queue?limit=100${status ? `&status=${encodeURIComponent(status)}` : ''}`),
    getLogs: () => request<Array<{ id: string; notification_id: string; status: string; attempt: number; details: string; created_at: string }>>('/logs?limit=200'),
    enqueue: (to: string, templateKey: string, variables: Record<string, unknown>) => request<null>('/queue', {
      method: 'POST',
      body: JSON.stringify({ to, template_key: templateKey, variables }),
    }),
    getPreferences: (search = '') => request<NotificationPreference[]>(`/preferences?search=${encodeURIComponent(search)}`),
    setPreference: (preference: NotificationPreference) => request<NotificationPreference>(`/preferences/${encodeURIComponent(preference.customer_id)}`, {
      method: 'PUT',
      body: JSON.stringify(preference),
    }),
  }
}
