<script setup lang="ts">
import { itemsCatalogAdminApi } from "@/api/admin/items-catalog";
import { assetAdminApi } from "@/api/admin/asset";
import { useNotificationStore } from "@/stores/notification";
import FormAddItemComponent from "./AddItemForm.vue";
import type { Item } from "@/types/requests/items-catalog";
import { format } from "date-fns";
import LucideIcon from '@/components/LucideIcon.vue';

const notification = useNotificationStore();

// Set page title
useHead({
  title: "Items Catalog Management - CRM System",
});

const page = ref(1);
const pageCount = 10;
const q = ref("");
const selectedCategory = ref("");

const items = ref<Item[]>([]);
const assets = ref<any[]>([]);
const loading = ref(false);

const filteredRows = computed(() => {
  let filtered = items.value;

  if (selectedCategory.value) {
    filtered = filtered.filter((item) => item.category === selectedCategory.value);
  }

  if (q.value) {
    filtered = filtered.filter((item) => {
      return Object.values(item).some((value) => {
        return String(value).toLowerCase().includes(q.value.toLowerCase());
      });
    });
  }

  return filtered.slice(
    (page.value - 1) * pageCount,
    page.value * pageCount
  );
});

const categories = computed(() => {
  const cats = new Set<string>();
  items.value.forEach((item) => {
    if (item.category) {
      cats.add(item.category);
    }
  });
  return Array.from(cats).sort();
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
  loading.value = true;
  try {
    const response = await itemsCatalogAdminApi().getItems();
    if (response.success) {
      items.value = response.data || [];
    }
  } catch (error: any) {
    notification.error("Error", error.message || "Failed to load items");
  } finally {
    loading.value = false;
  }
}

async function getAssets() {
  try {
    const response = await assetAdminApi().getAllAssets();
    if (response.success) {
      assets.value = response.data.map((asset: any) => ({
        label: `${asset.brand} ${asset.model} (${asset.type})`,
        value: asset.id,
        ...asset,
      }));
    }
  } catch (error) {
    console.error("Failed to load assets:", error);
  }
}

async function deleteItem(itemId: string) {
  if (!confirm("Are you sure you want to delete this item?")) {
    return;
  }

  try {
    await itemsCatalogAdminApi().deleteItem(itemId);
    notification.success("Success", "Item deleted successfully");
    await getData();
  } catch (error: any) {
    notification.error("Error", error.message || "Failed to delete item");
  }
}

await Promise.all([getData(), getAssets()]);

const modal = useModal();

function OpenModalAddItem(isEdit: boolean, data: any) {
  modal.open(FormAddItemComponent, {
    isEdit,
    data,
    assets: assets.value,
    async onSuccess() {
      await getData();
      modal.close();
    },
    onClose() {
      modal.close();
    },
  });
}

const itemsMenu = (row: Item) => [
  [
    {
      label: "Edit",
      icon: "pencil-square-20-solid",
      click: () => OpenModalAddItem(true, row),
    },
    {
      label: "Delete",
      icon: "trash-2-20-solid",
      click: () => deleteItem(row.id),
    },
  ],
];

const tableColumns = [
  { key: "name", label: "Name" },
  { key: "default_unit", label: "Default Unit" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "asset", label: "Linked Asset" },
  { key: "created_at", label: "Created At" },
  { key: "actions", label: "Actions" },
];
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex items-center gap-3">
        <UButton
          @click="navigateTo('/dashboard/asset')"
          color="gray"
          variant="outline"
          class="w-full sm:w-auto hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <LucideIcon name="arrow-left" :size="16" class="mr-2" />
          <span class="hidden sm:inline">Back to Assets</span>
          <span class="sm:hidden">Back</span>
        </UButton>
        <h1 class="text-2xl font-bold text-gray-900">
          Items Catalog Management
        </h1>
      </div>
      <UButton
        label="Add Item"
        @click="OpenModalAddItem(false, null)"
        class="w-full sm:w-auto"
        size="lg"
      >
        <template #leading>
          <LucideIcon name="plus" :size="16" />
        </template>
      </UButton>
    </div>

    <div
      class="flex flex-col sm:flex-row gap-4 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700"
    >
      <UInput
        v-model="q"
        placeholder="Search items..."
        class="flex-1"
        size="lg"
        icon="i-heroicons-magnifying-glass"
      />
      <USelectMenu
        v-model="selectedCategory"
        :options="[
          { value: '', label: 'All Categories' },
          ...categories.map((cat) => ({ value: cat, label: cat })),
        ]"
        placeholder="Filter by Category"
        option-attribute="label"
        value-attribute="value"
        class="w-full sm:w-64"
        size="lg"
        :clearable="true"
      />
    </div>

    <div v-if="loading" class="p-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading items...</p>
    </div>

    <div v-else-if="filteredRows.length === 0" class="p-8 text-center">
      <LucideIcon name="package-x" :size="48" class="mx-auto text-gray-400 mb-3" />
      <p class="text-gray-600 dark:text-gray-400 font-medium">No items found</p>
      <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
        Click "Add Item" to create your first item in the catalog
      </p>
    </div>

    <div v-else class="table-scroll-container">
      <div class="table-scroll-content">
        <UTable
          :columns="tableColumns"
          :rows="filteredRows"
          class="dashboard-table"
        >
          <template #default_unit-data="{ row }">
            <UBadge
              :label="row.default_unit"
              color="blue"
              variant="soft"
              size="sm"
            />
          </template>
          <template #category-data="{ row }">
            <span v-if="row.category" class="text-sm">{{ row.category }}</span>
            <span v-else class="text-sm text-gray-400">-</span>
          </template>
          <template #description-data="{ row }">
            <span
              v-if="row.description"
              class="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate"
              :title="row.description"
            >
              {{ row.description }}
            </span>
            <span v-else class="text-sm text-gray-400">-</span>
          </template>
          <template #asset-data="{ row }">
            <span v-if="row.asset" class="text-sm">
              {{ row.asset.brand }} {{ row.asset.model }}
            </span>
            <span v-else class="text-sm text-gray-400">-</span>
          </template>
          <template #created_at-data="{ row }">
            <span class="text-sm">{{ formatDate(row.created_at) }}</span>
          </template>
          <template #actions-data="{ row }">
            <UDropdown :items="itemsMenu(row)">
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

    <div
      v-if="filteredRows.length > 0"
      class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
    >
      <UPagination
        v-model="page"
        :page-count="pageCount"
        :total="filteredRows.length"
        :max="7"
      />
    </div>
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
