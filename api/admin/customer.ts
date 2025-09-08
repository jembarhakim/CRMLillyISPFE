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



  };
};
