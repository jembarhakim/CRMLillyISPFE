import type {
  GetStockBalanceParams,
  GetStockMutationsParams,
} from "@/types/requests/stock";

export const stockAdminApi = () => {
  const api = useApiHost();
  return {
    async getStockBalance(params?: GetStockBalanceParams) {
      const queryParams = new URLSearchParams();
      if (params?.item_id) queryParams.append("item_id", params.item_id);
      if (params?.holder_id) queryParams.append("holder_id", params.holder_id);
      if (params?.unit) queryParams.append("unit", params.unit);
      if (typeof params?.include_zero === "boolean") {
        queryParams.append("include_zero", String(params.include_zero));
      }

      const query = queryParams.toString();
      const response = await fetch(
        `${api}/api/admin/items-transaction/stock/balance${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useCookie("token").value}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch stock balance");
      }
      return response.json();
    },

    async getStockMutations(params?: GetStockMutationsParams) {
      const queryParams = new URLSearchParams();
      if (params?.item_id) queryParams.append("item_id", params.item_id);
      if (params?.holder_id) queryParams.append("holder_id", params.holder_id);
      if (params?.kind) queryParams.append("kind", params.kind);
      if (params?.date_from) queryParams.append("date_from", params.date_from);
      if (params?.date_to) queryParams.append("date_to", params.date_to);
      if (params?.limit !== undefined) queryParams.append("limit", String(params.limit));
      if (params?.offset !== undefined) queryParams.append("offset", String(params.offset));

      const query = queryParams.toString();
      const response = await fetch(
        `${api}/api/admin/items-transaction/stock/mutations${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useCookie("token").value}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch stock mutations");
      }
      return response.json();
    },
  };
};
