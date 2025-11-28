<script setup lang="ts">
import LucideIcon from "@/components/LucideIcon.vue";
import { useCustomToast } from "@/composables/useCustomToast";
import { formatIDR } from "@/helper/currency";

const props = defineProps<{
  data: any[];
  refresh?: () => Promise<void>;
}>();
const q = ref("");
const balanceFilter = ref<'all' | 'positive' | 'negative' | 'zero'>("all");
const page = ref(1);
const pageCount = 5;

const dataTable = ref<any[]>(props.data ?? []);

watch(
  () => props.data,
  (newData) => {
    dataTable.value = newData ?? [];
  },
);

function getBalanceStatus(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "zero";
}

const normalizedAccounts = computed(() => {
  return (dataTable.value || []).map((account) => ({
    ...account,
    balanceStatus: getBalanceStatus(Number(account?.saldo || 0)),
  }));
});

const filteredAccounts = computed(() => {
  let rows = normalizedAccounts.value;

  if (q.value) {
    const query = q.value.toLowerCase();
    rows = rows.filter((account) => {
      return Object.values(account).some((value) => {
        return String(value ?? "")
          .toLowerCase()
          .includes(query);
      });
    });
  }

  if (balanceFilter.value !== "all") {
    rows = rows.filter((account) => account.balanceStatus === balanceFilter.value);
  }

  return rows;
});

const paginatedAccounts = computed(() => {
  const start = (page.value - 1) * pageCount;
  return filteredAccounts.value.slice(start, start + pageCount);
});

watch([q, balanceFilter], () => {
  page.value = 1;
});

watch(
  () => dataTable.value,
  () => {
    page.value = 1;
  },
);

type User = {
  id: number;
  username: string;
  fullName: string;
  Type: string;
};
const columns = [
  { key: "number", label: "Number" },
  { key: "name", label: "Account" },
  { key: "saldo", label: "Balance" },
];

const toast = useCustomToast();
const modal = useModal();
const count = ref(0);

const items = (row: User) => [
  [
    {
      label: "Edit",
      icon: "i-heroicons-pencil-square-20-solid",
      click: () => console.log("Edit", row.id),
    },
  ],
  [
    {
      label: "Delete",
      icon: "i-heroicons-trash-2-20-solid",
    },
  ],
];

const hasActiveFilters = computed(() => balanceFilter.value !== "all");
const totalAccounts = computed(() => normalizedAccounts.value.length);

function getBalanceCount(status: 'positive' | 'negative' | 'zero') {
  return normalizedAccounts.value.filter(
    (account) => account.balanceStatus === status,
  ).length;
}

function getStatusBadgeClass(status: string) {
  if (status === "positive") {
    return "bg-green-500";
  }
  if (status === "negative") {
    return "bg-red-500";
  }
  return "bg-gray-400";
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div class="flex-1 w-full search-input-wrapper">
        <UInput
          v-model="q"
          placeholder="Search accounts by name or balance..."
          class="w-full text-white placeholder:text-white/70"
        >
          <template #leading>
            <LucideIcon name="search" :size="16" style="color: #FFFFFF;" />
          </template>
        </UInput>
      </div>
      <UButton
        v-if="hasActiveFilters"
        label="Clear Filters"
        color="gray"
        variant="outline"
        class="w-full sm:w-auto hover:bg-gray-900 hover:text-white transition-colors"
        @click="
          balanceFilter = 'all';
        "
      >
        <template #leading>
          <LucideIcon name="x" :size="16" />
        </template>
      </UButton>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex flex-wrap gap-2 items-center">
        <span class="text-sm font-medium text-gray-600">Balance Status:</span>
        <UButton
          :color="balanceFilter === 'all' ? 'primary' : 'gray'"
          :variant="balanceFilter === 'all' ? 'solid' : 'outline'"
          class="flex items-center gap-2"
          @click="
            balanceFilter = 'all';
          "
        >
          <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span>All</span>
          <span class="ml-1 text-xs opacity-75">({{ totalAccounts }})</span>
        </UButton>
        <UButton
          :color="balanceFilter === 'positive' ? 'green' : 'gray'"
          :variant="balanceFilter === 'positive' ? 'solid' : 'outline'"
          class="flex items-center gap-2"
          @click="
            balanceFilter = balanceFilter === 'positive' ? 'all' : 'positive';
          "
        >
          <div class="w-3 h-3" :class="getStatusBadgeClass('positive')"></div>
          <span>Positive</span>
          <span class="ml-1 text-xs opacity-75">({{ getBalanceCount('positive') }})</span>
        </UButton>
        <UButton
          :color="balanceFilter === 'negative' ? 'red' : 'gray'"
          :variant="balanceFilter === 'negative' ? 'solid' : 'outline'"
          class="flex items-center gap-2"
          @click="
            balanceFilter = balanceFilter === 'negative' ? 'all' : 'negative';
          "
        >
          <div class="w-3 h-3" :class="getStatusBadgeClass('negative')"></div>
          <span>Negative</span>
          <span class="ml-1 text-xs opacity-75">({{ getBalanceCount('negative') }})</span>
        </UButton>
        <UButton
          :color="balanceFilter === 'zero' ? 'gray' : 'gray'"
          :variant="balanceFilter === 'zero' ? 'solid' : 'outline'"
          class="flex items-center gap-2"
          @click="
            balanceFilter = balanceFilter === 'zero' ? 'all' : 'zero';
          "
        >
          <div class="w-3 h-3" :class="getStatusBadgeClass('zero')"></div>
          <span>Zero</span>
          <span class="ml-1 text-xs opacity-75">({{ getBalanceCount('zero') }})</span>
        </UButton>
      </div>
    </div>

    <UTable :rows="paginatedAccounts" :columns="columns">
      <template #actions-data="{ row }">
        <UDropdown :items="items(row)">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-ellipsis-horizontal-20-solid"
          />
        </UDropdown>
      </template>
      <template #saldo-data="{ row }">
        <p class="font-medium text-gray-900">{{ formatIDR(row.saldo) }}</p>
      </template>
    </UTable>

    <div
      class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
    >
      <UPagination
        v-model="page"
        :page-count="pageCount"
        :total="filteredAccounts.length"
      />
    </div>
  </div>
</template>

<style scoped>
.search-input-wrapper :deep(input) {
  color: white !important;
}

.search-input-wrapper :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.search-input-wrapper :deep([class*="leading"] svg),
.search-input-wrapper :deep([class*="leading"] path),
.search-input-wrapper :deep(svg) {
  color: #FFFFFF !important;
  stroke: #FFFFFF !important;
}
</style>
