import type { CreateAssetItemRequest } from "@/types/requests/asset-item";

export const assetItemAdminApi = () => {
  const api = useApiHost();
  return {
    getAssetItems: async (params?: {
      asset_id?: string;
      status?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.asset_id) queryParams.append('asset_id', params.asset_id);
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${api}/api/admin/asset-item?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch asset items');
      }
      return response.json();
    },

    getAvailableAssetItems: async (assetId: string) => {
      const response = await fetch(`${api}/api/admin/asset-item?asset_id=${assetId}&status=in_stock`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch available asset items');
      }
      return response.json();
    },

    getAssetItem: async (id: string) => {
      const response = await fetch(`${api}/api/admin/asset-item/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch asset item');
      }
      return response.json();
    },

    createAssetItem: async (data: CreateAssetItemRequest) => {
      const response = await fetch(`${api}/api/admin/asset-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create asset item');
      }
      return response.json();
    },

    editAssetItem: async (id: string, data: CreateAssetItemRequest) => {
      const response = await fetch(`${api}/api/admin/asset-item/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update asset item');
      }
      return response.json();
    },

    deleteAssetItem: async (id: string) => {
      const response = await fetch(`${api}/api/admin/asset-item/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete asset item');
      }
      return response.json();
    },

    // =========================================================================
    // Router / customer integration
    // =========================================================================

    /**
     * Menjawab: "unit asset ini sedang dipakai customer siapa?"
     * GET /api/admin/asset-item/:id/usage
     */
    getAssetItemUsage: async (id: string) => {
      const response = await fetch(`${api}/api/admin/asset-item/${id}/usage`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch asset item usage');
      }
      return response.json();
    },

    /**
     * Menjawab: "router dengan serial number ini terpasang di customer siapa?"
     * GET /api/admin/asset-item/usage/by-serial?serial_number=XXXX
     */
    getAssetItemUsageBySerial: async (serialNumber: string) => {
      const queryParams = new URLSearchParams();
      queryParams.append('serial_number', serialNumber);

      const response = await fetch(`${api}/api/admin/asset-item/usage/by-serial?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch asset item usage by serial number');
      }
      return response.json();
    },

    /**
     * Menjawab: "customer ini memakai router apa saja?"
     * GET /api/admin/asset-item/customer/:customerId/routers
     */
    getCustomerRouters: async (customerId: string) => {
      const response = await fetch(`${api}/api/admin/asset-item/customer/${customerId}/routers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customer routers');
      }
      return response.json();
    },

    // =========================================================================
    // ONT monitoring (GenieACS) — status up/down & redaman per customer
    // =========================================================================

    /**
     * Ringkasan status ONT seluruh customer untuk marker peta.
     * GET /api/map/ont-status
     */
    getOntMapStatus: async () => {
      const response = await fetch(`${api}/api/map/ont-status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ONT map status');
      }
      return response.json();
    },

    /**
     * Detail status ONT satu customer (redaman, online, MAC, serial, dll).
     * GET /api/customers/:id/ont
     */
    getCustomerOnt: async (customerId: string) => {
      const response = await fetch(`${api}/api/customers/${customerId}/ont`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customer ONT status');
      }
      return response.json();
    },

    /**
     * Riwayat redaman optik untuk grafik.
     * GET /api/customers/:id/ont/history?limit=
     */
    getCustomerOntHistory: async (customerId: string, limit: number = 100) => {
      const response = await fetch(`${api}/api/customers/${customerId}/ont/history?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customer ONT history');
      }
      return response.json();
    },

    /**
     * Paksa ONT mengirim data terbaru (TR-069 refreshObject).
     * POST /api/customers/:id/ont/refresh
     */
    refreshCustomerOnt: async (customerId: string) => {
      const response = await fetch(`${api}/api/customers/${customerId}/ont/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refresh customer ONT');
      }
      return response.json();
    },
  };
};

