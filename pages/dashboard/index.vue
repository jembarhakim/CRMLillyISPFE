<script setup lang="ts">
import { onUnmounted, ref, watch, onMounted, computed } from 'vue';
import { dashboardAdminApi } from "@/api/admin/dashboard";
import { invoiceAdminApi } from "@/api/admin/invoice";
import { ticketsApi } from "@/api/tickets";
import { formatIDR } from "@/helper/currency";
import { formatDateToYMD } from "@/helper/date";
import { useNotification } from "@/composables/useNotification";
import { useLoading } from '@/composables/useLoading'
import { transactionAdminApi } from "@/api/admin/transaction";

const notification = useNotification();

// Apply auth middleware and layout
definePageMeta({
  middleware: 'auth',
  layout: false,
  ssr: false  // Disable SSR to prevent Icon component infinite recursion
})

// Set page title
// @ts-expect-error - Nuxt auto-imports
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
const unpaidCustomersList = ref<any[]>([]);

// Modal state for accumulation editing
const showAccumulationModal = ref(false);
const selectedTicket = ref<any>(null);
const newAccumulationValue = ref<string>('');

// Filter variables
const selectedDateRange = ref<number>(0); // 0 = All time by default
const filterType = ref<string>('all-time'); // 'all-time', 'monthly', 'yearly', 'custom'
const selectedMonth = ref<number | null>(null);
const selectedYear = ref<number | null>(null);
const customDateFrom = ref<string>('');
const customDateTo = ref<string>('');

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

// Available months for monthly filter
const availableMonths = computed(() => {
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  return months;
});

// Helper function to filter data by date range
const filterDataByDateRange = (data: any[], dateAccessor: (item: any) => string) => {
  if (!data || data.length === 0) return [];

  const filterItem = (item: any) => {
    const itemDate = new Date(dateAccessor(item));
    if (isNaN(itemDate.getTime())) return false;

    switch (filterType.value) {
      case 'all-time':
        return true;

      case 'monthly':
        if (selectedYear.value === null || selectedMonth.value === null) return false;
        return itemDate.getFullYear() === selectedYear.value &&
          itemDate.getMonth() + 1 === selectedMonth.value;

      case 'yearly':
        if (selectedYear.value === null) return false;
        return itemDate.getFullYear() === selectedYear.value;

      case 'custom':
        if (!customDateFrom.value || !customDateTo.value) return false;
        const fromDate = new Date(customDateFrom.value);
        const toDate = new Date(customDateTo.value);
        return itemDate >= fromDate && itemDate <= toDate;

      case 'range':
        // Legacy day-based range
        const days = Number(selectedDateRange.value || 0);
        if (days <= 0) return true;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return itemDate >= cutoffDate;

      default:
        return true;
    }
  };

  return data.filter(filterItem);
};

// Computed properties for filtered data
const filteredCustomerGrowth = computed(() => {
  if (!customerGrowth.value.customer_growth) return [];
  if (useYearRange.value && yearStart.value !== null && yearEnd.value !== null) {
    const start = Math.min(yearStart.value, yearEnd.value);
    const end = Math.max(yearStart.value, yearEnd.value);
    return customerGrowth.value.customer_growth.filter((item: any) => {
      const yr = new Date(item.date).getFullYear();
      return yr >= start && yr <= end;
    });
  }
  return filterDataByDateRange(customerGrowth.value.customer_growth, (item: any) => item.date);
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
  return filterDataByDateRange(revenueChart.value.revenue_chart, (item: any) => item.date);
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
  return filterDataByDateRange(expensesChart.value.expenses_chart, (item: any) => item.date);
});

const filteredUnpaidCustomersChart = computed(() => {
  if (!unpaidCustomersChart.value.unpaid_customers_chart) return { unpaid: [], pending: [] };

  const chartData = unpaidCustomersChart.value.unpaid_customers_chart;
  const unpaidData = chartData.unpaid || [];
  const pendingData = chartData.pending || [];

  const filterData = (data: any[]) => {
    if (useYearRange.value && yearStart.value !== null && yearEnd.value !== null) {
      const start = Math.min(yearStart.value, yearEnd.value);
      const end = Math.max(yearStart.value, yearEnd.value);
      return data.filter((item: any) => {
        const yr = new Date(item.date).getFullYear();
        return yr >= start && yr <= end;
      });
    }
    return filterDataByDateRange(data, (item: any) => item.date);
  };

  return {
    unpaid: filterData(unpaidData),
    pending: filterData(pendingData)
  };
});

// Chart options computed properties
const customerGrowthChartOption = computed(() => {
  if (!filteredCustomerGrowth.value || filteredCustomerGrowth.value.length === 0) {
    return undefined;
  }
  return {
    animation: true,
    animationDuration: 750,
    animationEasing: 'cubicOut' as const,
    title: { text: 'Customer Growth', textStyle: { fontSize: 12 }, left: 'center' },
    axisPointer: {
      type: 'cross',
      crossStyle: { color: '#999', width: 1, type: 'dashed' },
      lineStyle: { color: '#999', width: 1, type: 'dashed' },
      label: { backgroundColor: '#777', color: '#fff', fontSize: 10 }
    },
    tooltip: { trigger: 'axis', formatter: '{b}: {c} new customers' },
    toolbox: {
      show: true,
      orient: 'vertical',
      right: 10,
      top: 10,
      feature: {
        dataZoom: { yAxisIndex: 'none', show: true, title: { zoom: 'Area Zoom', back: 'Restore Zoom' } },
        restore: { show: true, title: 'Reset Zoom' },
        saveAsImage: { show: true, title: 'Save as Image', type: 'png', pixelRatio: 2 },
        brush: { show: true, type: ['lineX', 'clear'], title: { lineX: 'Brush Selection', clear: 'Clear Selection' } }
      }
    },
    xAxis: { data: filteredCustomerGrowth.value.map((item: any) => item.date), type: 'category', axisLabel: { rotate: 45, fontSize: 8, interval: 'auto' } },
    yAxis: { type: 'value', axisLabel: { fontSize: 8 } },
    series: [{
      name: 'New Customers', type: 'line', data: filteredCustomerGrowth.value.map((item: any) => item.count), smooth: true, sampling: 'lttb',
      itemStyle: { color: '#3B82F6' }, lineStyle: { color: '#3B82F6', width: 2 }, emphasis: { focus: 'series', blurScope: 'coordinateSystem' }
    }],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0], yAxisIndex: 'none', throttle: 100, zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: false, preventDefaultMouseMove: false },
      { type: 'slider', xAxisIndex: [0], height: 25, bottom: 10, showDetail: true, showDataShadow: true, realtime: true, filterMode: 'filter', handleStyle: { color: '#3B82F6' }, dataBackground: { lineStyle: { color: '#3B82F6', opacity: 0.3 }, areaStyle: { color: '#3B82F6', opacity: 0.1 } }, selectedDataBackground: { lineStyle: { color: '#3B82F6', opacity: 0.8 }, areaStyle: { color: '#3B82F6', opacity: 0.3 } } }
    ],
    grid: { left: '15%', right: '10%', bottom: '25%', top: '20%', containLabel: true }
  }
});

