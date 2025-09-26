import type { CreateCompanyRequest, UpdateCompanyRequest, Company, ApiResponse } from "@/types/requests/company";

export const companyAdminApi = () => {
  const api = useApiHost();
  return {
    getAllCompanies: async (): Promise<ApiResponse<Company[]>> => {
      const response = await fetch(`${api}/api/admin/company`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch companies');
      }
      return response.json();
    },

    getCompany: async (companyId: string): Promise<ApiResponse<Company>> => {
      const response = await fetch(`${api}/api/admin/company/${companyId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch company');
      }
      return response.json();
    },

    createCompanies: async (data: CreateCompanyRequest): Promise<ApiResponse<Company>> => {
      const response = await fetch(`${api}/api/admin/company`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create company');
      }
      return response.json();
    },

    editCompany: async (companyId: string, data: UpdateCompanyRequest): Promise<ApiResponse<Company>> => {
      const response = await fetch(`${api}/api/admin/company/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update company');
      }
      return response.json();
    },

    deleteCompany: async (companyId: string): Promise<ApiResponse<null>> => {
      const response = await fetch(`${api}/api/admin/company/${companyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete company');
      }
      return response.json();
    },
  };
};