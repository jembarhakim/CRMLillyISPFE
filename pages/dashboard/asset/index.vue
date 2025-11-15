<script setup lang="ts">
import { assetAdminApi } from "@/api/admin/asset";
import { itemsTransactionAdminApi } from "@/api/admin/items-transaction";
import { useNotificationStore } from "@/stores/notification";
import FormAddComponent from "./AddAssetForm.vue";
import GoodsTransactionModal from "./GoodsTransactionModal.vue";
import { defaultAssets } from "./asset.model";
import { tableColumns } from "./table";
import { format } from "date-fns";
import LucideIcon from '@/components/LucideIcon.vue';
import { computed, onMounted, ref } from 'vue';

const notification = useNotificationStore();

// Set page title
useHead({
  title: "Asset Management - CRM System",
});

const page = ref(1);
const pageCount = 5;

const q = ref("");

let assetData: any = defaultAssets;

// Goods transactions state
const showGoodsModal = ref(false);
const goodsTransactions = ref<any[]>([]);
const goodsTransactionPage = ref(1);
const goodsTransactionPageCount = 10;
const goodsTransactionFilter = ref<'all' | 'in' | 'out'>('all');
const loadingTransactions = ref(false);
const showDeleteModal = ref(false);
const transactionToDelete = ref<string | null>(null);

const filteredRows = computed(() => {
  if (!q.value) {
    return defaultAssets.value.slice(
      (page.value - 1) * pageCount,
      page.value * pageCount
    );
  }

  const newData = defaultAssets.value.filter((person: { [s: string]: unknown; } | ArrayLike<unknown>) => {
    return Object.values(person).some((value) => {
      return String(value).toLowerCase().includes(q.value.toLowerCase());
    });
  });
  return newData.slice((page.value - 1) * pageCount, page.value * pageCount);
});

function formatDate(dateString: string) {
  if (!dateString) return "No Date";
  try {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    return "Invalid Date";
  }
}

async function getData() {
  await assetAdminApi()
    .getAllAssets()
    .then((response) => {
      response.data.forEach((asset: any) => {
        asset.number = response.data.indexOf(asset) + 1;
      });

      defaultAssets.value = [...response.data];
    })
    .catch();
}

async function deleteAsset(assetId: string) {
  await assetAdminApi()
    .deleteAsset(assetId)
    .then((response) => {
      useToast().add({
        title: response.message,
      });
      getData();
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
      getData();
    });
}

await getData();
const isOpen = ref(false);

const toast = useToast();
const modal = useModal();

function OpenModalAddAsset(isEdit: boolean, data: any) {
  modal.open(FormAddComponent, {
    isEdit,
    data,
    async onSuccess() {
      await getData();
      modal.close();
    },
  });
}

const items = (row: any) => [
  [
    {
      label: "View Details",
      icon: "eye-20-solid",
      click: () => navigateTo(`/dashboard/asset/${row.id}`),
    },
    {
      label: "Edit",
      icon: "pencil-square-20-solid",
      click: () => OpenModalAddAsset(true, row),
    },
    {
      label: "Delete",
      icon: "trash-2-20-solid",
      click: () => deleteAsset(row.id),
    },
  ],
];

// Load goods transactions
async function loadGoodsTransactions() {
  loadingTransactions.value = true;
  try {
    const params: any = {};
    if (goodsTransactionFilter.value !== 'all') {
      params.transaction_type = goodsTransactionFilter.value;
    }
    
    const response = await itemsTransactionAdminApi().getItemsTransactions(params);
    if (response.success) {
      goodsTransactions.value = response.data || [];
    }
  } catch (error) {
    console.error('Failed to load goods transactions:', error);
  } finally {
    loadingTransactions.value = false;
  }
}

// Filtered goods transactions
const filteredGoodsTransactions = computed(() => {
  let filtered = goodsTransactions.value;
  
  if (goodsTransactionFilter.value !== 'all') {
    filtered = filtered.filter(t => t.transaction_type === goodsTransactionFilter.value);
  }
  
  const start = (goodsTransactionPage.value - 1) * goodsTransactionPageCount;
  const end = start + goodsTransactionPageCount;
  return filtered.slice(start, end);
});

