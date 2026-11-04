// B2B Incidental Project API client (Sprint 6)
// Covers: master project, versioned quotation, milestone invoicing,
// margin tracker (expense), work order and BAST.

export type B2BProjectStatus =
  | 'penawaran' | 'deal' | 'pengerjaan' | 'serah_terima' | 'pelunasan' | 'batal'

export interface B2BProject {
  id: string
  code: string
  title: string
  status: B2BProjectStatus
  client_company_id: string
  customer_id: string
  client_name: string
  pic_name: string
  pic_phone: string
  pic_email: string
  contract_value: number
  start_date?: string | null
  target_end_date?: string | null
  location: string
  notes: string
  created_by: string
  created_at: string
  updated_at: string
  company?: { id: string; name: string; address?: string; phone?: string; email?: string }
}

export interface B2BStatusLog {
  id: string
  project_id: string
  from_status: string
  to_status: string
  note: string
  changed_by: string
  created_at: string
}

export interface B2BQuotationItem {
  id: string
  quotation_id: string
  category: 'perangkat' | 'kabel' | 'jasa' | 'lainnya'
  name: string
  unit: string
  qty: number
  unit_price: number
  subtotal: number
  note: string
  sort_order: number
}

export interface B2BQuotation {
  id: string
  project_id: string
  version: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'superseded'
  subject: string
  notes: string
  terms: string
  subtotal: number
  tax_percent: number
  tax_amount: number
  grand_total: number
  valid_until?: string | null
  created_by: string
  created_at: string
  updated_at: string
  items?: B2BQuotationItem[]
}

export interface B2BMilestone {
  id: string
  project_id: string
  name: string
  percentage: number
  amount: number
  due_date?: string | null
  status: 'pending' | 'invoiced' | 'paid'
  invoice_number: string
  crm_invoice_id: string
  invoiced_at?: string | null
  paid_at?: string | null
  sort_order: number
}

export interface B2BExpense {
  id: string
  project_id: string
  category: 'material' | 'transport' | 'upah' | 'lainnya'
  description: string
  amount: number
  expense_date?: string | null
  account_id: string
  transaction_id: string
  receipt_url: string
  created_by: string
  created_at: string
}

export interface B2BWorkOrder {
  id: string
  project_id: string
  number: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date?: string | null
  completed_date?: string | null
  assigned_to: string
  assignee_name: string
  created_at: string
}

export interface B2BBast {
  id: string
  project_id: string
  work_order_id: string
  number: string
  items_snapshot: string
  signed_by_client: string
  signed_by_vendor: string
  signed_date?: string | null
  notes: string
  created_at: string
}

export interface CategoryMargin {
  category: string
  label: string
  amount: number
  percent: number
}

export interface MarginSummary {
  budget: number
  budget_source: 'quotation' | 'contract'
  actual: number
  remaining: number
  usage_percent: number
  is_over_budget: boolean
  by_category: CategoryMargin[]
  contract_value: number
  margin_amount: number
  margin_percent: number
}

