import type { CreatePurchaseRequest, CreateDeploymentRequest, InventoryStatusRequest } from "@/types/requests/inventory";

export const inventoryAdminApi = () => {
  const api = useApiHost();
  return {
    // Purchase Stock
    createPurchase: async (data: CreatePurchaseRequest) => {
      const response = await fetch(`${api}/api/admin/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create purchase');
      }
      return response.json();
    },

    // Asset Deployment
    createDeployment: async (data: CreateDeploymentRequest) => {
      const response = await fetch(`${api}/api/admin/deployments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deploy asset');
      }
      return response.json();
    },

    // Get Inventory Status
    getInventoryStatus: async (params?: InventoryStatusRequest) => {
      const queryParams = new URLSearchParams();
      if (params?.brand) queryParams.append('brand', params.brand);
      if (params?.model) queryParams.append('model', params.model);
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${api}/api/admin/inventory/status?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get inventory status');
      }
      return response.json();
    },
  };
};