const expensesChartOption = computed(() => ({
  title: { text: 'Daily Expenses', textStyle: { fontSize: 12 }, left: 'center' },
  axisPointer: { type: 'cross', crossStyle: { color: '#999', width: 1, type: 'dashed' }, lineStyle: { color: '#999', width: 1, type: 'dashed' }, label: { backgroundColor: '#777', color: '#fff', fontSize: 10 } },
  tooltip: { trigger: 'axis', formatter: (params: any) => { const p = Array.isArray(params) ? params[0] : params; return `${p.axisValue}: ${formatIDR(Number(p.data) || 0)}` } },
  toolbox: { show: true, orient: 'vertical', right: 10, top: 10, feature: { dataZoom: { yAxisIndex: 'none', show: true, title: { zoom: 'Area Zoom', back: 'Restore Zoom' } }, restore: { show: true, title: 'Reset Zoom' }, saveAsImage: { show: true, title: 'Save as Image', type: 'png', pixelRatio: 2 }, brush: { show: true, type: ['lineX', 'clear'], title: { lineX: 'Brush Selection', clear: 'Clear Selection' } } } },
  xAxis: { data: filteredExpensesChart.value.map((item: any) => item.date), type: 'category', axisLabel: { rotate: 45, fontSize: 8, interval: 'auto' } },
  yAxis: { type: 'value', axisLabel: { fontSize: 8, formatter: (value: number) => formatIDR(Number(value) || 0) } },
  series: [{ name: 'Expenses', type: 'line', data: filteredExpensesChart.value.map((item: any) => item.amount), smooth: true, sampling: 'lttb', itemStyle: { color: '#EF4444' }, lineStyle: { color: '#EF4444', width: 2 }, emphasis: { focus: 'series', blurScope: 'coordinateSystem' } }],
  dataZoom: [
    { type: 'inside', xAxisIndex: [0], yAxisIndex: 'none', throttle: 100, zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: false, preventDefaultMouseMove: false },
    { type: 'slider', xAxisIndex: [0], height: 25, bottom: 10, showDetail: true, showDataShadow: true, realtime: true, filterMode: 'filter', handleStyle: { color: '#3B82F6' }, dataBackground: { lineStyle: { color: '#3B82F6', opacity: 0.3 }, areaStyle: { color: '#3B82F6', opacity: 0.1 } }, selectedDataBackground: { lineStyle: { color: '#3B82F6', opacity: 0.8 }, areaStyle: { color: '#3B82F6', opacity: 0.3 } } }
  ],
  grid: { left: '15%', right: '10%', bottom: '25%', top: '20%', containLabel: true }
}));

const revenueChartOption = computed(() => ({
  title: { text: 'Daily Revenue', textStyle: { fontSize: 12 }, left: 'center' },
  axisPointer: { type: 'cross', crossStyle: { color: '#999', width: 1, type: 'dashed' }, lineStyle: { color: '#999', width: 1, type: 'dashed' }, label: { backgroundColor: '#777', color: '#fff', fontSize: 10 } },
  tooltip: { trigger: 'axis', formatter: (params: any) => { const p = Array.isArray(params) ? params[0] : params; return `${p.axisValue}: ${formatIDR(Number(p.data) || 0)}` } },
  toolbox: { show: true, orient: 'vertical', right: 10, top: 10, feature: { dataZoom: { yAxisIndex: 'none', show: true, title: { zoom: 'Area Zoom', back: 'Restore Zoom' } }, restore: { show: true, title: 'Reset Zoom' }, saveAsImage: { show: true, title: 'Save as Image', type: 'png', pixelRatio: 2 }, brush: { show: true, type: ['lineX', 'clear'], title: { lineX: 'Brush Selection', clear: 'Clear Selection' } } } },
  xAxis: { data: filteredRevenueChart.value.map((item: any) => item.date), type: 'category', axisLabel: { rotate: 45, fontSize: 8, interval: 'auto' } },
  yAxis: { type: 'value', axisLabel: { fontSize: 8, formatter: (value: number) => formatIDR(Number(value) || 0) } },
  series: [{ name: 'Revenue', type: 'line', data: filteredRevenueChart.value.map((item: any) => item.amount), smooth: true, sampling: 'lttb', itemStyle: { color: '#10B981' }, lineStyle: { color: '#10B981', width: 2 }, emphasis: { focus: 'series', blurScope: 'coordinateSystem' } }],
  dataZoom: [
    { type: 'inside', xAxisIndex: [0], yAxisIndex: 'none', throttle: 100, zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: false, preventDefaultMouseMove: false },
    { type: 'slider', xAxisIndex: [0], height: 25, bottom: 10, showDetail: true, showDataShadow: true, realtime: true, filterMode: 'filter', handleStyle: { color: '#3B82F6' }, dataBackground: { lineStyle: { color: '#3B82F6', opacity: 0.3 }, areaStyle: { color: '#3B82F6', opacity: 0.1 } }, selectedDataBackground: { lineStyle: { color: '#3B82F6', opacity: 0.8 }, areaStyle: { color: '#3B82F6', opacity: 0.3 } } }
  ],
  grid: { left: '15%', right: '10%', bottom: '25%', top: '20%', containLabel: true }
}));

