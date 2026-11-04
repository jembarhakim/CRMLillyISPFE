<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { formatRupiah, formatDateID } from "@/helper/customerPortal";
import { dashboardCustomerApi } from "../../api/customer/dashboard";
import { formatDateToYMD } from "@/helper/date";
import { useCustomToast } from "@/composables/useCustomToast";

import TabBills from '@/components/customer/tabs/TabBills.vue';
import TabTickets from '@/components/customer/tabs/TabTickets.vue';
import TabService from '@/components/customer/tabs/TabService.vue';
import TabMonitoring from '@/components/customer/tabs/TabMonitoring.vue';

useHead({
  title: 'Beranda Pelanggan - Lilly ISP',
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap' }
  ]
})

definePageMeta({ ssr: false })

interface Customer {
  id: string; address: string; area_id: string; card_identition: string; company_id: string;
  email: string; gender: string; ip_static: string; job: string; latitude: number;
  longitude: number; mac_address: string; name: string; no_identition: number;
  phone: string; type_of_service: string; created_at: string; updated_at: string; installation_date: string;
}

interface Product {
  id: string; name: string; price: number; description: string; createdAt: string; updatedAt: string;
}

interface Invoice {
  number?: number; id: string; amount: number; customer_id: string; link: string;
  status: "unpaid" | "paid" | "pending"; created_at: string; updated_at: string;
}

interface NetworkDevice {
  id: string; customer_id: string; mac_address: string; ip_static: string;
  product_id: string; product?: Product | null;
}

interface DashboardResponse {
  customer: Customer; product: Product; invoice: Invoice[]; network_device: NetworkDevice;
}

const dashboardResponse = ref<DashboardResponse>({
  customer: {} as Customer,
  product: {} as Product,
  invoice: [] as Invoice[],
  network_device: {} as NetworkDevice,
});

const deviceStatus = ref<string>('unknown');
const isCheckingStatus = ref(false);
const isLoading = ref(true);
let statusRefreshInterval: NodeJS.Timeout | null = null;

// Tab Menu System (Kembali ke desain & label asli)
const activeTab = ref<'bayar' | 'lapor' | 'paket' | 'monitoring'>('bayar');
const tabs = [
  { id: 'bayar', label: 'Bayar Tagihan' },
  { id: 'lapor', label: 'Lapor Gangguan' },
  { id: 'paket', label: 'Ubah Paket' },
  { id: 'monitoring', label: 'Monitoring' }
] as const;

async function getData() {
  try {
    const response = await dashboardCustomerApi().getCustomerDashboard();
    if (response && response.data) {
      const data = response.data;
      if (data.invoice && Array.isArray(data.invoice)) {
        data.invoice.forEach((invoice: any, index: number) => invoice.number = index + 1);
      }
      if (!data.network_device) {
        data.network_device = { id: "", customer_id: "", mac_address: "", ip_static: "", product_id: "", product: null };
      }
      dashboardResponse.value = { ...data };
      checkDeviceStatus();
    } else {
      useCustomToast().add({ title: 'Respons tidak valid dari server', color: "red" });
    }
  } catch (err: any) {
    useCustomToast().add({ title: err?.message || 'Gagal memuat data', color: "red" });
  }
}

onMounted(async () => {
  try {
    await getData();
    if (dashboardResponse.value.network_device?.mac_address) {
      statusRefreshInterval = setInterval(() => checkDeviceStatus(), 30000);
    }
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (statusRefreshInterval) clearInterval(statusRefreshInterval);
});

async function checkDeviceStatus() {
  if (!dashboardResponse.value.network_device?.mac_address) {
    deviceStatus.value = 'off';
    return;
  }
  isCheckingStatus.value = true;
  try {
    const response = await dashboardCustomerApi().checkDeviceStatus();
    deviceStatus.value = response?.data?.status || 'unknown';
  } catch (error) {
    deviceStatus.value = 'unknown';
  } finally {
    isCheckingStatus.value = false;
  }
}

const status = computed(() => {
  if (!dashboardResponse.value.network_device?.mac_address) return 'non active';
  return deviceStatus.value === 'up' ? 'active' : 'non active';
});

const unpaidInvoices = computed(() => (dashboardResponse.value.invoice || []).filter((i) => i.status !== 'paid'));
const unpaidTotal = computed(() => unpaidInvoices.value.reduce((sum, i) => sum + (i.amount || 0), 0));

const firstName = computed(() => (dashboardResponse.value.customer?.name || '').trim().split(/\s+/)[0] || 'Pelanggan');
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
});

