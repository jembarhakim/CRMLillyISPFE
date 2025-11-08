<script setup lang="ts">
import { object, string, number, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { itemsTransactionAdminApi } from "@/api/admin/items-transaction";
import { itemsCatalogAdminApi } from "@/api/admin/items-catalog";
import { assetAdminApi } from "@/api/admin/asset";
import { useNotificationStore } from "@/stores/notification";
import LucideIcon from '@/components/LucideIcon.vue';

const notification = useNotificationStore();

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["success", "close"]);

const unitOptions = [
  { value: 'PCS', label: 'PCS (Piece)' },
  { value: 'M', label: 'M (Meter)' },
  { value: 'KG', label: 'KG (Kilogram)' },
  { value: 'BOX', label: 'BOX' },
  { value: 'ROLL', label: 'ROLL' },
];

const schema = object({
  transaction_type: string().required("Transaction type is required"),
  item_type: string().required("Item selection is required"),
  quantity: number().required("Quantity is required").min(0.01, "Quantity must be greater than 0"),
  unit: string().required("Unit is required"),
});

const state = reactive({
  transaction_type: 'out' as 'in' | 'out',
  item_type: 'catalog' as 'catalog' | 'asset',
  catalog_item_id: '',
  asset_id: '',
  quantity: 1,
  unit: 'PCS',
  notes: '',
  transaction_date: new Date().toISOString().split('T')[0],
  loading: false,
  assets: [] as any[],
  catalogItems: [] as any[],
});

// Load catalog items
async function loadCatalogItems() {
  try {
    const response = await itemsCatalogAdminApi().getItems();
    if (response.success) {
      state.catalogItems = (response.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        default_unit: item.default_unit,
        category: item.category,
        asset_id: item.asset_id,
        label: item.name,
        value: item.id,
      }));
    }
  } catch (error) {
    console.error('Failed to load catalog items:', error);
    notification.error('Error', 'Failed to load items catalog. Please ensure items are added to the catalog first.');
  }
}

// Load assets for selection
async function loadAssets() {
  try {
    const response = await assetAdminApi().getAllAssets();
    if (response.success) {
      state.assets = response.data.map((asset: any) => ({
        id: asset.id,
        name: `${asset.brand} ${asset.model} (${asset.serial_number})`,
        brand: asset.brand,
        model: asset.model,
        type: asset.type,
        serial_number: asset.serial_number,
        display: `${asset.brand} ${asset.model} (${asset.type}) - ${asset.serial_number}`
      }));
    }
  } catch (error) {
    console.error('Failed to load assets:', error);
  }
}

// Watch for item type changes
watch(() => state.item_type, (newType) => {
  if (newType === 'catalog') {
    state.asset_id = '';
  } else {
    state.catalog_item_id = '';
  }
});

// Watch for catalog item selection to auto-set unit
watch(() => state.catalog_item_id, (itemId) => {
  if (itemId) {
    const item = state.catalogItems.find(i => i.id === itemId);
    if (item) {
      state.unit = item.default_unit;
    }
  }
});

type Schema = InferType<typeof schema>;

async function onSubmit(event: FormSubmitEvent<Schema>) {
  state.loading = true;
  
  try {
    let itemId = '';
    
    if (state.item_type === 'asset') {
      if (!state.asset_id) {
        notification.error('Validation Error', 'Please select an asset');
        state.loading = false;
        return;
      }
      // For assets, we need to find or create a catalog item linked to this asset
      // First, try to find an existing catalog item linked to this asset
      const catalogItem = state.catalogItems.find(i => i.asset_id === state.asset_id);
      if (catalogItem) {
        itemId = catalogItem.id;
      } else {
        notification.error('Validation Error', `No catalog item found for this asset. Please create a catalog item linked to this asset first in the Items Catalog.`);
        state.loading = false;
        return;
      }
    } else {
      // For catalog items
      if (!state.catalog_item_id) {
        notification.error('Validation Error', 'Please select an item from the catalog');
        state.loading = false;
        return;
      }
      itemId = state.catalog_item_id;
    }

    // Create transaction with items array
    const transactionData = {
      transaction_type: state.transaction_type,
      date: state.transaction_date,
      notes: state.notes || undefined,
      items: [
        {
          id_items: itemId, // This is the item_id from items catalog
          quantity: state.quantity,
          unit: state.unit,
          harga_satuan: state.transaction_type === 'in' ? 0 : undefined, // Optional for out, can be set for in
          notes: state.notes || undefined,
        }
      ]
    };

    const response = await itemsTransactionAdminApi().createItemsTransaction(transactionData);
    
    notification.success('Success', `Goods transaction recorded successfully`);
    emit("success");
  } catch (error: any) {
    console.error("Error creating goods transaction:", error);
    notification.error('Error', error.message || 'Failed to record goods transaction');
  } finally {
    state.loading = false;
  }
}

