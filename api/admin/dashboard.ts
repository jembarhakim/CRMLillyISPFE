import type { CreateCompanyRequest } from "@/types/requests/company";

export const dashboardAdminApi = () => {
  const api = useApiHost();
  return {
    totalIncomeDashboard: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/total-income`, {
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
    totalExpensesDashboard: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/total-expenses`, {
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
    totalNetWorthDashboard: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/total-net-worth`, {
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
    totalSalesDashboard: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/total-sales`, {
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

     cardCustomerDashboard: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/card-customer`, {
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
     cardPacketPopularDashboard: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/card-packet-popular`, {
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
    cardAreaPopularDashboard: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/card-area-popular`, {
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
    cardReportCashDashboard: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/card-report-cash`, {
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

    // New dashboard endpoints
    getDashboardStats: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get dashboard stats');
      }
      return response.json();
    },

    getRecentInvoices: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/recent-invoices`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get recent invoices');
      }
      return response.json();
    },

    getRecentTransactions: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/recent-transactions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get recent transactions');
      }
      return response.json();
    },

    getCustomerGrowth: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/customer-growth`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get customer growth');
      }
      return response.json();
    },

    getRevenueChart: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/revenue-chart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get revenue chart');
      }
      return response.json();
    },
  };
};
