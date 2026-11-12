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
  };
};

