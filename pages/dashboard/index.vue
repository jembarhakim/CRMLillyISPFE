<script setup lang="ts">
import { onUnmounted } from 'vue';
import { dashboardAdminApi } from "@/api/admin/dashboard";
import { invoiceAdminApi } from "@/api/admin/invoice";
import { ticketsApi } from "@/api/tickets";
import { formatIDR } from "@/helper/currency";
import { formatDateToYMD } from "@/helper/date";
import { useNotification } from "@/composables/useNotification";

const notification = useNotification();

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

// Set page title
useHead({
  title: 'Dashboard - CRM System'
})


let invoices = ref<any[]>([]);
const latestDeposites = ref<any[]>([]);
const latestExpenses = ref<any[]>([]);
let totalIncome = ref<any>(0);
let totalExpenses = ref<any>(0);
let totalNetWorth = ref<any>(0);
let totalSales = ref<any>(0);

// New dashboard data
const dashboardStats = ref<any>({});
const recentInvoices = ref<any[]>([]);
const recentTransactions = ref<any[]>([]);
const recentTickets = ref<any[]>([]);
const troubleTypeMap = ref<Record<string, string>>({});
const customerGrowth = ref<any>({});
const revenueChart = ref<any>({});
const expensesChart = ref<any>({});
const unpaidCustomersChart = ref<any>({});

// Modal state for accumulation editing
const showAccumulationModal = ref(false);
const selectedTicket = ref<any>(null);
const newAccumulationValue = ref<string>('');

// Removed logout confirmation modal state

// Filter variables
const selectedDateRange = ref<number>(0); // 0 = All time by default
// Optional year-range filter (overrides day range when active and both years selected)
const useYearRange = ref<boolean>(false);
const yearStart = ref<number | null>(null);
const yearEnd = ref<number | null>(null);

// Derive available years from incoming datasets
const availableYears = computed<number[]>(() => {
  const dates: number[] = [];
  const pushYears = (arr: any[], accessor: (x: any) => string) => {
    for (const item of arr) {
      const d = new Date(accessor(item));
      if (!isNaN(d.getTime())) {
        dates.push(d.getFullYear());
      }
    }
  }
  if (customerGrowth.value?.customer_growth) {
    pushYears(customerGrowth.value.customer_growth, (x: any) => x.date)
  }
  if (revenueChart.value?.revenue_chart) {
    pushYears(revenueChart.value.revenue_chart, (x: any) => x.date)
  }
  const unique = Array.from(new Set(dates));
  unique.sort((a, b) => b - a);
  if (unique.length === 0) {
    const current = new Date().getFullYear();
    const fallback: number[] = [];
    for (let y = current; y >= current - 15; y--) fallback.push(y);
    return fallback;
  }
  return unique;
});

// Computed properties for filtered data
const filteredCustomerGrowth = computed(() => {
  if (!customerGrowth.value.customer_growth) return [];

  // If year range mode and both years selected, filter by year interval
  if (useYearRange.value && yearStart.value !== null && yearEnd.value !== null) {
    const start = Math.min(yearStart.value, yearEnd.value);
    const end = Math.max(yearStart.value, yearEnd.value);
    return customerGrowth.value.customer_growth.filter((item: any) => {
      const yr = new Date(item.date).getFullYear();
      return yr >= start && yr <= end;
    });
  }

  // Days-based filtering; 0 means all time
  const days = Number(selectedDateRange.value || 0);
  if (days <= 0) return customerGrowth.value.customer_growth;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return customerGrowth.value.customer_growth.filter((item: any) => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoffDate;
  });
});

const filteredRevenueChart = computed(() => {
  if (!revenueChart.value.revenue_chart) return [];

  if (useYearRange.value && yearStart.value !== null && yearEnd.value !== null) {
    const start = Math.min(yearStart.value, yearEnd.value);
    const end = Math.max(yearStart.value, yearEnd.value);
    return revenueChart.value.revenue_chart.filter((item: any) => {
      const yr = new Date(item.date).getFullYear();
      return yr >= start && yr <= end;
    });
  }

  const days = Number(selectedDateRange.value || 0);
  if (days <= 0) return revenueChart.value.revenue_chart;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return revenueChart.value.revenue_chart.filter((item: any) => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoffDate;
  });
});

const filteredExpensesChart = computed(() => {
  if (!expensesChart.value.expenses_chart) return [];
  if (useYearRange.value && yearStart.value !== null && yearEnd.value !== null) {
    const start = Math.min(yearStart.value, yearEnd.value);
    const end = Math.max(yearStart.value, yearEnd.value);
    return expensesChart.value.expenses_chart.filter((item: any) => {
      const yr = new Date(item.date).getFullYear();
      return yr >= start && yr <= end;
    });
  }
  const days = Number(selectedDateRange.value || 0);
  if (days <= 0) return expensesChart.value.expenses_chart;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return expensesChart.value.expenses_chart.filter((item: any) => new Date(item.date) >= cutoffDate);
});

