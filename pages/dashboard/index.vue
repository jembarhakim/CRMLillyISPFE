<script setup lang="ts">
import { onUnmounted, ref, watch, onMounted, computed } from 'vue';
import { dashboardAdminApi } from "@/api/admin/dashboard";
import { invoiceAdminApi } from "@/api/admin/invoice";
import { ticketsApi } from "@/api/tickets";
import { formatIDR } from "@/helper/currency";
import { formatDateToYMD } from "@/helper/date";
import { useNotification } from "@/composables/useNotification";

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

// Removed logout confirmation modal state

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

  // If year range mode and both years selected, filter by year interval
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
    title: {
      text: 'Customer Growth',
      textStyle: { fontSize: 12 },
      left: 'center'
    },
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999',
        width: 1,
        type: 'dashed'
      },
      lineStyle: {
        color: '#999',
        width: 1,
        type: 'dashed'
      },
      label: {
        backgroundColor: '#777',
        color: '#fff',
        fontSize: 10
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} new customers'
    },
    toolbox: {
      show: true,
      orient: 'vertical',
      right: 10,
      top: 10,
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
          show: true,
          title: {
            zoom: 'Area Zoom',
            back: 'Restore Zoom'
          }
        },
        restore: {
          show: true,
          title: 'Reset Zoom'
        },
        saveAsImage: {
          show: true,
          title: 'Save as Image',
          type: 'png',
          pixelRatio: 2
        },
        brush: {
          show: true,
          type: ['lineX', 'clear'],
          title: {
            lineX: 'Brush Selection',
            clear: 'Clear Selection'
          }
        }
      }
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
      lineStyle: { color: '#3B82F6', width: 2 },
      emphasis: {
        focus: 'series',
        blurScope: 'coordinateSystem'
      }
    }],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        yAxisIndex: 'none',
        throttle: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false,
        preventDefaultMouseMove: false
      },
      {
        type: 'slider',
        xAxisIndex: [0],
        height: 25,
        bottom: 10,
        showDetail: true,
        showDataShadow: true,
        realtime: true,
        filterMode: 'filter',
        handleStyle: {
          color: '#3B82F6'
        },
        dataBackground: {
          lineStyle: {
            color: '#3B82F6',
            opacity: 0.3
          },
          areaStyle: {
            color: '#3B82F6',
            opacity: 0.1
          }
        },
        selectedDataBackground: {
          lineStyle: {
            color: '#3B82F6',
            opacity: 0.8
          },
          areaStyle: {
            color: '#3B82F6',
            opacity: 0.3
          }
        }
      }
    ],
    grid: {
      left: '15%',
      right: '10%',
      bottom: '25%',
      top: '20%',
      containLabel: true
    }
  }
});

