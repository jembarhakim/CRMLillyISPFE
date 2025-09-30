export type CreateInvoiceRequest = {
    customer_id: string,
    amount: number,
    invoice_items: Array<{name: string, qty: number, price: number,total: number}>,
    status?: 'paid' | 'unpaid' | 'pending',
    pending_reason?: string
  }

  export type UpdateStatusInvoiceRequest = {
    status: string
  }