const unpaidCustomersChartOption = computed(() => {
  const unpaidData = filteredUnpaidCustomersChart.value.unpaid || [];
  const pendingData = filteredUnpaidCustomersChart.value.pending || [];
  const allDates = new Set([...unpaidData.map((item: any) => item.date), ...pendingData.map((item: any) => item.date)]);
  const sortedDates = Array.from(allDates).sort();
  const unpaidMap = new Map(unpaidData.map((item: any) => [item.date, item.count]));
  const pendingMap = new Map(pendingData.map((item: any) => [item.date, item.count]));
  const hasSparseData = sortedDates.length <= 3;
  const useSmooth = !hasSparseData && sortedDates.length > 5;

  return {
    title: { text: 'Unpaid & Pending Customers', subtext: hasSparseData ? `Showing ${sortedDates.length} data point${sortedDates.length > 1 ? 's' : ''} in selected period` : undefined, textStyle: { fontSize: 12 }, subtextStyle: { fontSize: 10, color: '#666' }, left: 'center' },
    axisPointer: { type: 'cross', crossStyle: { color: '#999', width: 1, type: 'dashed' }, lineStyle: { color: '#999', width: 1, type: 'dashed' }, label: { backgroundColor: '#777', color: '#fff', fontSize: 10 } },
    tooltip: { trigger: 'axis', formatter: function (params: any) { const date = new Date(params[0].name); const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); let result = `<strong>${formattedDate}</strong><br/>`; params.forEach((param: any) => { const value = param.value; const color = param.color; result += `<span style="color: ${color};">●</span> ${param.seriesName}: <strong>${value}</strong> ${value === 1 ? 'customer' : 'customers'}<br/>`; }); if (hasSparseData) { result += '<br/><span style="font-size: 10px; color: #999;">Note: Limited data points in selected period</span>'; } return result; } },
    legend: { data: ['Unpaid Customers', 'Pending Customers'], top: 30 },
    toolbox: { feature: { dataZoom: { yAxisIndex: 'none', title: { zoom: 'Area Zoom', back: 'Restore Zoom' } }, restore: { title: 'Reset Zoom' }, saveAsImage: { title: 'Save as Image' }, brush: { type: ['lineX', 'clear'], title: { lineX: 'Brush Selection', clear: 'Clear Selection' } } }, right: 10, top: 10 },
    brush: { toolbox: ['lineX', 'clear'], xAxisIndex: 0 },
    xAxis: { data: sortedDates, type: 'category', axisLabel: { rotate: 45, fontSize: 8, interval: hasSparseData ? 0 : 'auto', formatter: (value: string) => { const date = new Date(value); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } }, boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { fontSize: 8, formatter: (value: number) => { if (value % 1 === 0) return value.toString(); return value.toFixed(1); } }, min: 0, scale: !hasSparseData },
    series: [
      { name: 'Unpaid Customers', type: 'line', data: sortedDates.map(date => unpaidMap.get(date) || 0), smooth: useSmooth, sampling: useSmooth ? 'lttb' : false, symbol: 'circle', symbolSize: hasSparseData ? 8 : 4, itemStyle: { color: '#EF4444' }, lineStyle: { color: '#EF4444', width: 2 }, emphasis: { focus: 'series', blurScope: 'coordinateSystem' } },
      { name: 'Pending Customers', type: 'line', data: sortedDates.map(date => pendingMap.get(date) || 0), smooth: useSmooth, sampling: useSmooth ? 'lttb' : false, symbol: 'circle', symbolSize: hasSparseData ? 8 : 4, itemStyle: { color: '#F59E0B' }, lineStyle: { color: '#F59E0B', width: 2 }, emphasis: { focus: 'series', blurScope: 'coordinateSystem' } }
    ],
    dataZoom: [
      { type: 'inside', throttle: 30, zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: false, preventDefaultMouseMove: true },
      { type: 'slider', height: 20, bottom: 0, showDetail: true, showDataShadow: true, realtime: true, filterMode: 'filter' }
    ],
    grid: { left: '15%', right: '10%', bottom: '22%', top: '20%', containLabel: true }
  };
});

const optionCardCustomer = ref();
const optionCardPacketPopular = ref();
const optionCardArea = ref();
const optionCardReportCash = ref();

const data = ref<{ y: number[]; x: string[]; label: string }[]>([]);
let cards = ref<{ name: string; total: number }[]>([]);
const CardList = [
  { name: "Customer", total: 0 },
  { name: "Packet Popular", total: 0 },
  { name: "Area", total: 0 },
  { name: "Report Cash", total: 0 },
];

for (const card of CardList) {
  const option = {
    title: { text: '' },
    tooltip: {},
    legend: { show: true, top: '5%' },
    xAxis: { data: [], },
    yAxis: {},
    series: [
      { name: '', type: '', smooth: true, label: { show: true }, data: [] }
    ]
  }
  if (card.name === "Customer") {
    try {
      const response = await dashboardAdminApi().cardCustomerDashboard();
      const graph = response.data.graph_customer || [];
      (option.title as any).text = card.name;
      if (Array.isArray(option.series) && option.series[0]) {
        (option.series[0] as any).data = graph.map((item: any) => item.count);
        (option.series[0] as any).name = card.name;
        (option.series[0] as any).type = "line";
      }
      (option.xAxis as any).data = graph.map((item: any) => {
        const date = new Date(item.date); return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      });
      optionCardCustomer.value = option;
    } catch (err: any) {
      notification.error('Load Error', err.message || "Failed to load customer data", 3000);
    }
  }

  if (card.name === "Packet Popular") {
    try {
      const response = await dashboardAdminApi().cardPacketPopularDashboard();
      const graph = response.data.graph_packet_popular || [];
      (option.title as any).text = card.name;
      if (Array.isArray(option.series) && option.series[0]) {
        (option.series[0] as any).data = graph.map((item: any) => item.count);
        (option.series[0] as any).name = card.name;
        (option.series[0] as any).type = "bar";
      }
      (option.xAxis as any).data = graph.map((item: any) => { return item.name; });
      optionCardPacketPopular.value = option;
    } catch (err: any) {
      notification.error('Load Error', err.message || "Failed to load customer data", 3000);
    }
  }

  if (card.name === "Area") {
    try {
      const response = await dashboardAdminApi().cardAreaPopularDashboard();
      const graph = response.data.graph_area_popular || [];
      (option.title as any).text = card.name;
      if (Array.isArray(option.series) && option.series[0]) {
        (option.series[0] as any).data = graph.map((item: any) => item.count);
        (option.series[0] as any).name = card.name;
        (option.series[0] as any).type = "bar";
      }
      (option.xAxis as any).data = graph.map((item: any) => { return item.name_city + " - " + item.name_subdistrict + " - " + item.name_village; });
      optionCardArea.value = option;
    } catch (err: any) {
      notification.error('Load Error', err.message || "Failed to load customer data", 3000);
    }
  }

  if (card.name === "Report Cash") {
    try {
      const response = await dashboardAdminApi().cardReportCashDashboard();
      const graph = response.data.graph_report_cash || [];
      (option.title as any).text = card.name;
      if (Array.isArray(option.series) && option.series[0]) {
        (option.series[0] as any).data = graph.map((item: any) => item.count);
        (option.series[0] as any).name = card.name;
        (option.series[0] as any).type = "bar";
      }
      (option.xAxis as any).data = graph.map((item: any) => {
        const date = new Date(item.date); return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      });
      optionCardReportCash.value = option;
    } catch (err: any) {
      notification.error('Load Error', err.message || "Failed to load customer data", 3000);
    }
  }
}

const columns = [
  { key: "number", label: "Number" },
  { key: "customer.name", label: "Name" },
  { key: "created_at", label: "Date" },
  { key: "amount", label: "amount" },
  { key: "status", label: "Status" },
  { key: "product_name", label: "Plan" },
];

