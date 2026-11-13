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
  { value: 'PCS', label: 'PCS (Buah)' },
  { value: 'M', label: 'M (Meter)' },
  { value: 'KG', label: 'KG (Kilogram)' },
  { value: 'BOX', label: 'BOX (Kotak)' },
  { value: 'ROLL', label: 'ROLL (Gulungan)' },
];

const schema = object({
  transaction_type: string().required("Jenis transaksi wajib dipilih"),
  item_type: string().required("Item wajib dipilih"),
  quantity: number().required("Jumlah wajib diisi").min(0.01, "Jumlah harus lebih dari 0"),
  unit: string().required("Satuan wajib dipilih"),
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
    notification.error('Gagal', 'Gagal memuat katalog item. Pastikan item sudah ditambahkan ke katalog.');
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
        notification.error('Data tidak valid', 'Pilih aset terlebih dahulu');
        state.loading = false;
        return;
      }
      // For assets, we need to find or create a catalog item linked to this asset
      // First, try to find an existing catalog item linked to this asset
      const catalogItem = state.catalogItems.find(i => i.asset_id === state.asset_id);
      if (catalogItem) {
        itemId = catalogItem.id;
      } else {
        notification.error('Data tidak valid', 'Item katalog untuk aset ini tidak ditemukan. Buat item katalog yang terhubung ke aset ini terlebih dahulu.');
        state.loading = false;
        return;
      }
    } else {
      // For catalog items
      if (!state.catalog_item_id) {
        notification.error('Data tidak valid', 'Pilih item dari katalog terlebih dahulu');
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
    
    notification.success('Berhasil', 'Transaksi barang berhasil dicatat');
    emit("success");
  } catch (error: any) {
    console.error("Error creating goods transaction:", error);
    notification.error('Gagal', error.message || 'Gagal mencatat transaksi barang');
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
          {{ isEdit ? 'Ubah' : 'Catat' }} Transaksi Barang
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
      <UFormGroup name="transaction_type" label="Jenis Transaksi">
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="state.transaction_type"
              value="out"
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-gray-900 dark:text-gray-100">Barang Keluar</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="state.transaction_type"
              value="in"
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-gray-900 dark:text-gray-100">Barang Masuk</span>
          </label>
        </div>
      </UFormGroup>

      <!-- Item Type Selection -->
      <UFormGroup name="item_type" label="Jenis Item">
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="state.item_type"
              value="catalog"
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-gray-900 dark:text-gray-100">Dari Katalog</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="state.item_type"
              value="asset"
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-gray-900 dark:text-gray-100">Aset dari Sistem</span>
          </label>
        </div>
      </UFormGroup>

      <!-- Catalog Item Selection -->
      <UFormGroup
        v-if="state.item_type === 'catalog'"
        name="catalog_item_id"
        label="Pilih Item dari Katalog"
      >
        <USelectMenu
          v-model="state.catalog_item_id"
          :options="state.catalogItems"
          placeholder="Pilih item dari katalog"
          option-attribute="label"
          value-attribute="value"
          searchable
          searchable-placeholder="Cari item..."
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <LucideIcon name="info" :size="14" class="inline mr-1" />
          Pilih item dari katalog. Jika belum tersedia, tambahkan item ke katalog terlebih dahulu.
          <UButton
            variant="link"
            size="xs"
            @click="navigateTo('/dashboard/asset/items-catalog')"
            class="ml-1"
          >
            Buka Katalog Item
          </UButton>
        </p>
      </UFormGroup>

      <!-- Asset Selection -->
      <UFormGroup
        v-if="state.item_type === 'asset'"
        name="asset_id"
        label="Pilih Aset"
      >
        <USelectMenu
          v-model="state.asset_id"
          :options="state.assets"
          placeholder="Pilih aset (contoh: Router TOTOLINK)"
          option-attribute="display"
          value-attribute="id"
          searchable
          searchable-placeholder="Cari berdasarkan merek, model, atau nomor seri"
          :search-attributes="['brand', 'model', 'serial_number', 'type']"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <LucideIcon name="info" :size="14" class="inline mr-1" />
          Pilih aset dari sistem manajemen aset (contoh: router, switch, dan lainnya)
        </p>
      </UFormGroup>

      <!-- Quantity and Unit -->
      <div class="grid grid-cols-2 gap-4">
        <UFormGroup name="quantity" label="Jumlah">
          <UInput
            v-model.number="state.quantity"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Masukkan jumlah"
          />
        </UFormGroup>

        <UFormGroup name="unit" label="Satuan">
          <USelectMenu
            v-model="state.unit"
            :options="unitOptions"
            placeholder="Pilih satuan"
            option-attribute="label"
            value-attribute="value"
          />
        </UFormGroup>
      </div>

      <!-- Transaction Date -->
      <UFormGroup name="transaction_date" label="Tanggal Transaksi">
        <UInput
          v-model="state.transaction_date"
          type="date"
        />
      </UFormGroup>

      <!-- Notes -->
      <UFormGroup name="notes" label="Catatan (Opsional)">
        <UTextarea
          v-model="state.notes"
          placeholder="Catatan tambahan terkait transaksi ini"
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
          Batal
        </UButton>
        <UButton
          type="submit"
          color="blue"
          :loading="state.loading"
        >
          <template #leading>
            <LucideIcon name="save" :size="16" />
          </template>
          {{ isEdit ? 'Perbarui' : 'Catat' }} Transaksi
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