const expensesChartOption = computed(() => ({
  title: {
    text: 'Daily Expenses',
    textStyle: { fontSize: 12 },
    left: 'center'
  },
  axisPointer: {
    type: 'cross',
    crossStyle: {
      color: '#999',
      width: 1,
      type: 'dashed'
    },
    lineStyle: {
      color: '#999',
      width: 1,
      type: 'dashed'
    },
    label: {
      backgroundColor: '#777',
      color: '#fff',
      fontSize: 10
    }
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const p = Array.isArray(params) ? params[0] : params;
      return `${p.axisValue}: ${formatIDR(Number(p.data) || 0)}`
    }
  },
  toolbox: {
    show: true,
    orient: 'vertical',
    right: 10,
    top: 10,
    feature: {
      dataZoom: {
        yAxisIndex: 'none',
        show: true,
        title: {
          zoom: 'Area Zoom',
          back: 'Restore Zoom'
        }
      },
      restore: {
        show: true,
        title: 'Reset Zoom'
      },
      saveAsImage: {
        show: true,
        title: 'Save as Image',
        type: 'png',
        pixelRatio: 2
      },
      brush: {
        show: true,
        type: ['lineX', 'clear'],
        title: {
          lineX: 'Brush Selection',
          clear: 'Clear Selection'
        }
      }
    }
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
    lineStyle: { color: '#EF4444', width: 2 },
    emphasis: {
      focus: 'series',
      blurScope: 'coordinateSystem'
    }
  }],
  dataZoom: [
    {
      type: 'inside',
      xAxisIndex: [0],
      yAxisIndex: 'none',
      throttle: 100,
      zoomOnMouseWheel: true,
      moveOnMouseMove: true,
      moveOnMouseWheel: false,
      preventDefaultMouseMove: false
    },
    {
      type: 'slider',
      xAxisIndex: [0],
      height: 25,
      bottom: 10,
      showDetail: true,
      showDataShadow: true,
      realtime: true,
      filterMode: 'filter',
      handleStyle: {
        color: '#3B82F6'
      },
      dataBackground: {
        lineStyle: {
          color: '#3B82F6',
          opacity: 0.3
        },
        areaStyle: {
          color: '#3B82F6',
          opacity: 0.1
        }
      },
      selectedDataBackground: {
        lineStyle: {
          color: '#3B82F6',
          opacity: 0.8
        },
        areaStyle: {
          color: '#3B82F6',
          opacity: 0.3
        }
      }
    }
  ],
  grid: {
    left: '15%',
    right: '10%',
    bottom: '25%',
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
  axisPointer: {
    type: 'cross',
    crossStyle: {
      color: '#999',
      width: 1,
      type: 'dashed'
    },
    lineStyle: {
      color: '#999',
      width: 1,
      type: 'dashed'
    },
    label: {
      backgroundColor: '#777',
      color: '#fff',
      fontSize: 10
    }
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const p = Array.isArray(params) ? params[0] : params;
      return `${p.axisValue}: ${formatIDR(Number(p.data) || 0)}`
    }
  },
  toolbox: {
    show: true,
    orient: 'vertical',
    right: 10,
    top: 10,
    feature: {
      dataZoom: {
        yAxisIndex: 'none',
        show: true,
        title: {
          zoom: 'Area Zoom',
          back: 'Restore Zoom'
        }
      },
      restore: {
        show: true,
        title: 'Reset Zoom'
      },
      saveAsImage: {
        show: true,
        title: 'Save as Image',
        type: 'png',
        pixelRatio: 2
      },
      brush: {
        show: true,
        type: ['lineX', 'clear'],
        title: {
          lineX: 'Brush Selection',
          clear: 'Clear Selection'
        }
      }
    }
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
    lineStyle: { color: '#10B981', width: 2 },
    emphasis: {
      focus: 'series',
      blurScope: 'coordinateSystem'
    }
  }],
  dataZoom: [
    {
      type: 'inside',
      xAxisIndex: [0],
      yAxisIndex: 'none',
      throttle: 100,
      zoomOnMouseWheel: true,
      moveOnMouseMove: true,
      moveOnMouseWheel: false,
      preventDefaultMouseMove: false
    },
    {
      type: 'slider',
      xAxisIndex: [0],
      height: 25,
      bottom: 10,
      showDetail: true,
      showDataShadow: true,
      realtime: true,
      filterMode: 'filter',
      handleStyle: {
        color: '#3B82F6'
      },
      dataBackground: {
        lineStyle: {
          color: '#3B82F6',
          opacity: 0.3
        },
        areaStyle: {
          color: '#3B82F6',
          opacity: 0.1
        }
      },
      selectedDataBackground: {
        lineStyle: {
          color: '#3B82F6',
          opacity: 0.8
        },
        areaStyle: {
          color: '#3B82F6',
          opacity: 0.3
        }
      }
    }
  ],
  grid: {
    left: '15%',
    right: '10%',
    bottom: '25%',
    top: '20%',
    containLabel: true
  }
}));

