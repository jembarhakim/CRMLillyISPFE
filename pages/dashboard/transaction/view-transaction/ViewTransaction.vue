<script setup lang="ts">
import LucideIcon from '@/components/LucideIcon.vue';
import { useCustomToast } from '@/composables/useCustomToast';
import { formatIDR } from '@/helper/currency';

const props = defineProps<{
  data: any[];
}>();

const q = ref("");
const typeFilter = ref<'all' | 'debit' | 'credit'>('all');
const methodFilter = ref('all');
const page = ref(1);
const pageCount = 5;

function getTransactionType(transaction: any) {
  return (
    transaction?.type?.toString().toLowerCase() ||
    transaction?.type_in_out?.toString().toLowerCase() ||
    ""
  );
}

const normalizedTransactions = computed(() => {
  return (props.data || []).map((transaction) => {
    const normalizedType = getTransactionType(transaction);
    const normalizedMethod = (transaction?.method || "").toString().toLowerCase();
    const accountDisplay =
      typeof transaction.account === "object"
        ? transaction.account?.name ?? "-"
        : transaction.account ?? "-";

    return {
      ...transaction,
      accountDisplay,
      normalizedType,
      normalizedMethod,
    };
  });
});

const filteredTransactions = computed(() => {
  let rows = normalizedTransactions.value;

  if (q.value) {
    const query = q.value.toLowerCase();
    rows = rows.filter((transaction) => {
      return Object.values(transaction).some((value) => {
        return String(value ?? "").toLowerCase().includes(query);
      });
    });
  }

  if (typeFilter.value !== "all") {
    rows = rows.filter(
      (transaction) => transaction.normalizedType === typeFilter.value,
    );
  }

  if (methodFilter.value !== "all") {
    rows = rows.filter(
      (transaction) => transaction.normalizedMethod === methodFilter.value,
    );
  }

  return rows;
});

const paginatedTransactions = computed(() => {
  const start = (page.value - 1) * pageCount;
  return filteredTransactions.value.slice(start, start + pageCount);
});

watch([q, typeFilter, methodFilter], () => {
  page.value = 1;
});

watch(normalizedTransactions, () => {
  page.value = 1;
});

const uniqueMethods = computed(() => {
  const set = new Set<string>();
  normalizedTransactions.value.forEach((transaction) => {
    if (transaction.normalizedMethod) {
      set.add(transaction.normalizedMethod);
    }
  });
  return Array.from(set).sort();
});

const totalTransactions = computed(() => normalizedTransactions.value.length);
const hasActiveFilters = computed(
  () => typeFilter.value !== "all" || methodFilter.value !== "all",
);

type User = {
  id: number;
  username: string;
  fullName: string;
  Type: string;
};
const columns = [
  { key: "number", label: "Number" },
  { key: "date", label: "Date" },
  { key: "account", label: "Account" },
  { key: "type", label: "Type" },
  { key: "amount", label: "Amount" },
  { key: "description", label: "Description" },
  // { key: "dr", label: "Dr." },
  // { key: "cr", label: "CR." },
  // { key: "balance", label: "Balance" },
  // { key: "actions", label: "Actions" },
];

function handleClick(row: { id: number }) {
  alert("clicked" + row);
}

function getTypeBadgeClass(type?: string) {
  const normalized = (type || "").toLowerCase();
  if (normalized === "credit") {
    return "bg-yellow-100 text-yellow-800 border border-yellow-200";
  }
  if (normalized === "debit") {
    return "bg-green-100 text-green-800 border border-green-200";
  }
  return "bg-gray-100 text-gray-700 border border-gray-200";
}

function getTypeCount(type: 'debit' | 'credit') {
  return normalizedTransactions.value.filter(
    (transaction) => transaction.normalizedType === type,
  ).length;
}

function getMethodCount(method: string) {
  return normalizedTransactions.value.filter(
    (transaction) => transaction.normalizedMethod === method,
  ).length;
}

function formatMethodLabel(method: string) {
  if (!method) return "Unknown";
  return method.charAt(0).toUpperCase() + method.slice(1);
}

const toast = useCustomToast();
const modal = useModal();
const count = ref(0);