// Computed Strings (Agar aman dari auto-format line-break VS Code di template)
const customerAddressText = computed(() => dashboardResponse.value.customer?.address || 'Lokasi pelanggan aktif');
const unpaidStatusText = computed(() =>
  unpaidTotal.value > 0
    ? `${unpaidInvoices.value.length} tagihan belum dibayar`
    : 'Semua tagihan lunas 🎉'
);
const payButtonText = computed(() => (unpaidTotal.value > 0 ? 'Bayar Tagihan' : 'Lihat Tagihan'));
const productNameText = computed(() => dashboardResponse.value.product?.name || 'Belum Terdaftar');
const productPriceText = computed(() =>
  dashboardResponse.value.product?.price ? formatRupiah(dashboardResponse.value.product.price) : '-'
);
const installDateText = computed(() =>
  dashboardResponse.value.customer?.installation_date
    ? formatDateToYMD(dashboardResponse.value.customer.installation_date)
    : '-'
);
const connectionTitleText = computed(() => (status.value === 'active' ? 'Koneksi Stabil' : 'Koneksi Terputus'));
const refreshBtnText = computed(() => (isCheckingStatus.value ? 'Memeriksa...' : 'Refresh Status'));
const lastInvoiceAmountText = computed(() =>
  dashboardResponse.value.invoice?.[0] ? formatRupiah(dashboardResponse.value.invoice[0].amount) : 'Rp 0'
);
const lastInvoiceDateText = computed(() =>
  dashboardResponse.value.invoice?.[0] ? formatDateID(dashboardResponse.value.invoice[0].created_at) : 'Belum ada riwayat'
);
</script>

