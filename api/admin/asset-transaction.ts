import type { CreateAssetTransactionRequest } from "@/types/requests/asset-transaction";

export const assetTransactionAdminApi = () => {
  const api = useApiHost();
  return {
    getAssetTransactions: async (params?: {
      asset_id?: string;
      customer_installation_id?: string;
      transaction_type?: string;
      date_from?: string;
      date_to?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.asset_id) queryParams.append('asset_id', params.asset_id);
      if (params?.customer_installation_id) queryParams.append('customer_installation_id', params.customer_installation_id);
      if (params?.transaction_type) queryParams.append('transaction_type', params.transaction_type);
      if (params?.date_from) queryParams.append('date_from', params.date_from);
      if (params?.date_to) queryParams.append('date_to', params.date_to);

      const response = await fetch(`${api}/api/admin/asset-transaction?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch asset transactions');
      }
      return response.json();
    },

    getAssetTransaction: async (id: string) => {
      const response = await fetch(`${api}/api/admin/asset-transaction/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch asset transaction');
      }
      return response.json();
    },

    createAssetTransaction: async (data: CreateAssetTransactionRequest) => {
      const response = await fetch(`${api}/api/admin/asset-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create asset transaction');
      }
      return response.json();
    },

    editAssetTransaction: async (id: string, data: CreateAssetTransactionRequest) => {
      const response = await fetch(`${api}/api/admin/asset-transaction/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update asset transaction');
      }
      return response.json();
    },

    deleteAssetTransaction: async (id: string) => {
      const response = await fetch(`${api}/api/admin/asset-transaction/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete asset transaction');
      }
      return response.json();
    },
  };
};