const items = (row: User) => [
  [
    {
      label: "Edit",
      icon: "pencil-square-20-solid",
      click: () => console.log("Edit", row.id),
    },
  ],
  [
    {
      label: "Delete",
      icon: "trash-2-20-solid",
    },
  ],
];
// function openModal() {
//   count.value += 1;
//   modal.open(FormRole, {
//     count: count.value,
//     onSuccess() {
//       toast.add({
//         title: "Success !",
//         id: "modal-success",
//       });
//     },
//   });
// }
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div class="flex-1 w-full search-input-wrapper">
        <UInput
          v-model="q"
          placeholder="Search transactions by description, account, amount..."
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
          typeFilter = 'all';
          methodFilter = 'all';
        "
      >
        <template #leading>
          <LucideIcon name="x" :size="16" />
        </template>
      </UButton>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex flex-wrap gap-2 items-center">
        <span class="text-sm font-medium text-gray-600">Transaction Type:</span>
        <UButton
          :color="typeFilter === 'all' ? 'primary' : 'gray'"
          :variant="typeFilter === 'all' ? 'solid' : 'outline'"
          class="flex items-center gap-2"
          @click="
            typeFilter = 'all';
          "
        >
          <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span>All</span>
          <span class="ml-1 text-xs opacity-75">({{ totalTransactions }})</span>
        </UButton>
        <UButton
          :color="typeFilter === 'debit' ? 'green' : 'gray'"
          :variant="typeFilter === 'debit' ? 'solid' : 'outline'"
          class="flex items-center gap-2"
          @click="
            typeFilter = typeFilter === 'debit' ? 'all' : 'debit';
          "
        >
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Debit</span>
          <span class="ml-1 text-xs opacity-75">({{ getTypeCount('debit') }})</span>
        </UButton>
        <UButton
          :color="typeFilter === 'credit' ? 'yellow' : 'gray'"
          :variant="typeFilter === 'credit' ? 'solid' : 'outline'"
          class="flex items-center gap-2"
          @click="
            typeFilter = typeFilter === 'credit' ? 'all' : 'credit';
          "
        >
          <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Credit</span>
          <span class="ml-1 text-xs opacity-75">({{ getTypeCount('credit') }})</span>
        </UButton>
      </div>
    </div>

    <div v-if="uniqueMethods.length" class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex flex-wrap gap-2 items-center">
        <span class="text-sm font-medium text-gray-600">Payment Method:</span>
        <UButton
          :color="methodFilter === 'all' ? 'primary' : 'gray'"
          :variant="methodFilter === 'all' ? 'solid' : 'outline'"
          class="flex items-center gap-2"
          @click="
            methodFilter = 'all';
          "
        >
          <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span>All</span>
          <span class="ml-1 text-xs opacity-75">({{ totalTransactions }})</span>
        </UButton>
        <UButton
          v-for="method in uniqueMethods"
          :key="method"
          :color="methodFilter === method ? 'primary' : 'gray'"
          :variant="methodFilter === method ? 'solid' : 'outline'"
          class="flex items-center gap-2 capitalize"
          @click="
            methodFilter = methodFilter === method ? 'all' : method;
          "
        >
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>{{ formatMethodLabel(method) }}</span>
          <span class="ml-1 text-xs opacity-75">({{ getMethodCount(method) }})</span>
        </UButton>
      </div>
    </div>

    <UTable :rows="paginatedTransactions" :columns="columns">
      <template #actions-data="{ row }">
        <UDropdown :items="items(row)">
          <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
        </UDropdown>
      </template>
      <template #date-data="{ row }">
        <p>{{ row.date.split("T")[0] }}</p>
      </template>
      <template #account-data="{ row }">
        <p>{{ row.accountDisplay ?? row.account?.name ?? row.account ?? '-' }}</p>
      </template>
      <template #type-data="{ row }">
        <span
          class="px-2 py-1 rounded text-xs font-medium capitalize"
          :class="getTypeBadgeClass(row.type ?? row.type_in_out)"
        >
          {{ row.type ?? row.type_in_out ?? '-' }}
        </span>
      </template>
      <template #amount-data="{ row }">
        <p>{{ formatIDR(row.amount) }}</p>
      </template>
      <template #balance-data="{ row }">
        <p>{{ formatIDR(row?.account?.saldo ?? 0) }}</p>
      </template>
    </UTable>

    <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
      <UPagination v-model="page" :page-count="pageCount" :total="filteredTransactions.length" />
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