async function getData() {
  invoiceAdminApi().getAllInvoices().then((response) => {
    response.data.forEach((customer: any) => { customer.number = response.data.indexOf(customer) + 1; });
    invoices.value = [...response.data];
  }).catch((err) => {
    if (err?.status !== 401) { notification.error('Error', err?.message || 'Failed to load invoices', 3000); }
  });

  transactionAdminApi().getAllTransactions(null).then((response) => {
    latestDeposites.value = response.data.filter((item: any) => item.type_in_out == "debit").map((transaction: any, index: number) => {
      return { number: index + 1, type_cash: transaction.type_cash.split("_")[0] + " " + (transaction.type_cash.split("_")[1] ? transaction.type_cash.split("_")[1] : ""), amount: transaction.amount, description: transaction.description }
    }).slice((1 - 1) * 5, (1) * 5);
    latestExpenses.value = response.data.filter((item: any) => item.type_in_out == "credit").map((transaction: any, index: number) => {
      return { number: index + 1, type_cash: transaction.type_cash.split("_")[0] + " " + (transaction.type_cash.split("_")[1] ? transaction.type_cash.split("_")[1] : ""), amount: transaction.amount, description: transaction.description }
    }).slice((1 - 1) * 5, (1) * 5);
  }).catch((err) => {
    if (err?.status !== 401) { notification.error('Error', err?.message || 'Failed to load transactions', 3000); }
  });

  dashboardAdminApi().totalIncomeDashboard().then((response) => { totalIncome.value = response.data.total_income; }).catch((err) => { if (err?.status !== 401) { notification.error('Error', err?.message || 'Failed to load total income', 3000); } });
  dashboardAdminApi().totalExpensesDashboard().then((response) => { totalExpenses.value = response.data.total_expenses; }).catch((err) => { if (err?.status !== 401) { notification.error('Error', err?.message || 'Failed to load total expenses', 3000); } });
  dashboardAdminApi().totalNetWorthDashboard().then((response) => { totalNetWorth.value = response.data.total_net_worth; }).catch((err) => { if (err?.status !== 401) { notification.error('Error', err?.message || 'Failed to load net worth', 3000); } });
  dashboardAdminApi().totalSalesDashboard().then((response) => { totalSales.value = response.data.total_sales; }).catch((err) => { if (err?.status !== 401) { notification.error('Error', err?.message || 'Failed to load total sales', 3000); } });
}
getData();

const { show, hide } = useLoading()

// Function to get new dashboard data with optional filter parameters
const getNewDashboardData = async (filterParams: any = {}) => {
  try {
    const statsResponse = await dashboardAdminApi().getDashboardStats(filterParams);
    dashboardStats.value = statsResponse.data;

    try {
      const invoicesResponse = await dashboardAdminApi().getRecentInvoices();
      recentInvoices.value = invoicesResponse.data.invoices || [];
    } catch (invoiceError) {
      if (invoices.value && invoices.value.length > 0) {
        recentInvoices.value = invoices.value.slice(0, 5).map((invoice: any) => ({
          id: invoice.id, invoice_no: invoice.id, amount: invoice.amount, status: invoice.status, customer: invoice.customer?.name || 'Unknown Customer', created_at: invoice.created_at
        }));
      }
    }

    try {
      const transactionsResponse = await dashboardAdminApi().getRecentTransactions();
      recentTransactions.value = transactionsResponse.data.transactions || [];
    } catch (transactionError) {
      if (latestDeposites.value && latestDeposites.value.length > 0) {
        recentTransactions.value = [
          ...latestDeposites.value.slice(0, 3).map((deposit: any) => ({ id: deposit.number, amount: deposit.amount, type_in_out: 'debit', description: deposit.description, date: new Date().toISOString() })),
          ...latestExpenses.value.slice(0, 2).map((expense: any) => ({ id: expense.number, amount: expense.amount, type_in_out: 'credit', description: expense.description, date: new Date().toISOString() }))
        ];
      }
    }

    const growthResponse = await dashboardAdminApi().getCustomerGrowth();
    customerGrowth.value = growthResponse.data;
    const revenueResponse = await dashboardAdminApi().getRevenueChart();
    revenueChart.value = revenueResponse.data;
    const expensesResponse = await dashboardAdminApi().getExpensesChart();
    expensesChart.value = expensesResponse.data;
    const unpaidResponse = await dashboardAdminApi().getUnpaidCustomersChart();
    unpaidCustomersChart.value = unpaidResponse.data;
    const unpaidListResponse = await dashboardAdminApi().getUnpaidCustomersList();
    unpaidCustomersList.value = unpaidListResponse.data.unpaid_customers || [];
  } catch (error) {
    notification.error('Dashboard Error', 'Failed to load dashboard data', 3000);
  }
};

const getRecentTickets = async (filterParams: any = {}) => {
  try {
    try {
      const tt: any = await ticketsApi().troubleTypes();
      const arr = (tt as any)?.data || tt || [];
      const map: Record<string, string> = {};
      for (const t of arr) if (t?.id) map[t.id] = t.name || t.id;
      troubleTypeMap.value = map;
    } catch { }

    const response = await ticketsApi().list();
    recentTickets.value = (response as any)?.data || response || [];
  } catch (error: any) {
    if (error?.status !== 401) { notification.error('Error', error?.message || 'Failed to load recent tickets', 3000); }
    recentTickets.value = [];
  }
}

function formatAccumulation(accumulation: number): string {
  if (accumulation === 1) { return '1 customer' } else if (accumulation < 1000) { return `${accumulation} customers` } else if (accumulation < 1000000) { return `${(accumulation / 1000).toFixed(1)}K customers` } else { return `${(accumulation / 1000000).toFixed(1)}M customers` }
}

function editTicketAccumulation(ticket: any) {
  selectedTicket.value = ticket
  newAccumulationValue.value = (ticket.accumulation || 1).toString()
  showAccumulationModal.value = true
}

async function saveAccumulation() {
  if (!selectedTicket.value) return
  const accumulation = parseInt(newAccumulationValue.value)
  if (isNaN(accumulation) || accumulation < 1) { notification.error('Invalid Input', 'Please enter a valid number greater than 0', 3000); return; }
  try {
    await ticketsApi().updateAccumulation([selectedTicket.value.id], accumulation)
    const ticketIndex = recentTickets.value.findIndex(t => t.id === selectedTicket.value.id)
    if (ticketIndex !== -1) { recentTickets.value[ticketIndex].accumulation = accumulation }
    notification.success('Success', `Accumulation updated to ${accumulation} customers`, 3000)
    closeAccumulationModal()
  } catch (error: any) {
    notification.error('Update failed', `Failed to update accumulation: ${error?.data?.message || error?.message || 'Unknown error'}`, 3000)
  }
}

function closeAccumulationModal() { showAccumulationModal.value = false; selectedTicket.value = null; newAccumulationValue.value = ''; }

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showAccumulationModal.value) { closeAccumulationModal() }
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case '0': event.preventDefault(); resetAllChartZooms(); break;
      case '=': case '+': event.preventDefault(); zoomInAllCharts(); break;
      case '-': event.preventDefault(); zoomOutAllCharts(); break;
    }
  }
}

