// Customer service page API: active package summary, available plans and
// upgrade / downgrade / relocation requests queued for CRM approval.
export interface ServiceSummary {
  product_id: string
  product_name: string
  description: string
  price: number
  download_speed_mbps: number
  upload_speed_mbps: number
  active_since?: string
  billing_cycle_day?: number
  next_invoice_date?: string
  days_remaining: number
  is_active: boolean
  customer_name?: string
  customer_address?: string
}

export interface AvailablePlan {
  id: string
  name: string
  description: string
  price: number
  download_speed_mbps: number
  upload_speed_mbps: number
  direction: 'upgrade' | 'downgrade' | 'same'
}

export interface ServiceRequestItem {
  id: string
  request_type: 'upgrade' | 'downgrade' | 'relocation'
  type_label: string
  status: 'pending' | 'approved' | 'rejected'
  status_label: string
  current_product_id: string
  current_product_name: string
  requested_product_id: string
  requested_product_name: string
  new_address?: string
  new_area_id?: string
  note?: string
  attachment_url?: string
  review_note?: string
  reviewed_at?: string
  created_at: string
  updated_at?: string
}

export interface ServicePageData {
  summary: ServiceSummary
  available_plans: AvailablePlan[]
  requests: ServiceRequestItem[]
}

export interface CreateServiceRequestPayload {
  request_type: 'upgrade' | 'downgrade' | 'relocation'
  requested_product_id?: string
  new_address?: string
  new_area_id?: string
  new_latitude?: number
  new_longitude?: number
  note?: string
  attachment_url?: string
}

export const serviceCustomerApi = () => {
  const api = useApiHost()
  const authStore = useAuthStore()

  const authHeaders = () => {
    const token = authStore.getToken
    if (!token || token === '' || token === 'null' || token === 'undefined') {
      throw new Error('No valid authentication token available')
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }

  const handle = async (response: Response) => {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || 'Terjadi kesalahan pada server')
    }
    return data
  }

  return {
    getPage: async (): Promise<{ success: boolean; data: ServicePageData }> => {
      const response = await fetch(`${api}/api/customer/service-requests`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },

    createRequest: async (payload: CreateServiceRequestPayload) => {
      const response = await fetch(`${api}/api/customer/service-requests`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      return handle(response)
    },

    getHistory: async (): Promise<{ success: boolean; data: ServiceRequestItem[] }> => {
      const response = await fetch(`${api}/api/customer/service-requests/history`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },
  }
}
