// Customer complaint portal API: create tickets, upload evidence, track status.
export interface CustomerTicket {
  id: number
  ticket_number: string
  title: string
  description?: string
  trouble_type_name: string
  status: string
  stage: 'received' | 'scheduled' | 'handling' | 'done'
  stage_label: string
  stage_step: number
  image_url?: string
  technician_note?: string
  created_at: string
  updated_at?: string
}

export interface CustomerTicketTimelineEntry {
  stage: string
  stage_label: string
  reached: boolean
  at?: string
  note?: string
}

export interface CustomerTicketDetail extends CustomerTicket {
  timeline: CustomerTicketTimelineEntry[]
}

export interface TroubleTypeOption {
  id: string
  name?: string
}

export interface CreateCustomerTicketPayload {
  title: string
  description: string
  trouble_type_id?: string
  image_filename?: string
}

export const ticketsCustomerApi = () => {
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
    getTickets: async (): Promise<{ success: boolean; data: CustomerTicket[] }> => {
      const response = await fetch(`${api}/api/customer/tickets`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },

    getTicket: async (id: number | string): Promise<{ success: boolean; data: CustomerTicketDetail }> => {
      const response = await fetch(`${api}/api/customer/tickets/${id}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },

    getTroubleTypes: async (): Promise<{ success: boolean; data: TroubleTypeOption[] }> => {
      const response = await fetch(`${api}/api/customer/tickets/trouble-types`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },

    createTicket: async (payload: CreateCustomerTicketPayload) => {
      const response = await fetch(`${api}/api/customer/tickets`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      return handle(response)
    },

    uploadAttachment: async (file: File): Promise<{ success: boolean; data: { filename: string; url: string } }> => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${api}/api/customer/tickets/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.getToken}`,
        },
        body: formData,
      })
      return handle(response)
    },
  }
}
