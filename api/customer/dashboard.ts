import { useApiHost } from "@/composables/useApiHost";
import { useAuthStore } from "@/stores/auth";

export const dashboardCustomerApi = () => {
  const api = useApiHost();
  const authStore = useAuthStore();

  const authHeaders = () => {
    const token = authStore.getToken;
    if (!token || token === '' || token === 'null' || token === 'undefined') {
      throw new Error('No valid authentication token available');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  return {
    getCustomerDashboard: async () => {
      const response = await fetch(`${api}/api/customer/dashboard`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },
    createPaymentDashboard: async (data: { invoice_id: string }) => {
      const response = await fetch(`${api}/api/customer/dashboard`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    },
    checkDeviceStatus: async () => {
      const response = await fetch(`${api}/api/customer/dashboard/device-status`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check device status');
      }
      return response.json();
    },
    getAvailableProducts: async () => {
      const response = await fetch(`${api}/api/customer/dashboard/products`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get available products');
      }
      return response.json();
    },
  };
};