const filteredUnpaidCustomersChart = computed(() => {
  if (!unpaidCustomersChart.value.unpaid_customers_chart) return [];
  if (useYearRange.value && yearStart.value !== null && yearEnd.value !== null) {
    const start = Math.min(yearStart.value, yearEnd.value);
    const end = Math.max(yearStart.value, yearEnd.value);
    return unpaidCustomersChart.value.unpaid_customers_chart.filter((item: any) => {
      const yr = new Date(item.date).getFullYear();
      return yr >= start && yr <= end;
    });
  }
  const days = Number(selectedDateRange.value || 0);
  if (days <= 0) return unpaidCustomersChart.value.unpaid_customers_chart;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return unpaidCustomersChart.value.unpaid_customers_chart.filter((item: any) => new Date(item.date) >= cutoffDate);
});

// Chart options computed properties
const customerGrowthChartOption = computed(() => ({
  title: { 
    text: 'Customer Growth', 
    textStyle: { fontSize: 12 },
    left: 'center'
  },
  axisPointer: { type: 'cross' },
  tooltip: { 
    trigger: 'axis',
    formatter: '{b}: {c} new customers'
  },
  toolbox: {
    feature: {
      dataZoom: { yAxisIndex: 'none' },
      restore: {},
      saveAsImage: {}
    },
    right: 10
  },
  xAxis: { 
    data: filteredCustomerGrowth.value.map((item: any) => item.date),
    type: 'category',
    axisLabel: { 
      rotate: 45, 
      fontSize: 8,
      interval: 'auto'
    }
  },
  yAxis: { 
    type: 'value',
    axisLabel: { fontSize: 8 }
  },
  series: [{
    name: 'New Customers',
    type: 'line',
    data: filteredCustomerGrowth.value.map((item: any) => item.count),
    smooth: true,
    sampling: 'lttb',
    itemStyle: { color: '#3B82F6' },
    lineStyle: { color: '#3B82F6', width: 2 }
  }],
  dataZoom: [
    { type: 'inside', throttle: 30 },
    { type: 'slider', height: 20, bottom: 0 }
  ],
  grid: { 
    left: '15%', 
    right: '10%', 
    bottom: '22%', 
    top: '20%',
    containLabel: true
  }
}));

const expensesChartOption = computed(() => ({
  title: { 
    text: 'Daily Expenses', 
    textStyle: { fontSize: 12 },
    left: 'center'
  },
  axisPointer: { type: 'cross' },
  tooltip: { 
    trigger: 'axis',
    formatter: (params: any) => {
      const p = Array.isArray(params) ? params[0] : params;
      return `${p.axisValue}: ${formatIDR(Number(p.data) || 0)}`
    }
  },
  toolbox: {
    feature: {
      dataZoom: { yAxisIndex: 'none' },
      restore: {},
      saveAsImage: {}
    },
    right: 10
  },
  xAxis: { 
    data: filteredExpensesChart.value.map((item: any) => item.date),
    type: 'category',
    axisLabel: { 
      rotate: 45, 
      fontSize: 8,
      interval: 'auto'
    }
  },
  yAxis: { 
    type: 'value',
    axisLabel: { 
      fontSize: 8,
      formatter: (value: number) => formatIDR(Number(value) || 0)
    }
  },
  series: [{
    name: 'Expenses',
    type: 'line',
    data: filteredExpensesChart.value.map((item: any) => item.amount),
    smooth: true,
    sampling: 'lttb',
    itemStyle: { color: '#EF4444' },
    lineStyle: { color: '#EF4444', width: 2 }
  }],
  dataZoom: [
    { type: 'inside', throttle: 30 },
    { type: 'slider', height: 20, bottom: 0 }
  ],
  grid: { 
    left: '15%', 
    right: '10%', 
    bottom: '22%', 
    top: '20%',
    containLabel: true
  }
}));

const revenueChartOption = computed(() => ({
  title: { 
    text: 'Daily Revenue', 
    textStyle: { fontSize: 12 },
    left: 'center'
  },
  axisPointer: { type: 'cross' },
  tooltip: { 
    trigger: 'axis',
    formatter: (params: any) => {
      const p = Array.isArray(params) ? params[0] : params;
      return `${p.axisValue}: ${formatIDR(Number(p.data) || 0)}`
    }
  },
  toolbox: {
    feature: {
      dataZoom: { yAxisIndex: 'none' },
      restore: {},
      saveAsImage: {}
    },
    right: 10
  },
  xAxis: { 
    data: filteredRevenueChart.value.map((item: any) => item.date),
    type: 'category',
    axisLabel: { 
      rotate: 45, 
      fontSize: 8,
      interval: 'auto'
    }
  },
  yAxis: { 
    type: 'value',
    axisLabel: { 
      fontSize: 8,
      formatter: (value: number) => formatIDR(Number(value) || 0)
    }
  },
  series: [{
    name: 'Revenue',
    type: 'line',
    data: filteredRevenueChart.value.map((item: any) => item.amount),
    smooth: true,
    sampling: 'lttb',
    itemStyle: { color: '#10B981' },
    lineStyle: { color: '#10B981', width: 2 }
  }],
  dataZoom: [
    { type: 'inside', throttle: 30 },
    { type: 'slider', height: 20, bottom: 0 }
  ],
  grid: { 
    left: '15%', 
    right: '10%', 
    bottom: '22%', 
    top: '20%',
    containLabel: true
  }
}));

