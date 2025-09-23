import { useApiHost } from "@/composables/useApiHost";

export interface RecurringInvoiceItem {
  name: string;
  price: number;
  qty: number;
  total: number;
}

export interface RecurringInvoice {
  id: string;
  customer_id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  invoice_date: string;
  due_date: string;
  next_invoice_date: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'stopped' | 'completed';
  description?: string;
  invoice_items: RecurringInvoiceItem[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_user?: {
    id: string;
    name: string;
  };
  history?: RecurringInvoiceHistory[];
}

export interface RecurringInvoiceHistory {
  id: string;
  recurring_invoice_id: string;
  generated_invoice_id: string;
  generated_invoice: {
    id: string;
    amount: number;
    status: string;
    link: string;
  };
  generated_at: string;
  invoice_date: string;
  due_date: string;
}

export interface CreateRecurringInvoiceRequest {
  customer_id: string;
  amount: number;
  invoice_date: string;
  due_date: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  description?: string;
  invoice_items: RecurringInvoiceItem[];
}

export interface UpdateRecurringInvoiceRequest extends CreateRecurringInvoiceRequest {
  id: string;
}

export interface UpdateRecurringInvoiceStatusRequest {
  id: string;
  status: 'active' | 'stopped' | 'completed';
}

export interface GenerateInvoiceRequest {
  id: string;
  invoice_date?: string;
  due_date?: string;
}

export const recurringInvoiceAdminApi = () => {
  const apiHost = useApiHost();
  
  return {
    getAllRecurringInvoices: async (): Promise<{ data: RecurringInvoice[] }> => {
      const response = await fetch(`${apiHost}/api/admin/recurring-invoice`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useCookie("token").value}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },

    getRecurringInvoiceById: async (id: string): Promise<{ data: RecurringInvoice }> => {
      const response = await fetch(`${apiHost}/api/admin/recurring-invoice/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useCookie("token").value}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },

    createRecurringInvoice: async (data: CreateRecurringInvoiceRequest): Promise<{ data: RecurringInvoice }> => {
      const response = await fetch(`${apiHost}/api/admin/recurring-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },

    updateRecurringInvoice: async (data: UpdateRecurringInvoiceRequest): Promise<{ data: RecurringInvoice }> => {
      const response = await fetch(`${apiHost}/api/admin/recurring-invoice/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },

    updateRecurringInvoiceStatus: async (data: UpdateRecurringInvoiceStatusRequest): Promise<{ data: RecurringInvoice }> => {
      const response = await fetch(`${apiHost}/api/admin/recurring-invoice/${data.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },

    deleteRecurringInvoice: async (id: string): Promise<{ data: null }> => {
      const response = await fetch(`${apiHost}/api/admin/recurring-invoice/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useCookie("token").value}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },

    generateInvoiceFromRecurring: async (data: GenerateInvoiceRequest): Promise<{ data: any }> => {
      const response = await fetch(`${apiHost}/api/admin/recurring-invoice/${data.id}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },

    getRecurringInvoiceHistory: async (id: string): Promise<{ data: RecurringInvoiceHistory[] }> => {
      const response = await fetch(`${apiHost}/api/admin/recurring-invoice/${id}/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useCookie("token").value}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  };
};
