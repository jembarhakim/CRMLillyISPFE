<script setup lang="ts">
import { dashboardAdminApi } from "@/api/admin/dashboard";
import { invoiceAdminApi } from "@/api/admin/invoice";
import { formatIDR } from "@/helper/currency";
import { formatDateToYMD } from "@/helper/date";

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
const customerGrowth = ref<any>({});
const revenueChart = ref<any>({});
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
      useToast().add({
        title: err.message || "Failed to load customer data",
        color: "red",
      });
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
      useToast().add({
        title: err.message || "Failed to load customer data",
        color: "red",
      });
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
          return item.name_city+ " - " + item.name_subdistrict + " - " + item.name_village;
        })

      optionCardArea.value = option


    } catch (err: any) {
      useToast().add({
        title: err.message || "Failed to load customer data",
        color: "red",
      });
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
      useToast().add({
        title: err.message || "Failed to load customer data",
        color: "red",
      });
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
    key: "customer.product.name",
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
      useToast().add({
        title: err,
        color: "red",
      });
    });

  transactionAdminApi()
    .getAllTransactions(null).then((response) => {
      latestDeposites.value = response.data.filter((item: any) => item.type_in_out == "debit").map((transaction: any,index: number) => {
        return {
          number: index + 1,
          type_cash: transaction.type_cash.split("_")[0] + " " + (transaction.type_cash.split("_")[1] ? transaction.type_cash.split("_")[1] : ""),
          amount: transaction.amount,
          description: transaction.description
        }
      }).slice((1 - 1) * 5, (1) * 5);
      latestExpenses.value = response.data.filter((item: any) => item.type_in_out == "credit").map((transaction: any,index: number) => {
        return {
          number: index + 1,
          type_cash: transaction.type_cash.split("_")[0] + " " + (transaction.type_cash.split("_")[1] ? transaction.type_cash.split("_")[1] : ""),
          amount: transaction.amount,
          description: transaction.description
        }
      }).slice((1 - 1) * 5, (1) * 5);
    }).catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
    });

  dashboardAdminApi()
    .totalIncomeDashboard()
    .then((response) => {
      totalIncome.value = response.data.total_income;
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
    });

  dashboardAdminApi()
    .totalExpensesDashboard()
    .then((response) => {
      totalExpenses.value = response.data.total_expenses;
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
    });

  dashboardAdminApi()
    .totalNetWorthDashboard()
    .then((response) => {
      totalNetWorth.value = response.data.total_net_worth;
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
    });

  dashboardAdminApi()
    .totalSalesDashboard()
    .then((response) => {
      totalSales.value = response.data.total_sales;
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
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

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    useToast().add({
      title: 'Error',
      description: 'Failed to load dashboard data',
      color: 'red',
    });
  }
};

onMounted(async () => {
  show()
  await getNewDashboardData()
  hide()
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
        <h1 class="text-base font-medium uppercase tracking-wider opacity-90">Total Tickets</h1>
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
        <UButton 
          icon="i-heroicons-arrow-path" 
          color="gray" 
          variant="soft"
          size="sm"
          @click="getNewDashboardData"
          title="Refresh Recent Invoices"
        />
      </div>
      <div v-if="recentInvoices.length > 0" class="space-y-3">
        <div v-for="invoice in recentInvoices.slice(0, 5)" :key="invoice.id" 
             class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-gray-900">{{ invoice.invoice_no || invoice.id }}</p>
              <span class="px-2 py-1 text-xs rounded-full font-medium"
                    :class="{
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
        <UButton 
          icon="i-heroicons-arrow-path" 
          color="gray" 
          variant="soft"
          size="sm"
          @click="getNewDashboardData"
          title="Refresh Recent Transactions"
        />
      </div>
      <div v-if="recentTransactions.length > 0" class="space-y-3">
        <div v-for="transaction in recentTransactions.slice(0, 5)" :key="transaction.id" 
             class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-gray-900">{{ transaction.description || 'No Description' }}</p>
              <span class="px-2 py-1 text-xs rounded-full font-medium"
                    :class="{
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


  <!-- Charts Section -->
  <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg">
    <h1 class="text-xl font-semibold text-slate-800 mb-4">Analytics Charts</h1>
    <div class="grid gap-6 md:grid-cols-2 sm:grid-cols-1">
      <div>
        <h2 class="text-lg font-medium text-gray-700 mb-3">Customer Growth (30 days)</h2>
        <div v-if="customerGrowth.customer_growth" class="h-64">
          <VChart :option="{
            title: { text: 'Customer Growth' },
            tooltip: {},
            xAxis: { 
              data: customerGrowth.customer_growth.map((item: any) => item.date),
              type: 'category'
            },
            yAxis: {},
            series: [{
              name: 'New Customers',
              type: 'line',
              data: customerGrowth.customer_growth.map((item: any) => item.count),
              smooth: true
            }]
          }" autoresize style="height: 100%;" />
        </div>
      </div>
      
      <div>
        <h2 class="text-lg font-medium text-gray-700 mb-3">Revenue Chart (30 days)</h2>
        <div v-if="revenueChart.revenue_chart" class="h-64">
          <VChart :option="{
            title: { text: 'Daily Revenue' },
            tooltip: {},
            xAxis: { 
              data: revenueChart.revenue_chart.map((item: any) => item.date),
              type: 'category'
            },
            yAxis: {},
            series: [{
              name: 'Revenue',
              type: 'bar',
              data: revenueChart.revenue_chart.map((item: any) => item.amount),
              itemStyle: { color: '#10B981' }
            }]
          }" autoresize style="height: 100%;" />
        </div>
      </div>
    </div>
  </div>
</template>
