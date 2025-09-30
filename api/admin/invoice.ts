import type { CreateInvoiceRequest, UpdateStatusInvoiceRequest } from "@/types/requests/invoice";


export const invoiceAdminApi = () => {
  const api = useApiHost();
  return {
    getInvoice: async (invoiceId: string) => {
      const response = await fetch(`${api}/api/admin/invoice/${invoiceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },

    getAllInvoices: async () => {
      const response = await fetch(`${api}/api/admin/invoice`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },

    createInvoice: async (
      data: CreateInvoiceRequest
    ) => {
      const response = await fetch(`${api}/api/admin/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },

    editInvoice: async (
      invoiceId: string,
      data: CreateInvoiceRequest
    ) => {
      const response = await fetch(`${api}/api/admin/invoice/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },

    deleteInvoice: async (invoiceId: string) => {
      const response = await fetch(`${api}/api/admin/invoice/${invoiceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },

    updateStatusInvoice: async (
      invoiceId: string,
      data: UpdateStatusInvoiceRequest
    ) => {
      const response = await fetch(`${api}/api/admin/invoice/${invoiceId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },

    processPartialPayment: async (
      invoiceId: string,
      amount: number,
      reason?: string
    ) => {
      const response = await fetch(`${api}/api/admin/invoice/${invoiceId}/partial-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify({ amount, reason }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },

    markPdfViewed: async (invoiceId: string) => {
      const response = await fetch(`${api}/api/admin/invoice/${invoiceId}/mark-pdf-viewed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        let errorMessage = 'Failed to mark PDF as viewed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },

    printAllUnpaidInvoices: async () => {
      const response = await fetch(`${api}/api/admin/invoice/print-all-unpaid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Print failed');
      }
      return response.json();
    },
  };
};
