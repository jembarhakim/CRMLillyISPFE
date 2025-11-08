import { useApiHost } from "@/composables/useApiHost";
import { useCookie } from "#app";
import type {
  CreateItemRequest,
  Item,
  GetItemsRequest,
  UpdateItemRequest,
} from "@/types/requests/items-catalog";

export const itemsCatalogAdminApi = () => {
  const api = useApiHost();
  return {
    getItems: async (params?: GetItemsRequest) => {
      const queryParams = new URLSearchParams();
      if (params?.category) {
        queryParams.append("category", params.category);
      }
      if (params?.asset_id) {
        queryParams.append("asset_id", params.asset_id);
      }

      const url = `${api}/api/admin/items-catalog${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch items");
      }
      return response.json();
    },

    getItem: async (id: string) => {
      const response = await fetch(`${api}/api/admin/items-catalog/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch item");
      }
      return response.json();
    },

    createItem: async (data: CreateItemRequest) => {
      const response = await fetch(`${api}/api/admin/items-catalog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create item");
      }
      return response.json();
    },

    updateItem: async (id: string, data: CreateItemRequest) => {
      const response = await fetch(`${api}/api/admin/items-catalog/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update item");
      }
      return response.json();
    },

    deleteItem: async (id: string) => {
      const response = await fetch(`${api}/api/admin/items-catalog/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete item");
      }
      return response.json();
    },
  };
};