<template>
  <ClientOnly>
    <div style="font-family: 'Poppins', sans-serif;"
      class="min-h-screen bg-[#F9EBEB]/60 relative overflow-hidden pb-24 text-gray-900">

      <!-- Ornamen Background Halus ala Landing Page -->
      <div class="pointer-events-none absolute inset-0 bg-dot-pattern opacity-35"></div>
      <div
        class="pointer-events-none absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-[#A93133]/15 to-transparent blur-3xl">
      </div>
      <div class="pointer-events-none absolute top-1/3 -left-24 w-[400px] h-[400px] rounded-full bg-white/80 blur-3xl">
      </div>

      <!-- Top Bar Gelap Konsisten dengan Landing Page -->
      <div class="bg-[#111111] text-white text-xs py-2.5 px-4 sm:px-8 border-b-2 border-[#A93133] relative z-20">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#A93133] animate-pulse"></span>
            <span class="font-bold tracking-wide">LILLY ISP</span>
            <span class="text-gray-400 hidden sm:inline">| Portal Pelanggan</span>
          </div>
          <NuxtLink to="/"
            class="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium">
            <LucideIcon name="home" :size="13" />
            <span>Beranda Web</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Kontainer Konten -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">

        <!-- SKELETON LOADING -->
        <div v-if="isLoading" class="space-y-8 animate-pulse">
          <div class="h-16 bg-white/70 rounded-2xl w-64"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div v-for="i in 4" :key="i" class="h-52 bg-white rounded-3xl shadow-sm"></div>
          </div>
        </div>

        <!-- KONTEN UTAMA -->
        <div v-else class="space-y-8">

          <!-- ===== Header Sapaan ===== -->
          <header class="border-b-2 border-gray-900 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-[#A93133] tracking-wide">{{ greeting }}</p>
              <h1 class="text-3xl sm:text-4xl font-extrabold text-[#000000] mt-1">
                Selamat Datang, {{ firstName }}
              </h1>
            </div>
            <div
              class="flex items-center gap-2 text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white shadow-sm self-start sm:self-end">
              <LucideIcon name="map-pin" :size="14" class="text-[#A93133] shrink-0" />
              <span class="truncate max-w-[260px] font-medium">{{ customerAddressText }}</span>
            </div>
          </header>

          <!-- ===== 4 KOTAK PATEN ATAS ===== -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">

            <!-- Kotak 1: Tagihan Saat Ini -->
            <div
              class="bg-white rounded-3xl p-6 shadow-[0_8px_24px_rgb(169,49,51,0.06)] border border-white flex flex-col justify-between h-full relative overflow-hidden">
              <div class="absolute -right-8 -top-8 w-24 h-24 bg-[#F9EBEB] rounded-full blur-2xl opacity-80"></div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-2">Tagihan saat ini</p>
                <h3 class="text-3xl font-extrabold" :class="unpaidTotal > 0 ? 'text-[#A93133]' : 'text-[#000000]'">
                  {{ formatRupiah(unpaidTotal) }}
                </h3>
                <p class="text-xs font-medium mt-2" :class="unpaidTotal > 0 ? 'text-[#A93133]/80' : 'text-green-600'">
                  {{ unpaidStatusText }}
                </p>
              </div>

              <button @click="activeTab = 'bayar'"
                class="mt-6 w-full py-3 rounded-xl font-bold text-sm transition-all duration-300"
                :class="unpaidTotal > 0 ? 'bg-[#A93133] text-white shadow-md hover:bg-red-800' : 'bg-[#F9EBEB] text-[#A93133] hover:bg-[#A93133] hover:text-white'">
                {{ payButtonText }}
              </button>
            </div>

            <!-- Kotak 2: Paket Layanan Anda -->
            <div
              class="bg-white rounded-3xl p-6 shadow-[0_8px_24px_rgb(169,49,51,0.06)] border border-white flex flex-col justify-between h-full">
              <div>
                <div class="flex justify-between items-start mb-2">
                  <p class="text-sm font-medium text-gray-500">Paket layanan anda</p>
                  <span
                    class="px-2.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">AKTIF</span>
                </div>
                <h3 class="text-2xl sm:text-3xl font-extrabold text-[#000000] leading-tight">
                  {{ productNameText }}
                </h3>
              </div>

              <div class="mt-6 pt-4 border-t border-gray-100 space-y-2">
                <div class="flex items-center text-xs text-gray-600">
                  <div class="w-3 h-1.5 rounded-full bg-[#A93133] mr-2"></div>
                  <span class="w-24">Biaya Bulanan</span>
                  <strong class="ml-1 text-gray-900">{{ productPriceText }}</strong>
                </div>
                <div class="flex items-center text-xs text-gray-600">
                  <div class="w-3 h-1.5 rounded-full bg-gray-300 mr-2"></div>
                  <span class="w-24">Pasang Sejak</span>
                  <strong class="ml-1 text-gray-900">{{ installDateText }}</strong>
                </div>
              </div>
            </div>

            <!-- Kotak 3: Status Koneksi Internet -->
            <div
              class="bg-white rounded-3xl p-6 shadow-[0_8px_24px_rgb(169,49,51,0.06)] border border-white flex flex-col justify-between h-full">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-2">Status Koneksi Internet anda</p>
                <div class="flex items-center gap-3">
                  <div class="relative flex h-4 w-4">
                    <span v-if="status === 'active'"
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-4 w-4"
                      :class="status === 'active' ? 'bg-green-500' : 'bg-red-500'"></span>
                  </div>
                  <h3 class="text-xl sm:text-2xl font-extrabold text-[#000000]">
                    {{ connectionTitleText }}
                  </h3>
                </div>
              </div>

              <div class="mt-4 space-y-2 bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs">
                <div class="flex justify-between items-center">
                  <span class="text-[10px] text-gray-400 font-bold uppercase">MAC</span>
                  <span class="font-mono font-medium text-gray-900">{{ dashboardResponse.network_device?.mac_address ||
                    '-' }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[10px] text-gray-400 font-bold uppercase">IP</span>
                  <span class="font-mono font-medium text-gray-900">{{ dashboardResponse.network_device?.ip_static ||
                    '-' }}</span>
                </div>
              </div>

              <button @click="checkDeviceStatus"
                class="mt-4 w-full py-2.5 bg-[#F9EBEB] text-[#A93133] rounded-xl text-xs font-bold hover:bg-[#A93133] hover:text-white transition-colors flex items-center justify-center gap-2">
                <LucideIcon name="refresh-cw" :size="12" :class="{ 'animate-spin': isCheckingStatus }" />
                <span>{{ refreshBtnText }}</span>
              </button>
            </div>

            <!-- Kotak 4: Tagihan Terakhir -->
            <div
              class="bg-white rounded-3xl p-6 shadow-[0_8px_24px_rgb(169,49,51,0.06)] border border-white flex flex-col justify-between h-full">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-2">Tagihan terakhir</p>
                <h3 class="text-2xl sm:text-3xl font-extrabold text-[#000000]">
                  {{ lastInvoiceAmountText }}
                </h3>
              </div>

              <div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>{{ lastInvoiceDateText }}</span>
                <span class="font-bold text-[#A93133]">{{ productPriceText }}</span>
              </div>
            </div>

          </div>

          <!-- ===== SLIDER TAB MENU (Desain Pill/Kapsul Seperti Sebelumnya) ===== -->
          <div class="mt-10">
            <div class="flex items-center justify-center overflow-x-auto no-scrollbar py-2">
              <div class="inline-flex bg-[#F9EBEB] p-1.5 rounded-full border border-[#A93133]/15 shadow-inner gap-1">
                <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
                  class="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap"
                  :class="activeTab === tab.id ? 'bg-white text-[#A93133] shadow-md transform scale-105' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'">
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <!-- ===== KONTEN TAB DINAMIS ===== -->
            <div class="mt-6">
              <transition name="fade" mode="out-in">
                <TabBills v-if="activeTab === 'bayar'" key="bayar" @paid="getData" />
                <TabTickets v-else-if="activeTab === 'lapor'" key="lapor" />
                <TabService v-else-if="activeTab === 'paket'" key="paket" />
                <TabMonitoring v-else-if="activeTab === 'monitoring'" key="monitoring" />
              </transition>
            </div>
          </div>

        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.bg-dot-pattern {
  background-image: radial-gradient(#A93133 0.75px, transparent 0.75px);
  background-size: 24px 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>