// Get transaction type display
function getTransactionTypeDisplay(type: string) {
  return type === 'out' ? 'OUT (Keluar)' : 'IN (Masuk)';
}

// Get transaction type color
function getTransactionTypeColor(type: string) {
  return type === 'out' ? 'red' : 'green';
}

// Format transaction item name
function getTransactionItemName(transaction: any) {
  // Transaction now has items array
  if (transaction.items && transaction.items.length > 0) {
    const firstItem = transaction.items[0];
    if (firstItem.asset) {
      return `${firstItem.asset.brand} ${firstItem.asset.model} (${firstItem.asset.serial_number})`;
    }
    return firstItem.id_items || 'Unknown Item';
  }
  return 'No Items';
}

// Open delete confirmation modal
function deleteGoodsTransaction(id: string) {
  transactionToDelete.value = id;
  showDeleteModal.value = true;
}

// Confirm and perform deletion
async function confirmDeleteTransaction() {
  if (!transactionToDelete.value) return;
  
  try {
    // Determine transaction type from the transaction
    const transaction = goodsTransactions.value.find(t => t.id === transactionToDelete.value);
    const transactionType = transaction?.transaction_type || 'out';
    await itemsTransactionAdminApi().deleteItemsTransaction(transactionToDelete.value, transactionType);
    notification.success('Success', 'Transaction deleted successfully');
    await loadGoodsTransactions();
    showDeleteModal.value = false;
    transactionToDelete.value = null;
  } catch (error: any) {
    notification.error('Error', error.message || 'Failed to delete transaction');
  }
}

// Cancel deletion
function cancelDeleteTransaction() {
  showDeleteModal.value = false;
  transactionToDelete.value = null;
}

// Navigation helper functions for template usage
function goToAssetItems() {
  navigateTo('/dashboard/asset/items')
}

function goToItemsCatalog() {
  navigateTo('/dashboard/asset/items-catalog')
}

function goToAssetDetail(assetId: string) {
  navigateTo(`/dashboard/asset/${assetId}`)
}

// Load transactions on mount
onMounted(() => {
  loadGoodsTransactions();
});
</script>