onMounted(() => {
  loadCatalogItems();
  loadAssets();
  
  if (props.isEdit && props.data) {
    // Populate form for editing (if needed)
    state.transaction_type = props.data.transaction_type || 'out';
    state.quantity = props.data.quantity || 1;
    state.unit = props.data.unit || 'PCS';
    state.notes = props.data.notes || '';
    state.transaction_date = props.data.transaction_date ? new Date(props.data.transaction_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  }
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ isEdit ? 'Edit' : 'Record' }} Goods Transaction
        </h3>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          @click="emit('close')"
        />
      </div>
    </template>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <!-- Transaction Type -->
      <UFormGroup name="transaction_type" label="Transaction Type">
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="state.transaction_type"
              value="out"
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-gray-900 dark:text-gray-100">Goods OUT (Alat Keluar)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="state.transaction_type"
              value="in"
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-gray-900 dark:text-gray-100">Goods IN (Alat Masuk)</span>
          </label>
        </div>
      </UFormGroup>

      <!-- Item Type Selection -->
      <UFormGroup name="item_type" label="Item Type">
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="state.item_type"
              value="catalog"
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-gray-900 dark:text-gray-100">From Catalog</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="state.item_type"
              value="asset"
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-gray-900 dark:text-gray-100">Asset from System</span>
          </label>
        </div>
      </UFormGroup>

      <!-- Catalog Item Selection -->
      <UFormGroup
        v-if="state.item_type === 'catalog'"
        name="catalog_item_id"
        label="Select Item from Catalog"
      >
        <USelectMenu
          v-model="state.catalog_item_id"
          :options="state.catalogItems"
          placeholder="Select item from catalog"
          option-attribute="label"
          value-attribute="value"
          searchable
          searchable-placeholder="Search items..."
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <LucideIcon name="info" :size="14" class="inline mr-1" />
          Select an item from the catalog. If no items are available, please add items to the catalog first.
          <UButton
            variant="link"
            size="xs"
            @click="navigateTo('/dashboard/asset/items-catalog')"
            class="ml-1"
          >
            Go to Items Catalog
          </UButton>
        </p>
      </UFormGroup>

      <!-- Asset Selection -->
      <UFormGroup
        v-if="state.item_type === 'asset'"
        name="asset_id"
        label="Select Asset"
      >
        <USelectMenu
          v-model="state.asset_id"
          :options="state.assets"
          placeholder="Select asset (e.g., Router TOTOLINK)"
          option-attribute="display"
          value-attribute="id"
          searchable
          searchable-placeholder="Search by brand, model, or serial number"
          :search-attributes="['brand', 'model', 'serial_number', 'type']"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <LucideIcon name="info" :size="14" class="inline mr-1" />
          Select an asset from the asset management system (e.g., routers, switches, etc.)
        </p>
      </UFormGroup>

      <!-- Quantity and Unit -->
      <div class="grid grid-cols-2 gap-4">
        <UFormGroup name="quantity" label="Quantity">
          <UInput
            v-model.number="state.quantity"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Enter quantity"
          />
        </UFormGroup>

        <UFormGroup name="unit" label="Unit">
          <USelectMenu
            v-model="state.unit"
            :options="unitOptions"
            placeholder="Select unit"
            option-attribute="label"
            value-attribute="value"
          />
        </UFormGroup>
      </div>

      <!-- Transaction Date -->
      <UFormGroup name="transaction_date" label="Transaction Date">
        <UInput
          v-model="state.transaction_date"
          type="date"
        />
      </UFormGroup>

      <!-- Notes -->
      <UFormGroup name="notes" label="Notes (Optional)">
        <UTextarea
          v-model="state.notes"
          placeholder="Additional notes about this transaction"
          :rows="3"
        />
      </UFormGroup>

      <!-- Submit Button -->
      <div class="flex justify-end gap-3 pt-4">
        <UButton
          type="button"
          color="gray"
          variant="outline"
          @click="emit('close')"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          color="blue"
          :loading="state.loading"
        >
          <template #leading>
            <LucideIcon name="save" :size="16" />
          </template>
          {{ isEdit ? 'Update' : 'Record' }} Transaction
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