export interface B2BProjectDetail {
  project: B2BProject
  status_logs: B2BStatusLog[]
  milestones: B2BMilestone[]
  quotations: B2BQuotation[]
  expenses: B2BExpense[]
  work_orders: B2BWorkOrder[]
  basts: B2BBast[]
  margin: MarginSummary
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const b2bProjectAdminApi = () => {
  const api = useApiHost()

  const headers = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${useCookie('token').value || ''}`,
  })

  const handle = async (response: Response) => {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || 'Terjadi kesalahan pada server')
    }
    return data
  }

  const base = `${api}/api/admin/b2b-project`

  return {
    // --- Project ---
    list: async (status = '', keyword = ''): Promise<{ success: boolean; data: B2BProject[] }> => {
      const qs = new URLSearchParams()
      if (status) qs.set('status', status)
      if (keyword) qs.set('q', keyword)
      const suffix = qs.toString() ? `?${qs}` : ''
      return handle(await fetch(`${base}${suffix}`, { headers: headers() }))
    },

    create: async (payload: Partial<B2BProject>) =>
      handle(await fetch(base, { method: 'POST', headers: headers(), body: JSON.stringify(payload) })),

    detail: async (id: string): Promise<{ success: boolean; data: B2BProjectDetail }> =>
      handle(await fetch(`${base}/${id}`, { headers: headers() })),

    update: async (id: string, payload: Partial<B2BProject>) =>
      handle(await fetch(`${base}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) })),

    remove: async (id: string) =>
      handle(await fetch(`${base}/${id}`, { method: 'DELETE', headers: headers() })),

    changeStatus: async (id: string, status: string, note = '') =>
      handle(
        await fetch(`${base}/${id}/status`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ status, note }),
        })
      ),

    // --- Quotation ---
    listQuotations: async (projectId: string) =>
      handle(await fetch(`${base}/${projectId}/quotations`, { headers: headers() })),

    createQuotation: async (projectId: string, payload: any) =>
      handle(
        await fetch(`${base}/${projectId}/quotations`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(payload),
        })
      ),

    getQuotation: async (quotationId: string): Promise<{ success: boolean; data: B2BQuotation }> =>
      handle(await fetch(`${base}/quotation/${quotationId}`, { headers: headers() })),

    setQuotationStatus: async (quotationId: string, status: string) =>
      handle(
        await fetch(`${base}/quotation/${quotationId}/status`, {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify({ status }),
        })
      ),

    deleteQuotation: async (quotationId: string) =>
      handle(await fetch(`${base}/quotation/${quotationId}`, { method: 'DELETE', headers: headers() })),

    // --- Milestone ---
    listMilestones: async (projectId: string) =>
      handle(await fetch(`${base}/${projectId}/milestones`, { headers: headers() })),

    generateMilestones: async (projectId: string, payload: any) =>
      handle(
        await fetch(`${base}/${projectId}/milestones`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(payload),
        })
      ),

    updateMilestone: async (milestoneId: string, payload: any) =>
      handle(
        await fetch(`${base}/milestone/${milestoneId}`, {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify(payload),
        })
      ),

    issueMilestone: async (milestoneId: string) =>
      handle(await fetch(`${base}/milestone/${milestoneId}/issue`, { method: 'POST', headers: headers() })),

    payMilestone: async (milestoneId: string) =>
      handle(await fetch(`${base}/milestone/${milestoneId}/pay`, { method: 'POST', headers: headers() })),

    // --- Expense & margin ---
    listExpenses: async (projectId: string) =>
      handle(await fetch(`${base}/${projectId}/expenses`, { headers: headers() })),

    createExpense: async (projectId: string, payload: any) =>
      handle(
        await fetch(`${base}/${projectId}/expenses`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(payload),
        })
      ),

    deleteExpense: async (expenseId: string) =>
      handle(await fetch(`${base}/expense/${expenseId}`, { method: 'DELETE', headers: headers() })),

    margin: async (projectId: string): Promise<{ success: boolean; data: MarginSummary }> =>
      handle(await fetch(`${base}/${projectId}/margin`, { headers: headers() })),

    // --- Work order & BAST ---
    listWorkOrders: async (projectId: string) =>
      handle(await fetch(`${base}/${projectId}/work-orders`, { headers: headers() })),

    createWorkOrder: async (projectId: string, payload: any) =>
      handle(
        await fetch(`${base}/${projectId}/work-orders`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(payload),
        })
      ),

    updateWorkOrder: async (woId: string, payload: any) =>
      handle(
        await fetch(`${base}/work-order/${woId}`, {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify(payload),
        })
      ),

    listBasts: async (projectId: string) =>
      handle(await fetch(`${base}/${projectId}/basts`, { headers: headers() })),

    generateBast: async (projectId: string, payload: any) =>
      handle(
        await fetch(`${base}/${projectId}/basts`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(payload),
        })
      ),
  }
}
