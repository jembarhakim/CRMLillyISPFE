<script setup lang="ts">
import { stockAdminApi } from "@/api/admin/stock";
import { itemsCatalogAdminApi } from "@/api/admin/items-catalog";
import { userManagementAdminApi } from "@/api/admin/user-management";
import { useNotificationStore } from "@/stores/notification";
import LucideIcon from "@/components/LucideIcon.vue";
import type {
  StockBalanceItem,
  StockKind,
  StockMutationItem,
} from "@/types/requests/stock";
import { computed, onMounted, ref, watch } from "vue";

const notification = useNotificationStore();

useHead({
  title: "Stock Management - CRM System",
});

const activeTab = ref("balance");
const loadingBalance = ref(false);
const loadingMutations = ref(false);

// Local date in YYYY-MM-DD (consistent with backend contract)
function todayLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ---- Options for filters ----
const items = ref<{ id: string; name: string; default_unit?: string }[]>([]);
const technicians = ref<{ id: string; name: string }[]>([]);

const holderOptions = computed(() => [
  { value: "", label: "All Holders" },
  { value: "warehouse", label: "Gudang Utama" },
  ...technicians.value.map((t) => ({ value: t.id, label: t.name })),
]);

const unitOptions = computed(() => {
  const units = new Set<string>();
  items.value.forEach((i) => {
    if (i.default_unit) units.add(i.default_unit);
  });
  return Array.from(units).sort();
});

const itemOptions = computed(() => [
  { value: "", label: "All Items" },
  ...items.value.map((i) => ({ value: i.id, label: i.name })),
]);

const kindOptions = [
  { value: "", label: "All Kinds" },
  { value: "in", label: "Masuk" },
  { value: "out", label: "Keluar" },
  { value: "transfer_in", label: "Transfer masuk" },
  { value: "transfer_out", label: "Transfer keluar" },
];

const kindLabel: Record<StockKind, string> = {
  in: "Masuk",
  out: "Keluar",
  transfer_in: "Transfer masuk",
  transfer_out: "Transfer keluar",
};

// ---- Balance filters & data ----
const balanceFilter = ref({
  holder_id: "",
  item_id: "",
  unit: "",
  include_zero: false,
});
const balanceRows = ref<StockBalanceItem[]>([]);

function holderDisplay(row: { holder_id: string | null; holder_name?: string }) {
  if (row.holder_name) return row.holder_name;
  return row.holder_id === null ? "Gudang Utama" : "-";
}

async function loadBalance() {
  loadingBalance.value = true;
  try {
    const response = await stockAdminApi().getStockBalance({
      holder_id: balanceFilter.value.holder_id || undefined,
      item_id: balanceFilter.value.item_id || undefined,
      unit: balanceFilter.value.unit || undefined,
      include_zero: balanceFilter.value.include_zero,
    });
    if (response.success) {
      balanceRows.value = response.data || [];
    } else {
      notification.error("Error", response.message || "Failed to load stock balance");
    }
  } catch (error: any) {
    notification.error("Error", error.message || "Failed to load stock balance");
  } finally {
    loadingBalance.value = false;
  }
}

// ---- Mutation filters & data ----
const MUTATION_LIMIT = 10;
const mutationFilter = ref({
  kind: "",
  item_id: "",
  holder_id: "",
  date_from: "",
  date_to: "",
});
const mutationPage = ref(1);
const mutations = ref<StockMutationItem[]>([]);
const mutationTotal = ref(0);

async function loadMutations() {
  loadingMutations.value = true;
  try {
    const params: {
      limit: number;
      offset: number;
      kind?: StockKind;
      item_id?: string;
      holder_id?: string;
      date_from?: string;
      date_to?: string;
    } = {
      limit: MUTATION_LIMIT,
      offset: (mutationPage.value - 1) * MUTATION_LIMIT,
    };
    if (mutationFilter.value.kind) params.kind = mutationFilter.value.kind as StockKind;
    if (mutationFilter.value.item_id) params.item_id = mutationFilter.value.item_id;
    if (mutationFilter.value.holder_id) params.holder_id = mutationFilter.value.holder_id;
    if (mutationFilter.value.date_from) params.date_from = mutationFilter.value.date_from;
    if (mutationFilter.value.date_to) params.date_to = mutationFilter.value.date_to;

    const response = await stockAdminApi().getStockMutations(params);
    if (response.success) {
      mutations.value = response.data?.items || [];
      mutationTotal.value = response.data?.total || 0;
    } else {
      notification.error("Error", response.message || "Failed to load stock history");
    }
  } catch (error: any) {
    notification.error("Error", error.message || "Failed to load stock history");
  } finally {
    loadingMutations.value = false;
  }
}

