import type { CreateAreaRequest } from "@/types/requests/area";
import type { CreateCompanyRequest } from "@/types/requests/company";

export const archiveInstallationAdminApi = () => {
  const api = useApiHost();
  return {
    getArchiveInstallation: async (id: string) => {
      const response = await fetch(`${api}/api/admin/customer-installation/${id}`, {
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
    getAllArchiveInstallation: async () => {
      const response = await fetch(`${api}/api/admin/customer-installation`, {
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
    getAllArchiveInstallationActiveOnly: async (activeOnly = false) => { // Accept param
      // Create query string based on param
      const queryParams = activeOnly ? '?deleted_at=null' : '';

      // Note: The specific query param key ('deleted_at', 'active', etc.) 
      // depends on how your Backend/Golang/Laravel handles filters.

      const response = await fetch(`${api}/api/admin/customer-installation${queryParams}`, {
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
  };
};