<template>
  <!-- Action Buttons - Responsive -->
  <div class="flex flex-col sm:flex-row gap-2 mb-4">
    <UButton 
      label="Add Asset" 
      @click="OpenModalAddAsset(false, null)"
      class="w-full sm:w-auto"
      size="lg"
    />
    <UButton
      label="Manage Asset Items"
      color="blue"
      variant="outline"
      @click="goToAssetItems"
      class="w-full sm:w-auto"
      size="lg"
    />
    <UButton
      label="Items Catalog"
      color="purple"
      variant="outline"
      @click="goToItemsCatalog"
      class="w-full sm:w-auto"
      size="lg"
    >
      <template #leading>
        <LucideIcon name="list" :size="16" />
      </template>
    </UButton>
    <UButton
      label="Record Goods Transaction"
      color="green"
      variant="outline"
      @click="showGoodsModal = true"
      class="w-full sm:w-auto"
      size="lg"
    >
      <template #leading>
        <LucideIcon name="package" :size="16" />
      </template>
    </UButton>
  </div>

  <!-- Search Filter - Responsive -->
  <div class="flex px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
    <UInput 
      v-model="q" 
      placeholder="Filter asset..." 
      class="w-full"
      size="lg"
      icon="i-heroicons-magnifying-glass"
    />
  </div>

  <!-- Desktop Table View (hidden on mobile) -->
  <div class="hidden md:block table-scroll-container">
    <div class="table-scroll-content">
      <UTable
        :columns="tableColumns"
        :rows="filteredRows"
        class="dashboard-table asset-table-responsive"
      >
        <template #date-data="{ row }">
          <span class="text-sm">{{ formatDate(row.date) }}</span>
        </template>
        <template #asset_items-data="{ row }">
          <UBadge
            :label="`${row.asset_items?.length || 0} items`"
            color="blue"
            variant="soft"
            size="sm"
          />
        </template>
        <template #actions-data="{ row }">
          <UDropdown :items="items(row)">
            <UButton color="gray" size="sm">
              <template #leading>
                <LucideIcon name="ellipsis-vertical" :size="16" />
              </template>
            </UButton>
          </UDropdown>
        </template>
      </UTable>
    </div>
  </div>

  <!-- Mobile Card View (visible on mobile only) -->
  <div class="md:hidden space-y-3 mb-4">
    <div
      v-for="row in filteredRows"
      :key="row.id"
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {{ row.type || row.brand || 'Asset' }}
          </h3>
          <p v-if="row.brand && row.model" class="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
            {{ row.brand }} {{ row.model }}
          </p>
        </div>
        <UDropdown :items="items(row)">
          <UButton color="gray" variant="ghost" size="sm">
            <LucideIcon name="ellipsis-vertical" :size="16" />
          </UButton>
        </UDropdown>
      </div>

      <div class="space-y-2 text-sm">
        <div v-if="row.serial_number" class="flex items-start">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Serial:</span>
          <span class="text-gray-900 dark:text-gray-100 break-all font-mono text-xs">{{ row.serial_number }}</span>
        </div>
        <div v-if="row.date" class="flex items-center">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Date:</span>
          <span class="text-gray-900 dark:text-gray-100">{{ formatDate(row.date) }}</span>
        </div>
        <div v-if="row.asset_items" class="flex items-center">
          <span class="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Items:</span>
          <UBadge
            :label="`${row.asset_items?.length || 0} items`"
            color="blue"
            variant="soft"
            size="sm"
          />
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <UButton
          color="blue"
          variant="ghost"
          size="sm"
          @click="goToAssetDetail(row.id)"
          class="flex-1"
        >
          <template #leading>
            <LucideIcon name="eye" :size="14" />
          </template>
          View
        </UButton>
        <UButton
          color="gray"
          variant="ghost"
          size="sm"
          @click="OpenModalAddAsset(true, row)"
          class="flex-1"
        >
          <template #leading>
            <LucideIcon name="pencil" :size="14" />
          </template>
          Edit
        </UButton>
      </div>
    </div>
  </div>

  <!-- Pagination - Responsive -->
  <div
    class="flex justify-center sm:justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
  >
    <UPagination
      v-model="page"
      :page-count="pageCount"
      :total="assetData.length"
      :max="7"
      class="w-full sm:w-auto"
    />
  </div>

  <!-- Goods Transactions Section -->
  <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <LucideIcon name="package" :size="20" />
            <span class="truncate">Goods Transactions</span>
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
            Record and track goods going in and out of inventory
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <USelectMenu
            v-model="goodsTransactionFilter"
            :options="[
              { value: 'all', label: 'All Transactions' },
              { value: 'out', label: 'Goods OUT Only' },
              { value: 'in', label: 'Goods IN Only' },
            ]"
            option-attribute="label"
            value-attribute="value"
            @change="loadGoodsTransactions()"
            class="w-full sm:w-auto"
            size="lg"
          />
          <UButton
            color="gray"
            variant="outline"
            @click="loadGoodsTransactions()"
            :loading="loadingTransactions"
            class="w-full sm:w-auto"
            size="lg"
          >
            <template #leading>
              <LucideIcon name="refresh-cw" :size="16" />
            </template>
            Refresh
          </UButton>
        </div>
      </div>
    </div>

    <div v-if="loadingTransactions" class="p-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading transactions...</p>
    </div>

    <div v-else-if="filteredGoodsTransactions.length === 0" class="p-8 text-center">
      <LucideIcon name="package-x" :size="48" class="mx-auto text-gray-400 mb-3" />
      <p class="text-gray-600 dark:text-gray-400 font-medium">No transactions found</p>
      <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Click "Record Goods Transaction" to add your first transaction</p>
    </div>

    <template v-else>
      <!-- Desktop Table View -->
      <div class="hidden md:block table-scroll-container">
        <div class="table-scroll-content">
          <UTable
            :rows="filteredGoodsTransactions"
            :columns="[
              { key: 'date', label: 'Date' },
              { key: 'transaction_type', label: 'Type' },
              { key: 'items', label: 'Item' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'notes', label: 'Notes' },
              { key: 'actions', label: 'Actions' },
            ]"
            class="dashboard-table transaction-table-responsive"
          >
          <template #date-data="{ row }">
            <span class="text-sm">{{ formatDate(row.date || row.created_at) }}</span>
          </template>

          <template #transaction_type-data="{ row }">
            <UBadge
              :label="getTransactionTypeDisplay(row.transaction_type)"
              :color="getTransactionTypeColor(row.transaction_type)"
              variant="soft"
              size="sm"
            />
          </template>

          <template #items-data="{ row }">
            <div class="flex flex-col">
              <span v-if="row.items && row.items.length > 0" class="font-medium text-gray-900 dark:text-gray-900 text-sm">
                {{ row.items.length }} item(s)
              </span>
              <span v-else class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                No items
              </span>
              <div v-for="(item, idx) in row.items?.slice(0, 2)" :key="idx" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ item.item_name || (item.asset ? `${item.asset.brand} ${item.asset.model}` : item.id_items) }} - {{ item.quantity }} {{ item.unit }}
              </div>
              <span v-if="row.items && row.items.length > 2" class="text-xs text-gray-400 italic">
                +{{ row.items.length - 2 }} more
              </span>
            </div>
          </template>

          <template #quantity-data="{ row }">
            <div v-if="row.items && row.items.length > 0" class="flex flex-col">
              <span class="font-medium text-sm">{{ row.items.reduce((sum: number, item: any) => sum + item.quantity, 0) }}</span>
              <span class="text-xs text-gray-500">
                total quantity
              </span>
            </div>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #notes-data="{ row }">
            <span class="text-sm text-gray-600 dark:text-gray-900 max-w-xs truncate" :title="row.notes">
              {{ row.notes || '-' }}
            </span>
          </template>

          <template #actions-data="{ row }">
            <UButton
              color="red"
              variant="ghost"
              size="xs"
              @click="deleteGoodsTransaction(row.id)"
            >
              <template #leading>
                <LucideIcon name="trash-2" :size="14" />
              </template>
              Delete
            </UButton>
          </template>
          </UTable>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3 p-4">
      <div
        v-for="transaction in filteredGoodsTransactions"
        :key="transaction.id"
        class="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <UBadge
                :label="getTransactionTypeDisplay(transaction.transaction_type)"
                :color="getTransactionTypeColor(transaction.transaction_type)"
                variant="soft"
                size="sm"
              />
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(transaction.date || transaction.created_at) }}
              </span>
            </div>
          </div>
          <UButton
            color="red"
            variant="ghost"
            size="xs"
            @click="deleteGoodsTransaction(transaction.id)"
          >
            <LucideIcon name="trash-2" :size="16" />
          </UButton>
        </div>

        <div v-if="transaction.items && transaction.items.length > 0" class="space-y-2 mb-3">
          <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {{ transaction.items.length }} item(s) • Total: {{ transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0) }}
          </div>
          <div class="space-y-1">
            <div
              v-for="(item, idx) in transaction.items.slice(0, 3)"
              :key="idx"
              class="text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700"
            >
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ item.item_name || (item.asset ? `${item.asset.brand} ${item.asset.model}` : item.id_items) }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Qty: {{ item.quantity }} {{ item.unit }}
              </div>
            </div>
            <div v-if="transaction.items.length > 3" class="text-xs text-gray-500 dark:text-gray-400 italic text-center pt-1">
              +{{ transaction.items.length - 3 }} more item(s)
            </div>
          </div>
        </div>

        <div v-if="transaction.notes" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes:</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">{{ transaction.notes }}</div>
        </div>
      </div>
    </div>
    </template>

    <!-- Pagination -->
    <div
      v-if="filteredGoodsTransactions.length > 0"
      class="flex justify-center sm:justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
    >
      <UPagination
        v-model="goodsTransactionPage"
        :page-count="goodsTransactionPageCount"
        :total="goodsTransactions.filter(t => goodsTransactionFilter === 'all' || t.transaction_type === goodsTransactionFilter).length"
        :max="7"
        class="w-full sm:w-auto"
      />
    </div>
  </div>

  <!-- Goods Transaction Modal -->
  <UModal v-model="showGoodsModal">
    <GoodsTransactionModal
      @success="
        showGoodsModal = false;
        loadGoodsTransactions();
      "
      @close="showGoodsModal = false"
    />
  </UModal>

  <!-- Delete Confirmation Modal -->
  <UModal v-model="showDeleteModal">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <LucideIcon name="alert-triangle" :size="24" class="text-red-500" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Delete Transaction
          </h3>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="gray"
            variant="ghost"
            @click="cancelDeleteTransaction"
          >
            Cancel
          </UButton>
          <UButton
            color="red"
            @click="confirmDeleteTransaction"
          >
            <template #leading>
              <LucideIcon name="trash-2" :size="16" />
            </template>
            Delete
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<style scoped>
/* Mobile optimizations */
@media (max-width: 767px) {
  /* Ensure cards have proper spacing on mobile */
  .space-y-3 > * + * {
    margin-top: 0.75rem;
  }
  
  /* Better text truncation for mobile */
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* Break long serial numbers */
  .break-all {
    word-break: break-all;
    overflow-wrap: anywhere;
  }
  
  /* Better font rendering on mobile */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  button, a {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Tablet and Desktop optimizations (768px and above) */
@media (min-width: 768px) {
  /* Hide mobile card view */
  .md\:hidden {
    display: none !important;
  }
  
  /* Ensure table has proper width on tablet */
  .table-scroll-container {
    width: 100%;
    overflow-x: auto;
  }
  
  .table-scroll-content {
    min-width: 100%;
    width: max-content;
  }
  
  /* Asset table - wider columns for better readability */
  .asset-table-responsive :deep(table) {
    min-width: 1200px;
    width: 100%;
  }
  
  .asset-table-responsive :deep(td),
  .asset-table-responsive :deep(th) {
    padding: 0.875rem 1rem !important;
    white-space: nowrap;
    min-width: 100px;
  }
  
  /* Serial number column - allow wrapping but with more width */
  .asset-table-responsive :deep(td:nth-child(5)),
  .asset-table-responsive :deep(th:nth-child(5)) {
    min-width: 280px;
    max-width: 350px;
    white-space: normal;
    word-break: break-all;
  }
  
  /* Description column - allow wrapping with more width */
  .asset-table-responsive :deep(td:nth-child(9)),
  .asset-table-responsive :deep(th:nth-child(9)) {
    min-width: 200px;
    max-width: 300px;
    white-space: normal;
    word-wrap: break-word;
  }
  
  /* Type, Brand, Model columns - reasonable width */
  .asset-table-responsive :deep(td:nth-child(2)),
  .asset-table-responsive :deep(th:nth-child(2)),
  .asset-table-responsive :deep(td:nth-child(3)),
  .asset-table-responsive :deep(th:nth-child(3)),
  .asset-table-responsive :deep(td:nth-child(4)),
  .asset-table-responsive :deep(th:nth-child(4)) {
    min-width: 120px;
    white-space: normal;
  }
  
  /* Transaction table - wider columns */
  .transaction-table-responsive :deep(table) {
    min-width: 900px;
    width: 100%;
  }
  
  .transaction-table-responsive :deep(td),
  .transaction-table-responsive :deep(th) {
    padding: 0.875rem 1rem !important;
    white-space: nowrap;
  }
  
  /* Item column in transactions - allow wrapping */
  .transaction-table-responsive :deep(td:nth-child(3)),
  .transaction-table-responsive :deep(th:nth-child(3)) {
    min-width: 250px;
    max-width: 350px;
    white-space: normal;
  }
  
  /* Notes column - allow wrapping */
  .transaction-table-responsive :deep(td:nth-child(5)),
  .transaction-table-responsive :deep(th:nth-child(5)) {
    min-width: 200px;
    max-width: 300px;
    white-space: normal;
    word-wrap: break-word;
  }
}

/* Large tablet and desktop (1024px and above) */
@media (min-width: 1024px) {
  .asset-table-responsive :deep(table) {
    min-width: 1400px;
  }
  
  .asset-table-responsive :deep(td),
  .asset-table-responsive :deep(th) {
    padding: 1rem 1.25rem !important;
  }
  
  .transaction-table-responsive :deep(table) {
    min-width: 1000px;
  }
}

/* Better button spacing on mobile */
@media (max-width: 640px) {
  .flex-wrap > * {
    min-width: 0;
  }
  
  /* Full width buttons on very small screens */
  .w-full {
    width: 100%;
  }
}

/* Smooth scrolling */
.table-scroll-content {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Custom scrollbar for better visibility */
.table-scroll-content::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}

.table-scroll-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 5px;
}

.table-scroll-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 5px;
}

.table-scroll-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