const unpaidCustomersChartOption = computed(() => {
  const unpaidData = filteredUnpaidCustomersChart.value.unpaid || [];
  const pendingData = filteredUnpaidCustomersChart.value.pending || [];

  // Get all unique dates from both series
  const allDates = new Set([...unpaidData.map((item: any) => item.date), ...pendingData.map((item: any) => item.date)]);
  const sortedDates = Array.from(allDates).sort();

  // Create maps for quick lookup
  const unpaidMap = new Map(unpaidData.map((item: any) => [item.date, item.count]));
  const pendingMap = new Map(pendingData.map((item: any) => [item.date, item.count]));

  // Determine if we have sparse data (few data points)
  const hasSparseData = sortedDates.length <= 3;
  // Disable smooth and sampling for sparse data to avoid weird curves
  const useSmooth = !hasSparseData && sortedDates.length > 5;

  return {
    title: {
      text: 'Unpaid & Pending Customers',
      subtext: hasSparseData ? `Showing ${sortedDates.length} data point${sortedDates.length > 1 ? 's' : ''} in selected period` : undefined,
      textStyle: { fontSize: 12 },
      subtextStyle: { fontSize: 10, color: '#666' },
      left: 'center'
    },
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999',
        width: 1,
        type: 'dashed'
      },
      lineStyle: {
        color: '#999',
        width: 1,
        type: 'dashed'
      },
      label: {
        backgroundColor: '#777',
        color: '#fff',
        fontSize: 10
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        const date = new Date(params[0].name);
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        let result = `<strong>${formattedDate}</strong><br/>`;
        params.forEach((param: any) => {
          const value = param.value;
          const color = param.color;
          result += `<span style="color: ${color};">●</span> ${param.seriesName}: <strong>${value}</strong> ${value === 1 ? 'customer' : 'customers'}<br/>`;
        });
        if (hasSparseData) {
          result += '<br/><span style="font-size: 10px; color: #999;">Note: Limited data points in selected period</span>';
        }
        return result;
      }
    },
    legend: {
      data: ['Unpaid Customers', 'Pending Customers'],
      top: 30
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
          title: {
            zoom: 'Area Zoom',
            back: 'Restore Zoom'
          }
        },
        restore: {
          title: 'Reset Zoom'
        },
        saveAsImage: {
          title: 'Save as Image'
        },
        brush: {
          type: ['lineX', 'clear'],
          title: {
            lineX: 'Brush Selection',
            clear: 'Clear Selection'
          }
        }
      },
      right: 10,
      top: 10
    },
    brush: {
      toolbox: ['lineX', 'clear'],
      xAxisIndex: 0
    },
    xAxis: {
      data: sortedDates,
      type: 'category',
      axisLabel: {
        rotate: 45,
        fontSize: 8,
        interval: hasSparseData ? 0 : 'auto', // Show all labels if sparse data
        formatter: (value: string) => {
          // Format date better for readability
          const date = new Date(value);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      },
      boundaryGap: false // Better for line charts
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 8,
        formatter: (value: number) => {
          // Format numbers properly
          if (value % 1 === 0) return value.toString();
          return value.toFixed(1);
        }
      },
      min: 0, // Always start from 0
      scale: !hasSparseData // Don't scale when sparse to show actual values
    },
    series: [
      {
        name: 'Unpaid Customers',
        type: 'line',
        data: sortedDates.map(date => unpaidMap.get(date) || 0),
        smooth: useSmooth,
        sampling: useSmooth ? 'lttb' : false, // Only use sampling for large datasets
        symbol: 'circle',
        symbolSize: hasSparseData ? 8 : 4, // Larger markers for sparse data
        itemStyle: { color: '#EF4444' },
        lineStyle: { color: '#EF4444', width: 2 },
        emphasis: {
          focus: 'series',
          blurScope: 'coordinateSystem'
        }
      },
      {
        name: 'Pending Customers',
        type: 'line',
        data: sortedDates.map(date => pendingMap.get(date) || 0),
        smooth: useSmooth,
        sampling: useSmooth ? 'lttb' : false, // Only use sampling for large datasets
        symbol: 'circle',
        symbolSize: hasSparseData ? 8 : 4, // Larger markers for sparse data
        itemStyle: { color: '#F59E0B' },
        lineStyle: { color: '#F59E0B', width: 2 },
        emphasis: {
          focus: 'series',
          blurScope: 'coordinateSystem'
        }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        throttle: 30,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false,
        preventDefaultMouseMove: true
      },
      {
        type: 'slider',
        height: 20,
        bottom: 0,
        showDetail: true,
        showDataShadow: true,
        realtime: true,
        filterMode: 'filter'
      }
    ],
    grid: {
      left: '15%',
      right: '10%',
      bottom: '22%',
      top: '20%',
      containLabel: true
    }
  };
});
const optionCardCustomer = ref();
const optionCardPacketPopular = ref();
const optionCardArea = ref();
const optionCardReportCash = ref();



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

