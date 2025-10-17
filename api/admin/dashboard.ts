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
    getDashboardStats: async (params: any = {}) => {
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      if (params.days) queryParams.append('days', params.days.toString());
      if (params.year_start) queryParams.append('year_start', params.year_start.toString());
      if (params.year_end) queryParams.append('year_end', params.year_end.toString());
      if (params.year) queryParams.append('year', params.year.toString());
      if (params.month) queryParams.append('month', params.month.toString());
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      
      const queryString = queryParams.toString();
      const url = queryString ? `${api}/api/admin/dashboard/stats?${queryString}` : `${api}/api/admin/dashboard/stats`;
      
      const response = await fetch(url, {
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

    getCustomerGrowth: async (params?: { days?: number; year_start?: number; year_end?: number }) => {
      const query = params ? `?${new URLSearchParams(Object.entries(params).reduce((acc: any, [k,v])=>{ if(v!==undefined && v!==null) acc[k]=String(v); return acc; }, {})).toString()}` : '';
      const response = await fetch(`${api}/api/admin/dashboard/customer-growth${query}`, {
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

    getRevenueChart: async (params?: { days?: number; year_start?: number; year_end?: number }) => {
      const query = params ? `?${new URLSearchParams(Object.entries(params).reduce((acc: any, [k,v])=>{ if(v!==undefined && v!==null) acc[k]=String(v); return acc; }, {})).toString()}` : '';
      const response = await fetch(`${api}/api/admin/dashboard/revenue-chart${query}`, {
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

    getExpensesChart: async (params?: { days?: number; year_start?: number; year_end?: number }) => {
      const query = params ? `?${new URLSearchParams(Object.entries(params).reduce((acc: any, [k,v])=>{ if(v!==undefined && v!==null) acc[k]=String(v); return acc; }, {})).toString()}` : '';
      const response = await fetch(`${api}/api/admin/dashboard/expenses-chart${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get expenses chart');
      }
      return response.json();
    },

    getUnpaidCustomersChart: async (params?: { days?: number; year_start?: number; year_end?: number }) => {
      const query = params ? `?${new URLSearchParams(Object.entries(params).reduce((acc: any, [k,v])=>{ if(v!==undefined && v!==null) acc[k]=String(v); return acc; }, {})).toString()}` : '';
      const response = await fetch(`${api}/api/admin/dashboard/unpaid-customers-chart${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get unpaid customers chart');
      }
      return response.json();
    },

    getUnpaidCustomersList: async () => {
      const response = await fetch(`${api}/api/admin/dashboard/unpaid-customers-list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get unpaid customers list');
      }
      return response.json();
    },
  };
};