function resetAllChartZooms() { notification.info('Chart Zoom', 'Use the toolbox buttons on each chart to reset zoom', 2000) }
function zoomInAllCharts() { notification.info('Chart Zoom', 'Use mouse wheel or toolbox buttons to zoom in', 2000) }
function zoomOutAllCharts() { notification.info('Chart Zoom', 'Use mouse wheel or toolbox buttons to zoom out', 2000) }

async function applyDateFilter() {
  if (!useYearRange.value) { yearStart.value = null; yearEnd.value = null; }
  let params: any = {};
  switch (filterType.value) {
    case 'monthly': if (selectedYear.value && selectedMonth.value) { params = { year: selectedYear.value, month: selectedMonth.value }; } break;
    case 'yearly': if (selectedYear.value) { params = { year: selectedYear.value }; } break;
    case 'custom': if (customDateFrom.value && customDateTo.value) { params = { date_from: customDateFrom.value, date_to: customDateTo.value }; } break;
    case 'range': params = { days: Number(selectedDateRange.value) }; break;
    case 'all-time': default: params = { days: 0 }; break;
  }
  if (useYearRange.value && yearStart.value !== null && yearEnd.value !== null) { params = { year_start: Math.min(yearStart.value, yearEnd.value), year_end: Math.max(yearStart.value, yearEnd.value) }; }
  try {
    await getNewDashboardData(params)
    await getRecentTickets(params)
    const growthResponse = await dashboardAdminApi().getCustomerGrowth(params)
    customerGrowth.value = growthResponse.data
    const revenueResponse = await dashboardAdminApi().getRevenueChart(params)
    revenueChart.value = revenueResponse.data
    const expensesResponse = await dashboardAdminApi().getExpensesChart(params)
    expensesChart.value = expensesResponse.data
    const unpaidResponse = await dashboardAdminApi().getUnpaidCustomersChart(params)
    unpaidCustomersChart.value = unpaidResponse.data
  } catch (e) {
    console.error('Failed to refresh charts with params', params, e)
  }
}

function refreshWithCurrentFilters() { applyDateFilter() }

function resetFilters() {
  filterType.value = 'all-time'; selectedMonth.value = null; selectedYear.value = null; customDateFrom.value = ''; customDateTo.value = ''; selectedDateRange.value = 0; useYearRange.value = false; yearStart.value = null; yearEnd.value = null;
  getNewDashboardData(); getRecentTickets();
}