const unpaidCustomersChartOption = computed(() => ({
  title: { 
    text: 'Unpaid Customers', 
    textStyle: { fontSize: 12 },
    left: 'center'
  },
  axisPointer: { type: 'cross' },
  tooltip: { 
    trigger: 'axis',
    formatter: '{b}: {c} customers'
  },
  toolbox: {
    feature: {
      dataZoom: { yAxisIndex: 'none' },
      restore: {},
      saveAsImage: {}
    },
    right: 10
  },
  xAxis: { 
    data: filteredUnpaidCustomersChart.value.map((item: any) => item.date),
    type: 'category',
    axisLabel: { 
      rotate: 45, 
      fontSize: 8,
      interval: 'auto'
    }
  },
  yAxis: { 
    type: 'value',
    axisLabel: { fontSize: 8 }
  },
  series: [{
    name: 'Unpaid Customers',
    type: 'line',
    data: filteredUnpaidCustomersChart.value.map((item: any) => item.count),
    smooth: true,
    sampling: 'lttb',
    itemStyle: { color: '#F59E0B' },
    lineStyle: { color: '#F59E0B', width: 2 }
  }],
  dataZoom: [
    { type: 'inside', throttle: 30 },
    { type: 'slider', height: 20, bottom: 0 }
  ],
  grid: { 
    left: '15%', 
    right: '10%', 
    bottom: '22%', 
    top: '20%',
    containLabel: true
  }
}));
const optionCardCustomer = ref();
const optionCardPacketPopular = ref();
const optionCardArea = ref();
const optionCardReportCash = ref();


definePageMeta({
  layout: false,
});

const data = ref<{ y: number[]; x: string[]; label: string }[]>([]);
let cards = ref<{ name: string; total: number }[]>([]);
const CardList = [
  {
    name: "Customer",
    total: 0,
  },
  {
    name: "Packet Popular",
    total: 0,
  },
  {
    name: "Area",
    total: 0,
  },
  {
    name: "Report Cash",
    total: 0,
  },
];

for (const card of CardList) {
  const option = {
    title: {
      text: ''
    },
    tooltip: {},
    legend: {
      show: true,
      top: '5%'        // ✅ Pastikan legend tidak di luar viewport
    },
    xAxis: {
      data: [],
    },
    yAxis: {},
    series: [
      {
        name: '',
        type: '',
        smooth: true,
        label: { show: true },
        data: []
      }
    ]
  }
  if (card.name === "Customer") {
    try {
      const response = await dashboardAdminApi().cardCustomerDashboard();
      const graph = response.data.graph_customer;

      (option.title as any).text = card.name

      if (Array.isArray(option.series) && option.series[0]) {
        (option.series[0] as any).data = graph.map((item: any) => item.count);
        (option.series[0] as any).name = card.name;
        (option.series[0] as any).type = "line";
      }

      (option.xAxis as any).data =
        graph.map((item: any) => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }
          );
        })

      optionCardCustomer.value = option


    } catch (err: any) {
      notification.error('Load Error', err.message || "Failed to load customer data", 3000);
    }
  }

  if (card.name === "Packet Popular") {
    try {
      const response = await dashboardAdminApi().cardPacketPopularDashboard();
      const graph = response.data.graph_packet_popular;

      (option.title as any).text = card.name

      if (Array.isArray(option.series) && option.series[0]) {
        (option.series[0] as any).data = graph.map((item: any) => item.count);
        (option.series[0] as any).name = card.name;
        (option.series[0] as any).type = "bar";
      }

      (option.xAxis as any).data =
        graph.map((item: any) => {
          return item.name;
        })

      optionCardPacketPopular.value = option


    } catch (err: any) {
      notification.error('Load Error', err.message || "Failed to load customer data", 3000);
    }
  }

  if (card.name === "Area") {
    try {
      const response = await dashboardAdminApi().cardAreaPopularDashboard();
      const graph = response.data.graph_area_popular;

      (option.title as any).text = card.name

      if (Array.isArray(option.series) && option.series[0]) {
        (option.series[0] as any).data = graph.map((item: any) => item.count);
        (option.series[0] as any).name = card.name;
        (option.series[0] as any).type = "bar";
      }

      (option.xAxis as any).data =
        graph.map((item: any) => {
          return item.name_city + " - " + item.name_subdistrict + " - " + item.name_village;
        })

      optionCardArea.value = option


    } catch (err: any) {
      notification.error('Load Error', err.message || "Failed to load customer data", 3000);
    }
  }

  if (card.name === "Report Cash") {
    try {
      const response = await dashboardAdminApi().cardReportCashDashboard();
      const graph = response.data.graph_report_cash;

      (option.title as any).text = card.name

      if (Array.isArray(option.series) && option.series[0]) {
        (option.series[0] as any).data = graph.map((item: any) => item.count);
        (option.series[0] as any).name = card.name;
        (option.series[0] as any).type = "bar";
      }

      (option.xAxis as any).data =
        graph.map((item: any) => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }
          );
        })

      optionCardReportCash.value = option


    } catch (err: any) {
      notification.error('Load Error', err.message || "Failed to load customer data", 3000);
    }
  }
}

