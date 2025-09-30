import type { CreateCustomerInstallationRequest, CreateCustomerRequest, UpdateCustomerRequest } from "@/types/requests/customer";

export const customerAdminApi = () => {
  const api = useApiHost();
  return {
    getCustomer: async (customerId: string) => {
      const response = await fetch(`${api}/api/admin/customer/${customerId}`, {
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

    getAllCustomers: async () => {
      const response = await fetch(`${api}/api/admin/customer`, {
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

    createCustomer: async (
      data: CreateCustomerRequest
    ) => {
      const response = await fetch(`${api}/api/admin/customer`, {
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

    editCustomer: async (
      customerId: string,
      data: UpdateCustomerRequest
    ) => {
      const response = await fetch(`${api}/api/admin/customer/${customerId}`, {
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

    deleteCustomer: async (customerId: string) => {
      const response = await fetch(`${api}/api/admin/customer/${customerId}`, {
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
     createCustomerInstallation: async (
      data: CreateCustomerInstallationRequest
    ) => {
      const response = await fetch(`${api}/api/admin/customer-installation`, {
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

    getCustomerDetail: async (customerId: string) => {
      const response = await fetch(`${api}/api/admin/customer/${customerId}/detail`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customer detail');
      }
      return response.json();
    },

    getCustomerTickets: async (customerId: string) => {
      const response = await fetch(`${api}/api/tickets?customer_id=${customerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customer tickets');
      }
      return response.json();
    },

    getCustomerInvoices: async (customerId: string) => {
      const response = await fetch(`${api}/api/admin/invoice?customer_id=${customerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customer invoices');
      }
      return response.json();
    },

    // Installation Report APIs
    getCompleteInstallationReport: async (installationId: string) => {
      const response = await fetch(`${api}/api/admin/customer-installation/report/complete/${installationId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch installation report');
      }
      return response.json();
    },

    getInstallationSummaryPerCustomer: async () => {
      const response = await fetch(`${api}/api/admin/customer-installation/report/summary/customer`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch installation summary');
      }
      return response.json();
    },

    getInstallationAssetReport: async (installationId: string) => {
      const response = await fetch(`${api}/api/admin/customer-installation/report/asset/${installationId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch asset report');
      }
      return response.json();
    },

    getInstallationTechnicianReport: async () => {
      const response = await fetch(`${api}/api/admin/customer-installation/report/technician`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch technician report');
      }
      return response.json();
    },

    createCompleteInstallationReport: async (data: any) => {
      const response = await fetch(`${api}/api/admin/customer-installation/report/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create installation report');
      }
      return response.json();
    },

    createReportInstallation: async (formData: FormData) => {
      const response = await fetch(`${api}/api/admin/customer-installation/report-installations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create installation report');
      }
      return response.json();
    },

    getInstallationReportComplete: async () => {
      const response = await fetch(`${api}/api/admin/customer-installation/report-complete`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch installation reports');
      }
      return response.json();
    },

    // Check if customer has existing installation report
    checkCustomerInstallationReport: async (customerId: string) => {
      try {
        const response = await fetch(`${api}/api/admin/customer-installation/report-complete`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useCookie("token").value}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch installation reports');
        }
        const data = await response.json();
        // Check if any installation report exists for this customer
        const hasInstallationReport = data.data && data.data.some((report: any) => report.customer_id === customerId);
        return { hasInstallationReport };
      } catch (error) {
        console.error("Error checking customer installation report:", error);
        return { hasInstallationReport: false };
      }
    },

  };
};