function resetMutationPageAndLoad() {
  mutationPage.value = 1;
  loadMutations();
}

watch(
  () => ({ ...balanceFilter.value }),
  loadBalance
);
watch(
  () => ({ ...mutationFilter.value }),
  resetMutationPageAndLoad
);
watch(mutationPage, loadMutations);

function kindColor(kind: StockKind): string {
  switch (kind) {
    case "in":
      return "green";
    case "out":
      return "red";
    case "transfer_in":
      return "blue";
    case "transfer_out":
      return "orange";
    default:
      return "gray";
  }
}

async function loadOptions() {
  try {
    const [itemRes, userRes] = await Promise.all([
      itemsCatalogAdminApi().getItems(),
      userManagementAdminApi().getAllUsers({ query: { role: "TECHNICIAN" } }),
    ]);
    if (itemRes.success) {
      items.value = (itemRes.data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        default_unit: i.default_unit,
      }));
    }
    if (userRes.success) {
      technicians.value = (userRes.data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
      }));
    }
  } catch (error: any) {
    console.error("Failed to load options:", error);
  }
}

onMounted(async () => {
  mutationFilter.value.date_from = todayLocal();
  mutationFilter.value.date_to = todayLocal();
  await loadOptions();
  loadBalance();
  loadMutations();
});

function formatDate(dateString: string) {
  if (!dateString) return "-";
  return dateString;
}
</script>