// Function to get new dashboard data with optional filter parameters
const getNewDashboardData = async (filterParams: any = {}) => {
  try {
    // Get dashboard stats with filter parameters
    const statsResponse = await dashboardAdminApi().getDashboardStats(filterParams);
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

    // Get unpaid customers list
    const unpaidListResponse = await dashboardAdminApi().getUnpaidCustomersList();
    unpaidCustomersList.value = unpaidListResponse.data.unpaid_customers || [];

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    notification.error('Dashboard Error', 'Failed to load dashboard data', 3000);
  }
};

// Get recent tickets with optional filter parameters
const getRecentTickets = async (filterParams: any = {}) => {
  try {
    // Load trouble type names for display mapping
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

// Handle escape key and chart shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showAccumulationModal.value) {
    closeAccumulationModal()
  }

  // Chart zoom shortcuts (similar to TradingView)
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case '0':
        // Reset all chart zooms
        event.preventDefault()
        resetAllChartZooms()
        break
      case '=':
      case '+':
        // Zoom in all charts
        event.preventDefault()
        zoomInAllCharts()
        break
      case '-':
        // Zoom out all charts
        event.preventDefault()
        zoomOutAllCharts()
        break
    }
  }
}

// Chart zoom control functions
function resetAllChartZooms() {
  // This would need chart instance references to work properly
  // For now, we'll show a notification
  notification.info('Chart Zoom', 'Use the toolbox buttons on each chart to reset zoom', 2000)
}

function zoomInAllCharts() {
  notification.info('Chart Zoom', 'Use mouse wheel or toolbox buttons to zoom in', 2000)
}