onMounted(async () => {
  show()
  await getNewDashboardData()
  await getRecentTickets()
  hide()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => { document.removeEventListener('keydown', handleKeydown) })
watch([filterType, selectedMonth, selectedYear, customDateFrom, customDateTo], async () => { await applyDateFilter() })
watch([useYearRange, yearStart, yearEnd], async () => { if (useYearRange.value) { await applyDateFilter() } })
</script>

<template>
  <div class="w-full space-y-5 font-['Poppins',sans-serif]">
    <AdminPageHeader
      title="Dashboard Overview"
      description="Pantau performa pendapatan, pertumbuhan pelanggan, dan tiket gangguan secara real-time."
      icon="home"
      eyebrow="Pusat Kendali & Analitik"
    >
      <template #actions>
        <button
          @click="resetFilters"
          title="Reset semua filter ke default dan muat ulang data"
          class="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <LucideIcon name="refresh-cw" :size="15" />
          Muat ulang
        </button>
      </template>
    </AdminPageHeader>

    <!-- ===== 2. STAT CARDS (Gaya Kartu WA Notification + Font Nominal Utuh) ===== -->
    <section aria-label="Ringkasan statistik utama" class="space-y-3">
      <!-- Baris 1: Finansial & Pelanggan -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <!-- Total Income -->
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs sm:text-sm font-medium text-gray-500">Total Income</p>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"></span>
          </div>
          <p
            class="mt-2.5 text-base sm:text-lg xl:text-xl font-bold tracking-tight text-[#111111] break-words leading-snug">
            {{ formatIDR(dashboardStats.total_income || 0) }}
          </p>
        </div>

        <!-- Total Expenses -->
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs sm:text-sm font-medium text-gray-500">Total Expenses</p>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"></span>
          </div>
          <p
            class="mt-2.5 text-base sm:text-lg xl:text-xl font-bold tracking-tight text-[#111111] break-words leading-snug">
            {{ formatIDR(dashboardStats.total_expenses || 0) }}
          </p>
        </div>

        <!-- Net Worth -->
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs sm:text-sm font-medium text-gray-500">Net Worth</p>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"></span>
          </div>
          <p
            class="mt-2.5 text-base sm:text-lg xl:text-xl font-bold tracking-tight text-[#111111] break-words leading-snug">
            {{ formatIDR(dashboardStats.net_worth || 0) }}
          </p>
        </div>

        <!-- Total Customers -->
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs sm:text-sm font-medium text-gray-500">Total Customers</p>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-[#A93133]"></span>
          </div>
          <p class="mt-2.5 text-lg sm:text-xl xl:text-2xl font-bold tracking-tight text-[#111111] leading-snug">
            {{ dashboardStats.total_customers || 0 }}
          </p>
        </div>
      </div>

      <!-- Baris 2: Operasional -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <!-- Total Invoices -->
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs sm:text-sm font-medium text-gray-500">Total Invoices</p>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500"></span>
          </div>
          <p class="mt-2.5 text-lg sm:text-xl xl:text-2xl font-bold tracking-tight text-[#111111] leading-snug">
            {{ dashboardStats.total_invoices || 0 }}
          </p>
        </div>

        <!-- Total Areas -->
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs sm:text-sm font-medium text-gray-500">Total Areas</p>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500"></span>
          </div>
          <p class="mt-2.5 text-lg sm:text-xl xl:text-2xl font-bold tracking-tight text-[#111111] leading-snug">
            {{ dashboardStats.total_areas || 0 }}
          </p>
        </div>

        <!-- Total Products -->
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs sm:text-sm font-medium text-gray-500">Total Products</p>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-500"></span>
          </div>
          <p class="mt-2.5 text-lg sm:text-xl xl:text-2xl font-bold tracking-tight text-[#111111] leading-snug">
            {{ dashboardStats.total_products || 0 }}
          </p>
        </div>

        <!-- Trouble Accumulation -->
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs sm:text-sm font-medium text-gray-500">Trouble Accumulation</p>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500"></span>
          </div>
          <p class="mt-2.5 text-lg sm:text-xl xl:text-2xl font-bold tracking-tight text-[#111111] leading-snug">
            {{ dashboardStats.total_tickets || 0 }}
          </p>
        </div>
      </div>

      <!-- Strip Status Pink (Identik dengan Strip Gateway di WA Notification) -->
      <div
        class="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-xl border border-[#A93133]/15 bg-[#F9EBEB]/60 px-4 py-3 text-xs text-gray-600">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span class="inline-flex items-center gap-2 font-semibold text-gray-800">
            <span class="h-2 w-2 rounded-full bg-[#A93133]"></span>
            Filter Aktif:
            <strong class="text-[#A93133]">
              <template v-if="filterType === 'monthly' && selectedYear && selectedMonth">
                {{availableMonths.find(m => m.value === selectedMonth)?.label}} {{ selectedYear }}
              </template>
              <template v-else-if="filterType === 'yearly' && selectedYear">{{ selectedYear }}</template>
              <template v-else-if="filterType === 'range'">{{ selectedDateRange }} Hari Terakhir</template>
              <template v-else-if="filterType === 'custom' && customDateFrom && customDateTo">{{ customDateFrom }} s/d
                {{ customDateTo }}</template>
              <template v-else-if="useYearRange && yearStart && yearEnd">{{ yearStart }} - {{ yearEnd }}</template>
              <template v-else>Semua Waktu (All Time)</template>
            </strong>
          </span>
          <span>Unpaid/Pending: <strong class="text-gray-800">{{ unpaidCustomersList.length }} pelanggan</strong></span>
          <span>Tiket Terbaru: <strong class="text-gray-800">{{ recentTickets.length }} tiket</strong></span>
        </div>
      </div>
    </section>

    <!-- ===== 3. GLOBAL DASHBOARD FILTERS ===== -->
    <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3.5">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-[#A93133]">Pengaturan Periode</p>
            <h2 class="text-base font-bold text-gray-900">Filter Data Dashboard</h2>
          </div>
          <div class="flex items-center gap-2">
            <button @click="refreshWithCurrentFilters"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[#A93133] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8F2729]">
              <LucideIcon name="refresh-cw" :size="14" />
              Terapkan & Segarkan
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Filter Type Selection -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Tipe Filter</label>
            <select v-model="filterType" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium">
              <option value="all-time">All Time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="range">Range (Days)</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <!-- Monthly Filter -->
          <div v-if="filterType === 'monthly'" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Tahun</label>
            <select v-model.number="selectedYear" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium">
              <option :value="null">Pilih Tahun</option>
              <option v-for="y in availableYears" :key="'my' + y" :value="y">{{ y }}</option>
            </select>
          </div>

          <div v-if="filterType === 'monthly'" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Bulan</label>
            <select v-model.number="selectedMonth" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium">
              <option :value="null">Pilih Bulan</option>
              <option v-for="month in availableMonths" :key="'mm' + month.value" :value="month.value">{{ month.label }}
              </option>
            </select>
          </div>

          <!-- Yearly Filter -->
          <div v-if="filterType === 'yearly'" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Tahun</label>
            <select v-model.number="selectedYear" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium">
              <option :value="null">Pilih Tahun</option>
              <option v-for="y in availableYears" :key="'yy' + y" :value="y">{{ y }}</option>
            </select>
          </div>

          <!-- Range Filter -->
          <div v-if="filterType === 'range'" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Rentang Hari</label>
            <select v-model="selectedDateRange" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option :value="365">Last year</option>
              <option :value="730">Last 2 years</option>
              <option :value="1095">Last 3 years</option>
              <option :value="0">All time</option>
            </select>
          </div>

          <!-- Custom Date Range Filter -->
          <div v-if="filterType === 'custom'" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Dari Tanggal</label>
            <input v-model="customDateFrom" type="date" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium" />
          </div>

          <div v-if="filterType === 'custom'" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Sampai Tanggal</label>
            <input v-model="customDateTo" type="date" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium" />
          </div>
        </div>

        <!-- Advanced Year Range Toggle -->
        <div class="flex items-center gap-2.5 pt-2 border-t border-gray-100">
          <input id="yearRangeToggle" type="checkbox" v-model="useYearRange"
            class="h-4 w-4 rounded border-gray-300 text-[#A93133] focus:ring-[#A93133]" />
          <label for="yearRangeToggle" class="text-xs font-semibold text-gray-700 cursor-pointer">
            Gunakan Rentang Tahun Lanjutan (Override filter di atas)
          </label>
        </div>

        <!-- Year Range Selectors -->
        <div v-if="useYearRange" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Dari Tahun</label>
            <select v-model.number="yearStart" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium">
              <option :value="null">-</option>
              <option v-for="y in availableYears" :key="'ys' + y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-700">Sampai Tahun</label>
            <select v-model.number="yearEnd" @change="applyDateFilter"
              class="px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133] font-medium">
              <option :value="null">-</option>
              <option v-for="y in availableYears" :key="'ye' + y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 4. RINGKASAN GRAFIK (4 VChart Pertama - Tidak Diubah Konfigurasinya) ===== -->
    <div class="grid gap-5 md:grid-cols-2 grid-cols-1">
      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <VChart :option="optionCardCustomer" autoresize style="height: 400px;" />
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <VChart :option="optionCardPacketPopular" autoresize style="height: 400px;" />
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <VChart :option="optionCardArea" autoresize style="height: 400px;" />
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <VChart :option="optionCardReportCash" autoresize style="height: 400px;" />
      </div>
    </div>

    <!-- ===== 5. RECENT INVOICES & TRANSACTIONS (Gaya Card List WA Notification) ===== -->
    <div class="grid gap-5 md:grid-cols-2 grid-cols-1">
      <!-- Recent Invoices -->
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 class="font-bold text-gray-900">Recent Invoices</h2>
            <p class="mt-0.5 text-xs text-gray-500">5 tagihan pelanggan terbaru yang diterbitkan.</p>
          </div>
          <button @click="refreshWithCurrentFilters"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
            <LucideIcon name="refresh-cw" :size="13" />
            Refresh
          </button>
        </div>

        <div v-if="recentInvoices.length > 0" class="divide-y divide-gray-100">
          <div v-for="invoice in recentInvoices.slice(0, 5)" :key="invoice.id"
            class="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-gray-50/70">
            <div class="flex items-start gap-3 min-w-0">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F9EBEB] text-[#A93133] mt-0.5">
                <LucideIcon name="file-text" :size="16" />
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ invoice.invoice_no || invoice.id }}</p>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" :class="{
                    'bg-emerald-50 text-emerald-700': invoice.status === 'paid',
                    'bg-red-50 text-red-700': invoice.status === 'unpaid',
                    'bg-amber-50 text-amber-700': invoice.status === 'pending'
                  }">
                    {{ invoice.status?.toUpperCase() || 'UNKNOWN' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 truncate mt-0.5">{{ invoice.customer || 'Unknown Customer' }}</p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold text-emerald-600">{{ formatIDR(invoice.amount || 0) }}</p>
              <p class="text-[11px] text-gray-400 mt-0.5">{{ formatDateToYMD(invoice.created_at) }}</p>
            </div>
          </div>
        </div>
        <div v-else class="px-5 py-10 text-center text-sm text-gray-500">
          No recent invoices found
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 class="font-bold text-gray-900">Recent Transactions</h2>
            <p class="mt-0.5 text-xs text-gray-500">5 mutasi kas masuk dan keluar terbaru.</p>
          </div>
          <button @click="refreshWithCurrentFilters"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
            <LucideIcon name="refresh-cw" :size="13" />
            Refresh
          </button>
        </div>

        <div v-if="recentTransactions.length > 0" class="divide-y divide-gray-100">
          <div v-for="transaction in recentTransactions.slice(0, 5)" :key="transaction.id"
            class="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-gray-50/70">
            <div class="flex items-start gap-3 min-w-0">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5"
                :class="transaction.type_in_out === 'debit' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#F9EBEB] text-[#A93133]'">
                <LucideIcon :name="transaction.type_in_out === 'debit' ? 'arrow-down-left' : 'arrow-up-right'"
                  :size="16" />
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ transaction.description || 'No Description'
                  }}
                  </p>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" :class="{
                    'bg-emerald-50 text-emerald-700': transaction.type_in_out === 'debit',
                    'bg-red-50 text-red-700': transaction.type_in_out === 'credit'
                  }">
                    {{ transaction.type_in_out?.toUpperCase() || 'UNKNOWN' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 truncate mt-0.5">{{ transaction.category || 'General Transaction' }}</p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold"
                :class="transaction.type_in_out === 'debit' ? 'text-emerald-600' : 'text-red-600'">
                {{ formatIDR(transaction.amount || 0) }}
              </p>
              <p class="text-[11px] text-gray-400 mt-0.5">{{ formatDateToYMD(transaction.date || transaction.created_at)
              }}
              </p>
            </div>
          </div>
        </div>
        <div v-else class="px-5 py-10 text-center text-sm text-gray-500">
          No recent transactions found
        </div>
      </div>
    </div>

    <!-- ===== 6. RECENT TROUBLE TICKETS (Gaya Tabel WA Notification) ===== -->
    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 class="font-bold text-gray-900">Recent Trouble Tickets</h2>
          <p class="mt-0.5 text-xs text-gray-500">Daftar keluhan dan gangguan pelanggan terbaru.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-[#F9EBEB] px-2.5 py-1 text-xs font-semibold text-[#A93133]">
            {{ recentTickets.length }} tiket
          </span>
          <button @click="refreshWithCurrentFilters"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
            <LucideIcon name="refresh-cw" :size="13" />
          </button>
        </div>
      </div>

      <div v-if="recentTickets.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100 text-left text-sm">
          <thead class="bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th class="whitespace-nowrap px-4 py-3 sm:px-5">ID</th>
              <th class="px-4 py-3 sm:px-5">Title</th>
              <th class="whitespace-nowrap px-4 py-3 sm:px-5">Type</th>
              <th class="whitespace-nowrap px-4 py-3 sm:px-5">Status</th>
              <th class="whitespace-nowrap px-4 py-3 sm:px-5">Accumulation</th>
              <th class="whitespace-nowrap px-4 py-3 sm:px-5">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="ticket in recentTickets.slice(0, 10)" :key="ticket.id" class="transition hover:bg-gray-50/70">
              <td class="whitespace-nowrap px-4 py-3.5 font-semibold text-gray-900 sm:px-5">#{{ ticket.id }}</td>
              <td class="max-w-xs truncate px-4 py-3.5 font-medium text-gray-800 sm:px-5">{{ ticket.title }}</td>
              <td class="whitespace-nowrap px-4 py-3.5 text-gray-600 capitalize sm:px-5">
                {{ troubleTypeMap[ticket.type] || ticket.type || 'Other' }}
              </td>
              <td class="whitespace-nowrap px-4 py-3.5 sm:px-5">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="{
                  'bg-red-50 text-red-700': ticket.status === 'unfinished',
                  'bg-amber-50 text-amber-700': ticket.status === 'ongoing',
                  'bg-emerald-50 text-emerald-700': ticket.status === 'finished',
                  'bg-gray-100 text-gray-700': !['unfinished', 'ongoing', 'finished'].includes(ticket.status)
                }">
                  {{ ticket.status }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3.5 sm:px-5">
                <div class="flex items-center gap-2">
                  <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="{
                    'bg-blue-50 text-blue-700': ticket.accumulation === 1,
                    'bg-orange-50 text-orange-700': ticket.accumulation > 1 && ticket.accumulation <= 5,
                    'bg-red-50 text-red-700': ticket.accumulation > 5 && ticket.accumulation <= 50,
                    'bg-red-100 text-red-800': ticket.accumulation > 50 && ticket.accumulation <= 100,
                    'bg-red-200 text-red-900': ticket.accumulation > 100 && ticket.accumulation <= 500,
                    'bg-[#A93133] text-white font-bold': ticket.accumulation > 500
                  }">
                    {{ formatAccumulation(ticket.accumulation || 1) }}
                  </span>
                  <button @click="editTicketAccumulation(ticket)"
                    class="text-xs font-semibold text-[#A93133] hover:underline" title="Edit accumulation">
                    Ubah
                  </button>
                </div>
              </td>
              <td class="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 sm:px-5">
                {{ formatDateToYMD(ticket.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="px-5 py-10 text-center text-sm text-gray-500">
        No recent tickets found
      </div>
    </div>

    <!-- ===== 7. ANALYTICS CHARTS (Tidak Diubah Chart-nya) ===== -->
    <div class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
      <div class="flex flex-wrap justify-between items-center gap-2 border-b border-gray-100 pb-4">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-[#A93133]">Visualisasi Data</p>
          <h2 class="text-lg font-bold text-gray-900">Analytics Charts</h2>
        </div>
        <div class="text-xs text-gray-500">
          Grafik diperbarui otomatis mengikuti filter di atas
        </div>
      </div>

      <!-- Chart Zoom Instructions (Disesuaikan dengan Aksen Pink Lilly ISP) -->
      <div class="rounded-xl border border-[#A93133]/15 bg-[#F9EBEB]/50 p-4">
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#A93133] text-white mt-0.5">
            <LucideIcon name="info" :size="16" />
          </div>
          <div class="flex-1 text-xs text-gray-700 space-y-1">
            <h3 class="font-bold text-gray-900 text-sm">Fitur Interaksi Grafik (TradingView-style)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1">
              <div><strong class="text-gray-900">Mouse Wheel:</strong> Zoom in/out pada grafik</div>
              <div><strong class="text-gray-900">Drag:</strong> Geser grafik saat sedang di-zoom</div>
              <div><strong class="text-gray-900">Toolbox:</strong> Area zoom, reset, simpan gambar</div>
              <div><strong class="text-gray-900">Slider:</strong> Navigasi rentang waktu di bagian bawah</div>
            </div>
            <div class="pt-1 text-[11px] text-[#A93133] font-medium">
              <strong>Pintasan Keyboard:</strong> Ctrl+0 (reset), Ctrl+/- (zoom), Ctrl+Shift+Drag (brush selection)
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 grid-cols-1">
        <!-- Customer Growth Chart -->
        <div class="p-4 bg-white border border-gray-200 rounded-xl shadow-sm" style="overflow: visible;">
          <div class="mb-3">
            <h3 class="text-sm sm:text-base font-bold text-gray-800">Customer Growth</h3>
          </div>
          <div v-if="filteredCustomerGrowth && filteredCustomerGrowth.length > 0" class="h-80 w-full relative"
            style="overflow: visible; padding-right: 60px;">
            <VChart :option="customerGrowthChartOption" autoresize style="height: 100%; width: 100%;" />
            <div class="absolute top-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded z-10">
              Hover to zoom • Drag to pan • Wheel to zoom
            </div>
          </div>
          <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
            <p class="text-sm text-gray-500">No customer growth data available for selected period</p>
          </div>
        </div>

        <!-- Revenue Chart -->
        <div class="p-4 bg-white border border-gray-200 rounded-xl shadow-sm" style="overflow: visible;">
          <div class="mb-3">
            <h3 class="text-sm sm:text-base font-bold text-gray-800">Revenue Chart</h3>
          </div>
          <div v-if="filteredRevenueChart && filteredRevenueChart.length > 0" class="h-80 w-full relative"
            style="overflow: visible; padding-right: 60px;">
            <VChart :option="revenueChartOption" autoresize style="height: 100%; width: 100%;" />
            <div class="absolute top-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded z-10">
              Hover to zoom • Drag to pan • Wheel to zoom
            </div>
          </div>
          <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
            <p class="text-sm text-gray-500">No revenue data available for selected period</p>
          </div>
        </div>

        <!-- Expenses Chart -->
        <div class="p-4 bg-white border border-gray-200 rounded-xl shadow-sm" style="overflow: visible;">
          <div class="mb-3">
            <h3 class="text-sm sm:text-base font-bold text-gray-800">Expenses Chart</h3>
          </div>
          <div v-if="filteredExpensesChart && filteredExpensesChart.length > 0" class="h-80 w-full relative"
            style="overflow: visible; padding-right: 60px;">
            <VChart :option="expensesChartOption" autoresize style="height: 100%; width: 100%;" />
            <div class="absolute top-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded z-10">
              Hover to zoom • Drag to pan • Wheel to zoom
            </div>
          </div>
          <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
            <p class="text-sm text-gray-500">No expenses data available for selected period</p>
          </div>
        </div>

        <!-- Unpaid Customers Chart -->
        <div class="p-4 bg-white border border-gray-200 rounded-xl shadow-sm" style="overflow: visible;">
          <div class="mb-3">
            <h3 class="text-sm sm:text-base font-bold text-gray-800">Unpaid & Pending Customers</h3>
          </div>
          <div
            v-if="(filteredUnpaidCustomersChart.unpaid?.length > 0) || (filteredUnpaidCustomersChart.pending?.length > 0)"
            class="h-80 w-full relative" style="overflow: visible; padding-right: 60px;">
            <VChart :option="unpaidCustomersChartOption" autoresize style="height: 100%; width: 100%;" />
            <div class="absolute top-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded z-10">
              Hover to zoom • Drag to pan • Wheel to zoom
            </div>
          </div>
          <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
            <p class="text-sm text-gray-500">No unpaid customers data available for selected period</p>
          </div>
        </div>
      </div>

      <!-- Unpaid Customers List Section -->
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm mt-6">
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 class="font-bold text-gray-900">Unpaid & Pending Customers</h2>
            <p class="mt-0.5 text-xs text-gray-500">Daftar pelanggan dengan tagihan jatuh tempo atau belum lunas.</p>
          </div>
          <button @click="refreshWithCurrentFilters"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
            <LucideIcon name="refresh-cw" :size="13" />
            Refresh
          </button>
        </div>

        <div v-if="unpaidCustomersList.length > 0" class="divide-y divide-gray-100">
          <div v-for="customer in unpaidCustomersList.slice(0, 10)" :key="customer.id"
            class="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-gray-50/70">
            <div class="flex items-start gap-3 min-w-0">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F9EBEB] text-[#A93133] mt-0.5">
                <LucideIcon name="user-x" :size="16" />
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-semibold text-gray-900 truncate">
                    {{ customer.customer_name || `Unknown Customer` }}
                  </p>
                  <span v-if="customer.status === 'unpaid'"
                    class="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                    UNPAID
                  </span>
                  <span v-else-if="customer.status === 'pending'"
                    class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    PENDING
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">{{ customer.customer_phone || 'No phone' }} · Due: {{
                  formatDateToYMD(customer.due_date) }}</p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold text-[#A93133]">{{ formatIDR(customer.outstanding_amount || 0) }}</p>
              <p class="text-[11px] text-gray-400 mt-0.5">Out of {{ formatIDR(customer.amount || 0) }}</p>
            </div>
          </div>
          <div v-if="unpaidCustomersList.length > 10" class="bg-gray-50/60 py-2.5 text-center">
            <p class="text-xs font-medium text-gray-500">Dan {{ unpaidCustomersList.length - 10 }} pelanggan lainnya...
            </p>
          </div>
        </div>
        <div v-else class="px-5 py-10 text-center text-sm text-gray-500">
          No unpaid or pending customers found
        </div>
      </div>
    </div>

    <!-- ===== 8. ACCUMULATION EDIT MODAL ===== -->
    <div v-if="showAccumulationModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click="closeAccumulationModal">
      <div class="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md shadow-xl" @click.stop>
        <div class="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-[#A93133]">Update Tiket</p>
            <h3 class="text-base font-bold text-gray-900">Edit Accumulation</h3>
          </div>
          <button @click="closeAccumulationModal"
            class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <LucideIcon name="x" :size="18" />
          </button>
        </div>

        <div v-if="selectedTicket" class="mb-5 space-y-3">
          <div class="rounded-xl bg-gray-50 border border-gray-100 p-3.5 text-xs">
            <p class="text-gray-700 font-semibold">Ticket #{{ selectedTicket.id }}: {{ selectedTicket.title }}</p>
            <p class="text-gray-500 mt-1">Current: <strong class="text-gray-800">{{
              formatAccumulation(selectedTicket.accumulation || 1) }}</strong></p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1.5">
              Masukkan jumlah terdampak baru:
            </label>
            <input v-model="newAccumulationValue" type="number" min="1"
              class="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/20 focus:border-[#A93133]"
              placeholder="Enter number of customers" @keyup.enter="saveAccumulation" />
          </div>
        </div>

        <div class="flex justify-end gap-2.5 pt-2">
          <button @click="closeAccumulationModal"
            class="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
            Batal
          </button>
          <button @click="saveAccumulation"
            class="px-4 py-2 text-xs font-semibold text-white bg-[#A93133] hover:bg-[#8F2729] rounded-xl transition shadow-sm">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Transisi mulus untuk kartu/card */
.transition-transform {
  transition: transform 0.3s ease;
}
</style>