const columns = [
  {
    key: "number",
    label: "Number",
  },
  {
    key: "customer.name",
    label: "Name",
  },
  {
    key: "created_at",
    label: "Date",
  },
  {
    key: "amount",
    label: "amount",
  }, {
    key: "status",
    label: "Status",
  },
  {
    key: "product_name",
    label: "Plan",
  },
];
async function getData() {
  invoiceAdminApi()
    .getAllInvoices()
    .then((response) => {
      response.data
        .forEach((customer: any) => {
          customer.number = response.data.indexOf(customer) + 1;
        });

      invoices.value = [...response.data];
    })
    .catch((err) => {
      // Don't show notification for auth errors (401) - let auth middleware handle it
      if (err?.status !== 401) {
        notification.error('Error', err?.message || 'Failed to load invoices', 3000);
      }
    });

  transactionAdminApi()
    .getAllTransactions(null).then((response) => {
      latestDeposites.value = response.data.filter((item: any) => item.type_in_out == "debit").map((transaction: any, index: number) => {
        return {
          number: index + 1,
          type_cash: transaction.type_cash.split("_")[0] + " " + (transaction.type_cash.split("_")[1] ? transaction.type_cash.split("_")[1] : ""),
          amount: transaction.amount,
          description: transaction.description
        }
      }).slice((1 - 1) * 5, (1) * 5);
      latestExpenses.value = response.data.filter((item: any) => item.type_in_out == "credit").map((transaction: any, index: number) => {
        return {
          number: index + 1,
          type_cash: transaction.type_cash.split("_")[0] + " " + (transaction.type_cash.split("_")[1] ? transaction.type_cash.split("_")[1] : ""),
          amount: transaction.amount,
          description: transaction.description
        }
      }).slice((1 - 1) * 5, (1) * 5);
    }).catch((err) => {
      // Don't show notification for auth errors (401) - let auth middleware handle it
      if (err?.status !== 401) {
        notification.error('Error', err?.message || 'Failed to load transactions', 3000);
      }
    });

  dashboardAdminApi()
    .totalIncomeDashboard()
    .then((response) => {
      totalIncome.value = response.data.total_income;
    })
    .catch((err) => {
      // Don't show notification for auth errors (401) - let auth middleware handle it
      if (err?.status !== 401) {
        notification.error('Error', err?.message || 'Failed to load total income', 3000);
      }
    });

  dashboardAdminApi()
    .totalExpensesDashboard()
    .then((response) => {
      totalExpenses.value = response.data.total_expenses;
    })
    .catch((err) => {
      // Don't show notification for auth errors (401) - let auth middleware handle it
      if (err?.status !== 401) {
        notification.error('Error', err?.message || 'Failed to load total expenses', 3000);
      }
    });

  dashboardAdminApi()
    .totalNetWorthDashboard()
    .then((response) => {
      totalNetWorth.value = response.data.total_net_worth;
    })
    .catch((err) => {
      // Don't show notification for auth errors (401) - let auth middleware handle it
      if (err?.status !== 401) {
        notification.error('Error', err?.message || 'Failed to load net worth', 3000);
      }
    });

  dashboardAdminApi()
    .totalSalesDashboard()
    .then((response) => {
      totalSales.value = response.data.total_sales;
    })
    .catch((err) => {
      // Don't show notification for auth errors (401) - let auth middleware handle it
      if (err?.status !== 401) {
        notification.error('Error', err?.message || 'Failed to load total sales', 3000);
      }
    });


}
getData();


import { useLoading } from '@/composables/useLoading'
import { transactionAdminApi } from "@/api/admin/transaction";
import { number } from "yup";

const { show, hide } = useLoading()