function zoomOutAllCharts() {
  notification.info('Chart Zoom', 'Use mouse wheel or toolbox buttons to zoom out', 2000)
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

  // Build params based on filter type
  let params: any = {};

  switch (filterType.value) {
    case 'monthly':
      if (selectedYear.value && selectedMonth.value) {
        params = {
          year: selectedYear.value,
          month: selectedMonth.value
        };
      }
      break;
    case 'yearly':
      if (selectedYear.value) {
        params = { year: selectedYear.value };
      }
      break;
    case 'custom':
      if (customDateFrom.value && customDateTo.value) {
        params = {
          date_from: customDateFrom.value,
          date_to: customDateTo.value
        };
      }
      break;
    case 'range':
      params = { days: Number(selectedDateRange.value) };
      break;
    case 'all-time':
    default:
      params = { days: 0 }; // All time
      break;
  }

  // Override with year range if active
  if (useYearRange.value && yearStart.value !== null && yearEnd.value !== null) {
    params = {
      year_start: Math.min(yearStart.value, yearEnd.value),
      year_end: Math.max(yearStart.value, yearEnd.value)
    };
  }

  try {
    // Refresh dashboard cards with filter parameters
    await getNewDashboardData(params)

    // Refresh recent tickets with filter parameters
    await getRecentTickets(params)

    // Refresh charts with filter parameters
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





// Refresh data with current filter settings
function refreshWithCurrentFilters() {
  // Apply current filter settings and refresh data
  applyDateFilter()
}

// Reset all filters to default and refresh data
function resetFilters() {
  // Reset all filter values to default
  filterType.value = 'all-time'
  selectedMonth.value = null
  selectedYear.value = null
  customDateFrom.value = ''
  customDateTo.value = ''
  selectedDateRange.value = 0
  useYearRange.value = false
  yearStart.value = null
  yearEnd.value = null

  // Refresh data with default settings
  getNewDashboardData()
  getRecentTickets()
}

// Legacy function for backward compatibility
function refreshCharts() {
  // Refresh dashboard cards, tickets, and analytics charts data
  getNewDashboardData()
  getRecentTickets()
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

// React to filter changes immediately
watch([filterType, selectedMonth, selectedYear, customDateFrom, customDateTo], async () => {
  await applyDateFilter()
})

// React to year range changes immediately
watch([useYearRange, yearStart, yearEnd], async () => {
  if (useYearRange.value) {
    await applyDateFilter()
  }
})


</script>

<template>
  <!-- Dashboard Header with Reset Button -->
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
    <UButton icon="undo-2" color="blue" variant="soft" size="sm" @click="resetFilters"
      title="Reset all filters to default and refresh data">
      <template #leading>
        <LucideIcon name="refresh-cw" :size="16" />
      </template>
      Reset
    </UButton>
  </div>

  <!-- Global Dashboard Filters -->
  <div class="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 mb-6">
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">Filter Dashboard Data</h2>
        <div class="text-sm text-gray-500">
          Filters apply to all dashboard cards and charts
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Filter Type Selection -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">Filter Type</label>
          <select v-model="filterType" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="all-time">All Time</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="range">Range (Days)</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        <!-- Monthly Filter -->
        <div v-if="filterType === 'monthly'" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">Year</label>
          <select v-model.number="selectedYear" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option :value="null">Select Year</option>
            <option v-for="y in availableYears" :key="'my' + y" :value="y">{{ y }}</option>
          </select>
        </div>

        <div v-if="filterType === 'monthly'" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">Month</label>
          <select v-model.number="selectedMonth" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option :value="null">Select Month</option>
            <option v-for="month in availableMonths" :key="'mm' + month.value" :value="month.value">{{ month.label }}
            </option>
          </select>
        </div>

        <!-- Yearly Filter -->
        <div v-if="filterType === 'yearly'" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">Year</label>
          <select v-model.number="selectedYear" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option :value="null">Select Year</option>
            <option v-for="y in availableYears" :key="'yy' + y" :value="y">{{ y }}</option>
          </select>
        </div>

        <!-- Range Filter -->
        <div v-if="filterType === 'range'" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">Date Range</label>
          <select v-model="selectedDateRange" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
        <div v-if="filterType === 'custom'" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">From Date</label>
          <input v-model="customDateFrom" type="date" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <div v-if="filterType === 'custom'" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">To Date</label>
          <input v-model="customDateTo" type="date" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <!-- Advanced Year Range Toggle -->
      <div class="flex items-center gap-3 pt-2 border-t border-gray-200">
        <label class="text-sm font-medium text-gray-700">Advanced Year Range:</label>
        <input type="checkbox" v-model="useYearRange"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" title="Filter by start/end year" />
        <span class="text-sm text-gray-500">Override other filters with year range</span>
      </div>

      <!-- Year Range Selectors -->
      <div v-if="useYearRange" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">From Year</label>
          <select v-model.number="yearStart" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option :value="null">-</option>
            <option v-for="y in availableYears" :key="'ys' + y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">To Year</label>
          <select v-model.number="yearEnd" @change="applyDateFilter"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option :value="null">-</option>
            <option v-for="y in availableYears" :key="'ye' + y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>

      <!-- Active Filter Display -->
      <div class="flex items-center justify-between pt-2 border-t border-gray-200">
        <div class="text-sm text-gray-600">
          <span class="font-medium">Active Filter:</span>
          <span v-if="filterType === 'monthly' && selectedYear && selectedMonth" class="text-blue-600">
            {{availableMonths.find(m => m.value === selectedMonth)?.label}} {{ selectedYear }}
          </span>
          <span v-else-if="filterType === 'yearly' && selectedYear" class="text-blue-600">
            {{ selectedYear }}
          </span>
          <span v-else-if="filterType === 'range'" class="text-blue-600">
            Last {{ selectedDateRange }} days
          </span>
          <span v-else-if="filterType === 'custom' && customDateFrom && customDateTo" class="text-blue-600">
            {{ customDateFrom }} to {{ customDateTo }}
          </span>
          <span v-else-if="useYearRange && yearStart && yearEnd" class="text-blue-600">
            {{ yearStart }} - {{ yearEnd }}
          </span>
          <span v-else class="text-gray-500">
            All Time
          </span>
        </div>
        <UButton label="Refresh" color="blue" variant="soft" size="sm" @click="refreshWithCurrentFilters"
          title="Refresh data with current filter settings">
          <template #leading>
            <LucideIcon name="refresh-cw" :size="16" />
          </template>
          Refresh
        </UButton>
      </div>
    </div>
  </div>

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
        <UButton icon="refresh-cw" color="gray" variant="soft" size="sm" @click="refreshWithCurrentFilters"
          title="Refresh Dashboard Data" />
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
        <UButton icon="refresh-cw" color="gray" variant="soft" size="sm" @click="refreshWithCurrentFilters"
          title="Refresh Dashboard Data" />
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
      <UButton icon="refresh-cw" color="gray" variant="soft" size="sm" @click="refreshWithCurrentFilters"
        title="Refresh Dashboard Data" />
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
            <td class="px-4 py-3 text-gray-700 capitalize">{{ troubleTypeMap[ticket.type] || ticket.type || 'Other' }}
            </td>
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
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl font-semibold text-slate-800">Analytics Charts</h1>
      <div class="text-sm text-gray-500">
        Charts automatically update based on dashboard filters above
      </div>
    </div>

    <!-- Chart Zoom Instructions -->
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-blue-800 mb-2">Chart Zoom Features (TradingView-style)</h3>
          <div class="text-sm text-blue-700 space-y-1">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><strong>Mouse Wheel:</strong> Zoom in/out on hover</div>
              <div><strong>Drag:</strong> Pan when zoomed in</div>
              <div><strong>Toolbox:</strong> Area zoom, reset, save image</div>
              <div><strong>Slider:</strong> Navigate time range at bottom</div>
            </div>
            <div class="mt-2 text-xs text-blue-600">
              <strong>Keyboard Shortcuts:</strong> Ctrl+0 (reset), Ctrl+/- (zoom), Ctrl+Shift+Drag (brush selection)
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="grid gap-6 grid-cols-1">
      <!-- Customer Growth Chart -->
      <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm" style="overflow: visible;">
        <div class="mb-3">
          <h2 class="text-sm sm:text-lg font-medium text-gray-700 text-center sm:text-left">
            Customer Growth
          </h2>
        </div>
        <div v-if="filteredCustomerGrowth && filteredCustomerGrowth.length > 0" class="h-80 w-full relative"
          style="overflow: visible; padding-right: 60px;">
          <VChart :option="customerGrowthChartOption" autoresize style="height: 100%; width: 100%;" />
          <div class="absolute top-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded z-10">
            Hover to zoom • Drag to pan • Wheel to zoom
          </div>
        </div>
        <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">No customer growth data available for selected period</p>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm" style="overflow: visible;">
        <div class="mb-3">
          <h2 class="text-sm sm:text-lg font-medium text-gray-700 text-center sm:text-left">
            Revenue Chart
          </h2>
        </div>
        <div v-if="filteredRevenueChart && filteredRevenueChart.length > 0" class="h-80 w-full relative"
          style="overflow: visible; padding-right: 60px;">
          <VChart :option="revenueChartOption" autoresize style="height: 100%; width: 100%;" />
          <div class="absolute top-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded z-10">
            Hover to zoom • Drag to pan • Wheel to zoom
          </div>
        </div>
        <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">No revenue data available for selected period</p>
        </div>
      </div>

      <!-- Expenses Chart -->
      <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm" style="overflow: visible;">
        <div class="mb-3">
          <h2 class="text-sm sm:text-lg font-medium text-gray-700 text-center sm:text-left">
            Expenses Chart
          </h2>
        </div>
        <div v-if="filteredExpensesChart && filteredExpensesChart.length > 0" class="h-80 w-full relative"
          style="overflow: visible; padding-right: 60px;">
          <VChart :option="expensesChartOption" autoresize style="height: 100%; width: 100%;" />
          <div class="absolute top-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded z-10">
            Hover to zoom • Drag to pan • Wheel to zoom
          </div>
        </div>
        <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">No expenses data available for selected period</p>
        </div>
      </div>

      <!-- Unpaid Customers Chart -->
      <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm" style="overflow: visible;">
        <div class="mb-3">
          <h2 class="text-sm sm:text-lg font-medium text-gray-700 text-center sm:text-left">
            Unpaid & Pending Customers
          </h2>
        </div>
        <div
          v-if="(filteredUnpaidCustomersChart.unpaid?.length > 0) || (filteredUnpaidCustomersChart.pending?.length > 0)"
          class="h-80 w-full relative" style="overflow: visible; padding-right: 60px;">
          <VChart :option="unpaidCustomersChartOption" autoresize style="height: 100%; width: 100%;" />
          <div class="absolute top-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded z-10">
            Hover to zoom • Drag to pan • Wheel to zoom
          </div>
        </div>
        <div v-else class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">No unpaid customers data available for selected period</p>
        </div>
      </div>
    </div>

    <!-- Unpaid Customers List Section -->
    <div class="grid gap-6 md:grid-cols-1 sm:grid-cols-1 mb-10">
      <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-xl font-semibold text-slate-800">Unpaid & Pending Customers</h1>
          <UButton icon="refresh-cw" color="gray" variant="soft" size="sm" @click="refreshWithCurrentFilters"
            title="Refresh Dashboard Data" />
        </div>
        <div v-if="unpaidCustomersList.length > 0" class="space-y-3">
          <div v-for="customer in unpaidCustomersList.slice(0, 10)" :key="customer.id"
            class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="font-medium text-gray-900">{{ customer.customer_name || 'Unknown Customer' }}</p>
                <span v-if="customer.status === 'unpaid'"
                  class="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                  UNPAID
                </span>
                <span v-else-if="customer.status === 'pending'"
                  class="px-2 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-800">
                  PENDING
                </span>
              </div>
              <p class="text-sm text-gray-600">{{ customer.customer_phone || 'No phone' }}</p>
              <p class="text-xs text-gray-500">Due: {{ formatDateToYMD(customer.due_date) }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-red-600">{{ formatIDR(customer.outstanding_amount || 0) }}</p>
              <p class="text-xs text-gray-500">Out of {{ formatIDR(customer.amount || 0) }}</p>
            </div>
          </div>
          <div v-if="unpaidCustomersList.length > 10" class="text-center py-2">
            <p class="text-sm text-gray-500">And {{ unpaidCustomersList.length - 10 }} more customers...</p>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <p>No unpaid or pending customers found</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Accumulation Edit Modal -->
  <div v-if="showAccumulationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeAccumulationModal">
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
        <input v-model="newAccumulationValue" type="number" min="1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter number of customers" @keyup.enter="saveAccumulation" />
      </div>

      <div class="flex justify-end space-x-3">
        <button @click="closeAccumulationModal"
          class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
          Cancel
        </button>
        <button @click="saveAccumulation"
          class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
          Save
        </button>
      </div>
    </div>
  </div>

  <!-- Removed logout confirmation modal -->
</template>
