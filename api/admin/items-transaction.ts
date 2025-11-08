import type { CreateItemsTransactionRequest, ItemsTransactionResponse } from "@/types/requests/items-transaction";

export const itemsTransactionAdminApi = () => {
  const api = useApiHost();
  return {
    getItemsTransactions: async (params?: {
      transaction_type?: string;
      date_from?: string;
      date_to?: string;
      asset_id?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.transaction_type) queryParams.append('transaction_type', params.transaction_type);
      if (params?.date_from) queryParams.append('date_from', params.date_from);
      if (params?.date_to) queryParams.append('date_to', params.date_to);
      if (params?.asset_id) queryParams.append('asset_id', params.asset_id);

      const response = await fetch(`${api}/api/admin/items-transaction?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch items transactions');
      }
      return response.json();
    },

    getItemsTransaction: async (id: string, transactionType: string = 'out') => {
      const response = await fetch(`${api}/api/admin/items-transaction/${id}?transaction_type=${transactionType}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch items transaction');
      }
      return response.json();
    },

    createItemsTransaction: async (data: CreateItemsTransactionRequest) => {
      const response = await fetch(`${api}/api/admin/items-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create items transaction');
      }
      return response.json();
    },

    editItemsTransaction: async (id: string, data: CreateItemsTransactionRequest) => {
      const response = await fetch(`${api}/api/admin/items-transaction/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update items transaction');
      }
      return response.json();
    },

    deleteItemsTransaction: async (id: string, transactionType: string = 'out') => {
      const response = await fetch(`${api}/api/admin/items-transaction/${id}?transaction_type=${transactionType}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete items transaction');
      }
      return response.json();
    },
  };
};