// Function to get new dashboard data
const getNewDashboardData = async () => {
  try {
    // Get dashboard stats
    const statsResponse = await dashboardAdminApi().getDashboardStats();
    dashboardStats.value = statsResponse.data;

    // Get recent invoices
    try {
      const invoicesResponse = await dashboardAdminApi().getRecentInvoices();
      console.log('Recent invoices response:', invoicesResponse);
      recentInvoices.value = invoicesResponse.data.invoices || [];
    } catch (invoiceError) {
      console.error('Error fetching recent invoices:', invoiceError);
      // Fallback: get invoices from existing data
      if (invoices.value && invoices.value.length > 0) {
        recentInvoices.value = invoices.value.slice(0, 5).map((invoice: any) => ({
          id: invoice.id,
          invoice_no: invoice.id,
          amount: invoice.amount,
          status: invoice.status,
          customer: invoice.customer?.name || 'Unknown Customer',
          created_at: invoice.created_at
        }));
      }
    }

    // Get recent transactions
    try {
      const transactionsResponse = await dashboardAdminApi().getRecentTransactions();
      console.log('Recent transactions response:', transactionsResponse);
      recentTransactions.value = transactionsResponse.data.transactions || [];
    } catch (transactionError) {
      console.error('Error fetching recent transactions:', transactionError);
      // Fallback: get transactions from existing data
      if (latestDeposites.value && latestDeposites.value.length > 0) {
        recentTransactions.value = [
          ...latestDeposites.value.slice(0, 3).map((deposit: any) => ({
            id: deposit.number,
            amount: deposit.amount,
            type_in_out: 'debit',
            description: deposit.description,
            date: new Date().toISOString()
          })),
          ...latestExpenses.value.slice(0, 2).map((expense: any) => ({
            id: expense.number,
            amount: expense.amount,
            type_in_out: 'credit',
            description: expense.description,
            date: new Date().toISOString()
          }))
        ];
      }
    }

    // Get customer growth
    const growthResponse = await dashboardAdminApi().getCustomerGrowth();
    customerGrowth.value = growthResponse.data;

    // Get revenue chart
    const revenueResponse = await dashboardAdminApi().getRevenueChart();
    revenueChart.value = revenueResponse.data;

    // Get expenses chart
    const expensesResponse = await dashboardAdminApi().getExpensesChart();
    expensesChart.value = expensesResponse.data;

    // Get unpaid customers chart
    const unpaidResponse = await dashboardAdminApi().getUnpaidCustomersChart();
    unpaidCustomersChart.value = unpaidResponse.data;

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    notification.error('Dashboard Error', 'Failed to load dashboard data', 3000);
  }
};

// Get recent tickets
const getRecentTickets = async () => {
  try {
    // Load trouble type names for display mapping
    try {
      const tt: any = await ticketsApi().troubleTypes();
      const arr = (tt as any)?.data || tt || [];
      const map: Record<string, string> = {};
      for (const t of arr) if (t?.id) map[t.id] = t.name || t.id;
      troubleTypeMap.value = map;
    } catch {}

    const response = await ticketsApi().list();
    recentTickets.value = (response as any)?.data || response || [];
  } catch (error: any) {
    console.error('Error fetching recent tickets:', error);
    // Don't show notification for auth errors (401) - let auth middleware handle it
    if (error?.status !== 401) {
      notification.error('Error', error?.message || 'Failed to load recent tickets', 3000);
    }
    recentTickets.value = [];
  }
}

// Format accumulation numbers for display
function formatAccumulation(accumulation: number): string {
  if (accumulation === 1) {
    return '1 customer'
  } else if (accumulation < 1000) {
    return `${accumulation} customers`
  } else if (accumulation < 1000000) {
    return `${(accumulation / 1000).toFixed(1)}K customers`
  } else {
    return `${(accumulation / 1000000).toFixed(1)}M customers`
  }
}

// Edit accumulation for a ticket
function editTicketAccumulation(ticket: any) {
  selectedTicket.value = ticket
  newAccumulationValue.value = (ticket.accumulation || 1).toString()
  showAccumulationModal.value = true
}

// Handle modal save
async function saveAccumulation() {
  if (!selectedTicket.value) return
  
  const accumulation = parseInt(newAccumulationValue.value)
  if (isNaN(accumulation) || accumulation < 1) {
    notification.error('Invalid Input', 'Please enter a valid number greater than 0', 3000)
    return
  }

  try {
    await ticketsApi().updateAccumulation([selectedTicket.value.id], accumulation)

    // Update the ticket in the local data
    const ticketIndex = recentTickets.value.findIndex(t => t.id === selectedTicket.value.id)
    if (ticketIndex !== -1) {
      recentTickets.value[ticketIndex].accumulation = accumulation
    }

    notification.success('Success', `Accumulation updated to ${accumulation} customers`, 3000)
    closeAccumulationModal()
  } catch (error: any) {
    console.error('Failed to update accumulation:', error)
    notification.error('Update failed', `Failed to update accumulation: ${error?.data?.message || error?.message || 'Unknown error'}`, 3000)
  }
}

// Close modal
function closeAccumulationModal() {
  showAccumulationModal.value = false
  selectedTicket.value = null
  newAccumulationValue.value = ''
}

// Handle escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showAccumulationModal.value) {
    closeAccumulationModal()
  }
}

// Removed beforeunload and popstate handlers to allow free navigation

// Removed logout confirmation handlers