<template>
  <div class="p-4 md:p-6 space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Stock Management</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Balance and movement of inventory items</p>
      </div>
      <UButton
        label="Back to Assets"
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="outline"
        @click="navigateTo('/dashboard/asset')"
      />
    </div>

    <UCard>
      <UTabs v-model="activeTab" :items="[
        { label: 'Saldo', slot: 'balance' },
        { label: 'Riwayat', slot: 'mutations' },
      ]">
        <!-- ===== TAB: SALDO ===== -->
        <template #balance>
          <div class="flex flex-wrap gap-3 py-4 items-end">
            <div class="w-full sm:w-56">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Holder</label>
              <USelectMenu
                v-model="balanceFilter.holder_id"
                :options="holderOptions"
                option-attribute="label"
                value-attribute="value"
                size="md"
              />
            </div>
            <div class="w-full sm:w-56">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Item</label>
              <USelectMenu
                v-model="balanceFilter.item_id"
                :options="itemOptions"
                option-attribute="label"
                value-attribute="value"
                size="md"
              />
            </div>
            <div class="w-full sm:w-44">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Unit</label>
              <USelectMenu
                v-model="balanceFilter.unit"
                :options="[
                  { value: '', label: 'All Units' },
                  ...unitOptions.map((u) => ({ value: u, label: u })),
                ]"
                option-attribute="label"
                value-attribute="value"
                size="md"
              />
            </div>
            <div class="flex items-center gap-2 pb-1">
              <UCheckbox v-model="balanceFilter.include_zero" label="Show zero" />
            </div>
          </div>

          <div v-if="loadingBalance" class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading balance...</p>
          </div>

          <div v-else-if="balanceRows.length === 0" class="p-8 text-center">
            <LucideIcon name="package-x" :size="48" class="mx-auto text-gray-400 mb-3" />
            <p class="text-gray-600 dark:text-gray-400 font-medium">No stock balance data found</p>
            <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Adjust your filters or check back later.</p>
          </div>

          <div v-else class="table-scroll-container">
            <div class="table-scroll-content">
              <UTable
                :rows="balanceRows"
                :columns="[
                  { key: 'item_name', label: 'Item' },
                  { key: 'unit', label: 'Unit' },
                  { key: 'holder_name', label: 'Holder' },
                  { key: 'balance', label: 'Balance' },
                ]"
                class="dashboard-table"
              >
                <template #item_name-data="{ row }">
                  <span class="text-sm font-medium">{{ row.item_name }}</span>
                </template>
                <template #unit-data="{ row }">
                  <UBadge :label="row.unit" color="blue" variant="soft" size="sm" />
                </template>
                <template #holder_name-data="{ row }">
                  <span class="text-sm">{{ holderDisplay(row) }}</span>
                </template>
                <template #balance-data="{ row }">
                  <span class="text-sm font-semibold">{{ row.balance ?? 0 }}</span>
                </template>
              </UTable>
            </div>
          </div>
        </template>

        <!-- ===== TAB: RIWAYAT ===== -->
        <template #mutations>
          <div class="flex flex-wrap gap-3 py-4 items-end">
            <div class="w-full sm:w-40">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Kind</label>
              <USelectMenu
                v-model="mutationFilter.kind"
                :options="kindOptions"
                option-attribute="label"
                value-attribute="value"
                size="md"
              />
            </div>
            <div class="w-full sm:w-52">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Item</label>
              <USelectMenu
                v-model="mutationFilter.item_id"
                :options="itemOptions"
                option-attribute="label"
                value-attribute="value"
                size="md"
              />
            </div>
            <div class="w-full sm:w-52">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Holder</label>
              <USelectMenu
                v-model="mutationFilter.holder_id"
                :options="holderOptions"
                option-attribute="label"
                value-attribute="value"
                size="md"
              />
            </div>
            <div class="w-full sm:w-44">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
              <UInput v-model="mutationFilter.date_from" type="date" size="md" />
            </div>
            <div class="w-full sm:w-44">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
              <UInput v-model="mutationFilter.date_to" type="date" size="md" />
            </div>
          </div>

          <div v-if="loadingMutations" class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading history...</p>
          </div>

          <div v-else-if="mutations.length === 0" class="p-8 text-center">
            <LucideIcon name="history" :size="48" class="mx-auto text-gray-400 mb-3" />
            <p class="text-gray-600 dark:text-gray-400 font-medium">No stock history found</p>
            <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Adjust your filters or check back later.</p>
          </div>

          <div v-else class="table-scroll-container">
            <div class="table-scroll-content">
              <UTable
                :rows="mutations"
                :columns="[
                  { key: 'date', label: 'Date' },
                  { key: 'kind', label: 'Kind' },
                  { key: 'item_name', label: 'Item' },
                  { key: 'unit', label: 'Unit' },
                  { key: 'quantity', label: 'Qty' },
                  { key: 'holder_name', label: 'Holder' },
                  { key: 'recorded_by_name', label: 'Recorded By' },
                  { key: 'notes', label: 'Notes' },
                ]"
                class="dashboard-table"
              >
                <template #date-data="{ row }">
                  <span class="text-sm">{{ formatDate(row.date) }}</span>
                </template>
                <template #kind-data="{ row }">
                  <UBadge :label="kindLabel[row.kind]" :color="kindColor(row.kind)" variant="soft" size="sm" />
                </template>
                <template #item_name-data="{ row }">
                  <span class="text-sm font-medium">{{ row.item_name }}</span>
                </template>
                <template #unit-data="{ row }">
                  <UBadge :label="row.unit" color="blue" variant="soft" size="sm" />
                </template>
                <template #quantity-data="{ row }">
                  <span class="text-sm font-semibold">{{ row.quantity }}</span>
                </template>
                <template #holder_name-data="{ row }">
                  <span class="text-sm">{{ holderDisplay(row) }}</span>
                </template>
                <template #recorded_by_name-data="{ row }">
                  <span class="text-sm">{{ row.recorded_by_name || "-" }}</span>
                </template>
                <template #notes-data="{ row }">
                  <span class="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" :title="row.notes || row.item_notes">
                    {{ row.notes || row.item_notes || "-" }}
                  </span>
                </template>
              </UTable>
            </div>
          </div>

          <div
            v-if="mutationTotal > 0"
            class="flex items-center justify-between px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
          >
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ mutationTotal }} total
            </span>
            <UPagination
              v-model="mutationPage"
              :page-count="MUTATION_LIMIT"
              :total="mutationTotal"
              :max="7"
            />
          </div>
        </template>
      </UTabs>
    </UCard>
  </div>
</template>

<style scoped>
.table-scroll-container {
  width: 100%;
  overflow-x: auto;
}

.table-scroll-content {
  min-width: 100%;
  width: max-content;
}
</style>

