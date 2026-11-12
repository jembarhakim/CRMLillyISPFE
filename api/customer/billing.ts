// Customer billing API: monthly bills, Midtrans Snap payment and invoice PDF data.
export interface CustomerBill {
  invoice_id: string
  invoice_number: string
  month: string
  month_sort: string
  amount: number
  status: 'paid' | 'pending' | 'unpaid'
  status_label: string
  invoice_date: string
  due_date: string
  is_payable: boolean
  redirect_url: string
  pdf_viewed: boolean
}

export interface CustomerSnapToken {
  invoice_id: string
  token: string
  redirect_url: string
  amount: number
  expires_in: number
}

export type VABank = 'bca' | 'bni' | 'bri'

export interface CustomerVA {
  invoice_id: string
  order_id: string
  bank: VABank
  va_number: string
  amount: number
  expiry_time: string
  status: string
}

export const billingCustomerApi = () => {
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
    getBills: async (): Promise<{ success: boolean; data: CustomerBill[] }> => {
      const response = await fetch(`${api}/api/customer/dashboard/bills`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },

    createSnapToken: async (invoiceId: string): Promise<{ success: boolean; data: CustomerSnapToken; message: string }> => {
      const response = await fetch(`${api}/api/customer/dashboard/payment/snap`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ invoice_id: invoiceId }),
      })
      return handle(response)
    },

    createVA: async (invoiceId: string, bank: VABank): Promise<{ success: boolean; data: CustomerVA; message: string }> => {
      const response = await fetch(`${api}/api/payments/va`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ invoiceId, bank }),
      })
      return handle(response)
    },

    checkVAStatus: async (orderId: string): Promise<{ success: boolean; data: { transaction_status: string }; message: string }> => {
      const response = await fetch(`${api}/api/payments/va/${encodeURIComponent(orderId)}/status`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },

    getInvoice: async (invoiceId: string) => {
      const response = await fetch(`${api}/api/customer/dashboard/invoice/${invoiceId}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },
  }
}