// Filter functions
async function applyDateFilter() {
  // Reset year range when using day-based range
  if (!useYearRange.value) {
    yearStart.value = null;
    yearEnd.value = null;
  }
  // Fetch server-side data with selected range for accurate aggregation
  const params = useYearRange.value && yearStart.value !== null && yearEnd.value !== null
    ? { year_start: Math.min(yearStart.value, yearEnd.value), year_end: Math.max(yearStart.value, yearEnd.value) }
    : { days: Number(selectedDateRange.value) };
  try {
    const growthResponse = await dashboardAdminApi().getCustomerGrowth(params as any)
    customerGrowth.value = growthResponse.data
    const revenueResponse = await dashboardAdminApi().getRevenueChart(params as any)
    revenueChart.value = revenueResponse.data
    const expensesResponse = await dashboardAdminApi().getExpensesChart(params as any)
    expensesChart.value = expensesResponse.data
    const unpaidResponse = await dashboardAdminApi().getUnpaidCustomersChart(params as any)
    unpaidCustomersChart.value = unpaidResponse.data
  } catch (e) {
    console.error('Failed to refresh charts with params', params, e)
  }
}





function refreshCharts() {
  // Refresh the analytics charts data
  getNewDashboardData()
}


onMounted(async () => {
  show()
  await getNewDashboardData()
  await getRecentTickets()
  hide()
  
  // Add keyboard event listener
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeydown)
})

// React to year range changes immediately
watch([useYearRange, yearStart, yearEnd], async () => {
  if (useYearRange.value) {
    await applyDateFilter()
  }
})


</script>

<template>
  <!-- Main Stats Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
    <div
      class="w-full p-6 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 text-white rounded-2xl shadow-xl transition-transform hover:scale-[1.03] duration-300">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Total Income</h1>
        <span class="text-lg font-semibold">$</span>
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold">{{ formatIDR(dashboardStats.total_income || 0) }}</h1>
      </div>
    </div>

    <div
      class="w-full p-6 bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white rounded-2xl shadow-xl transition-transform hover:scale-[1.03] duration-300">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Total Expenses</h1>
        <span class="text-lg font-semibold">$</span>
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold">{{ formatIDR(dashboardStats.total_expenses || 0) }}</h1>
      </div>
    </div>

    <div
      class="w-full p-6 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white rounded-2xl shadow-xl transition-transform hover:scale-[1.03] duration-300">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Net Worth</h1>
        <span class="text-lg font-semibold">$</span>
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold">{{ formatIDR(dashboardStats.net_worth || 0) }}</h1>
      </div>
    </div>

    <div
      class="w-full p-6 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 text-white rounded-2xl shadow-xl transition-transform hover:scale-[1.03] duration-300">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Total Customers</h1>
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold">{{ dashboardStats.total_customers || 0 }}</h1>
      </div>
    </div>
  </div>

  <!-- Additional Stats Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
    <div
      class="w-full p-6 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-2xl shadow-xl transition-transform hover:scale-[1.03] duration-300">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Total Invoices</h1>
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold">{{ dashboardStats.total_invoices || 0 }}</h1>
      </div>
    </div>

    <div
      class="w-full p-6 bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 text-white rounded-2xl shadow-xl transition-transform hover:scale-[1.03] duration-300">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Total Areas</h1>
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold">{{ dashboardStats.total_areas || 0 }}</h1>
      </div>
    </div>

    <div
      class="w-full p-6 bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 text-white rounded-2xl shadow-xl transition-transform hover:scale-[1.03] duration-300">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Total Products</h1>
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold">{{ dashboardStats.total_products || 0 }}</h1>
      </div>
    </div>

    <div
      class="w-full p-6 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white rounded-2xl shadow-xl transition-transform hover:scale-[1.03] duration-300">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Trouble Accumulation</h1>
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold">{{ dashboardStats.total_tickets || 0 }}</h1>
      </div>
    </div>
  </div>

  <!-- <div class="grid gap-6 md:grid-cols-4 sm:grid-cols-2 mb-10">
    <div v-for="(card, index) in cards" :key="index">
      <CardComponent :dataChart="data[index]" :dataCard="card" />
    </div>
  </div> -->
  <div class="grid gap-6 md:grid-cols-2 sm:grid-cols-1 mb-10">
    <VChart :option="optionCardCustomer" autoresize style="height: 400px;" />
    <VChart :option="optionCardPacketPopular" autoresize style="height: 400px;" />
    <VChart :option="optionCardArea" autoresize style="height: 400px;" />
    <VChart :option="optionCardReportCash" autoresize style="height: 400px;" />
  </div>

  <!-- Recent Data Section -->
  <div class="grid gap-6 md:grid-cols-2 sm:grid-cols-1 mb-10">
    <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-semibold text-slate-800">Recent Invoices</h1>
        <UButton icon="i-heroicons-arrow-path" color="gray" variant="soft" size="sm" @click="getNewDashboardData"
          title="Refresh Recent Invoices" />
      </div>
      <div v-if="recentInvoices.length > 0" class="space-y-3">
        <div v-for="invoice in recentInvoices.slice(0, 5)" :key="invoice.id"
          class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-gray-900">{{ invoice.invoice_no || invoice.id }}</p>
              <span class="px-2 py-1 text-xs rounded-full font-medium" :class="{
                'bg-green-100 text-green-800': invoice.status === 'paid',
                'bg-red-100 text-red-800': invoice.status === 'unpaid',
                'bg-yellow-100 text-yellow-800': invoice.status === 'pending'
              }">
                {{ invoice.status?.toUpperCase() || 'UNKNOWN' }}
              </span>
            </div>
            <p class="text-sm text-gray-600">{{ invoice.customer || 'Unknown Customer' }}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-green-600">{{ formatIDR(invoice.amount || 0) }}</p>
            <p class="text-xs text-gray-500">{{ formatDateToYMD(invoice.created_at) }}</p>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        <p>No recent invoices found</p>
      </div>
    </div>

    <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-semibold text-slate-800">Recent Transactions</h1>
        <UButton icon="i-heroicons-arrow-path" color="gray" variant="soft" size="sm" @click="getNewDashboardData"
          title="Refresh Recent Transactions" />
      </div>
      <div v-if="recentTransactions.length > 0" class="space-y-3">
        <div v-for="transaction in recentTransactions.slice(0, 5)" :key="transaction.id"
          class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-gray-900">{{ transaction.description || 'No Description' }}</p>
              <span class="px-2 py-1 text-xs rounded-full font-medium" :class="{
                'bg-green-100 text-green-800': transaction.type_in_out === 'debit',
                'bg-red-100 text-red-800': transaction.type_in_out === 'credit'
              }">
                {{ transaction.type_in_out?.toUpperCase() || 'UNKNOWN' }}
              </span>
            </div>
            <p class="text-sm text-gray-600">{{ transaction.category || 'General Transaction' }}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold" :class="transaction.type_in_out === 'debit' ? 'text-green-600' : 'text-red-600'">
              {{ formatIDR(transaction.amount || 0) }}
            </p>
            <p class="text-xs text-gray-500">{{ formatDateToYMD(transaction.date || transaction.created_at) }}</p>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        <p>No recent transactions found</p>
      </div>
    </div>
  </div>

  <!-- Recent Tickets Section -->
  <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg mb-10">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-semibold text-slate-800">Recent Trouble Tickets</h1>
      <UButton icon="i-heroicons-arrow-path" color="gray" variant="soft" size="sm" @click="getRecentTickets"
        title="Refresh Recent Tickets" />
    </div>
    <div v-if="recentTickets.length > 0" class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-700">ID</th>
            <th class="px-4 py-3 text-left font-medium text-gray-700">Title</th>
            <th class="px-4 py-3 text-left font-medium text-gray-700">Type</th>
            <th class="px-4 py-3 text-left font-medium text-gray-700">Status</th>
            <th class="px-4 py-3 text-left font-medium text-gray-700">Accumulation</th>
            <th class="px-4 py-3 text-left font-medium text-gray-700">Created</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="ticket in recentTickets.slice(0, 10)" :key="ticket.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{{ ticket.id }}</td>
            <td class="px-4 py-3 text-gray-900 max-w-xs truncate">{{ ticket.title }}</td>
            <td class="px-4 py-3 text-gray-700 capitalize">{{ troubleTypeMap[ticket.type] || ticket.type || 'Other' }}</td>
            <td class="px-4 py-3">
              <span :class="{
                'px-2 py-1 rounded-full text-xs font-medium': true,
                'bg-red-100 text-red-800': ticket.status === 'unfinished',
                'bg-yellow-100 text-yellow-800': ticket.status === 'ongoing',
                'bg-green-100 text-green-800': ticket.status === 'finished',
                'bg-gray-100 text-gray-800': !['unfinished', 'ongoing', 'finished'].includes(ticket.status)
              }">
                {{ ticket.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center space-x-2">
                <span :class="{
                  'px-2 py-1 rounded-full text-xs font-medium': true,
                  'bg-blue-100 text-blue-800': ticket.accumulation === 1,
                  'bg-orange-100 text-orange-800': ticket.accumulation > 1 && ticket.accumulation <= 5,
                  'bg-red-100 text-red-800': ticket.accumulation > 5 && ticket.accumulation <= 50,
                  'bg-red-200 text-red-900': ticket.accumulation > 50 && ticket.accumulation <= 100,
                  'bg-red-300 text-red-950': ticket.accumulation > 100 && ticket.accumulation <= 500,
                  'bg-red-400 text-white font-bold': ticket.accumulation > 500
                }">
                  {{ formatAccumulation(ticket.accumulation || 1) }}
                </span>
                <button @click="editTicketAccumulation(ticket)"
                  class="text-blue-600 hover:text-blue-800 text-xs underline" title="Edit accumulation">
                  Edit
                </button>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ formatDateToYMD(ticket.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-8 text-gray-500">
      <p>No recent tickets found</p>
    </div>
  </div>

  <!-- Charts Section -->
  <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg">
    <div class="flex flex-col justify-start items-start mb-6 gap-4">
      <h1 class="text-xl font-semibold text-slate-800">Analytics Charts</h1>
      
      <!-- Chart Filters -->
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
        <!-- Date Range Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Date Range:</label>
          <select v-model="selectedDateRange" @change="applyDateFilter"
            class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option :value="365">Last year</option>
            <option :value="730">Last 2 years</option>
            <option :value="1095">Last 3 years</option>
            <option :value="0">All time</option>
          </select>
        </div>

        <!-- Year Range Toggle -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Year range:</label>
          <input type="checkbox" v-model="useYearRange" class="h-4 w-4" title="Filter by start/end year" />
        </div>

        <!-- Year Range Selectors -->
        <div class="flex items-center gap-2" v-if="useYearRange">
          <label class="text-sm font-medium text-gray-700">From</label>
          <select v-model.number="yearStart" class="px-3 py-1 text-sm border border-gray-300 rounded-md">
            <option :value="null">-</option>
            <option v-for="y in availableYears" :key="'ys'+y" :value="y">{{ y }}</option>
          </select>
          <label class="text-sm font-medium text-gray-700">To</label>
          <select v-model.number="yearEnd" class="px-3 py-1 text-sm border border-gray-300 rounded-md">
            <option :value="null">-</option>
            <option v-for="y in availableYears" :key="'ye'+y" :value="y">{{ y }}</option>
          </select>
        </div>


        <!-- Refresh Button -->
        <UButton icon="i-heroicons-arrow-path" color="gray" variant="soft" size="sm" @click="refreshCharts"
          title="Refresh Charts">
          Refresh
        </UButton>
      </div>
    </div>
    <div class="grid gap-6 grid-cols-1">
      <!-- Customer Growth Chart -->
      <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div class="mb-3">
          <h2 class="text-sm sm:text-lg font-medium text-gray-700 text-center sm:text-left">Customer Growth ({{ selectedDateRange }} days)</h2>
        </div>
        <div v-if="filteredCustomerGrowth && filteredCustomerGrowth.length > 0" class="h-80 w-full overflow-hidden">
          <VChart :option="customerGrowthChartOption" autoresize style="height: 100%; width: 100%;" />
        </div>
        <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">No customer growth data available for selected period</p>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div class="mb-3">
          <h2 class="text-sm sm:text-lg font-medium text-gray-700 text-center sm:text-left">Revenue Chart ({{ selectedDateRange }} days)</h2>
        </div>
        <div v-if="filteredRevenueChart && filteredRevenueChart.length > 0" class="h-80 w-full overflow-hidden">
          <VChart :option="revenueChartOption" autoresize style="height: 100%; width: 100%;" />
        </div>
        <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">No revenue data available for selected period</p>
        </div>
      </div>

      <!-- Expenses Chart -->
      <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div class="mb-3">
          <h2 class="text-sm sm:text-lg font-medium text-gray-700 text-center sm:text-left">Expenses Chart ({{ selectedDateRange }} days)</h2>
        </div>
        <div v-if="filteredExpensesChart && filteredExpensesChart.length > 0" class="h-80 w-full overflow-hidden">
          <VChart :option="expensesChartOption" autoresize style="height: 100%; width: 100%;" />
        </div>
        <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">No expenses data available for selected period</p>
        </div>
      </div>

      <!-- Unpaid Customers Chart -->
      <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div class="mb-3">
          <h2 class="text-sm sm:text-lg font-medium text-gray-700 text-center sm:text-left">Unpaid Customers ({{ selectedDateRange }} days)</h2>
        </div>
        <div v-if="filteredUnpaidCustomersChart && filteredUnpaidCustomersChart.length > 0" class="h-80 w-full overflow-hidden">
          <VChart :option="unpaidCustomersChartOption" autoresize style="height: 100%; width: 100%;" />
        </div>
        <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">No unpaid customers data available for selected period</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Accumulation Edit Modal -->
  <div v-if="showAccumulationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeAccumulationModal">
    <div class="bg-white rounded-lg p-6 w-96 max-w-md mx-4" @click.stop>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Edit Accumulation</h3>
        <button @click="closeAccumulationModal" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div v-if="selectedTicket" class="mb-4">
        <p class="text-sm text-gray-600 mb-2">
          <strong>Ticket #{{ selectedTicket.id }}:</strong> {{ selectedTicket.title }}
        </p>
        <p class="text-sm text-gray-500 mb-4">
          Current: {{ formatAccumulation(selectedTicket.accumulation || 1) }}
        </p>
        
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Enter new accumulation:
        </label>
        <input 
          v-model="newAccumulationValue" 
          type="number" 
          min="1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter number of customers"
          @keyup.enter="saveAccumulation"
        />
      </div>
      
      <div class="flex justify-end space-x-3">
        <button 
          @click="closeAccumulationModal"
          class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button 
          @click="saveAccumulation"
          class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  </div>

  <!-- Removed logout confirmation modal -->
</template>
