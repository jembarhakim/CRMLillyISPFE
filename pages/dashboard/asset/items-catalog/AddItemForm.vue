<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { itemsCatalogAdminApi } from "@/api/admin/items-catalog";
import { useNotificationStore } from "@/stores/notification";
import type { CreateItemRequest, Item } from "@/types/requests/items-catalog";
import LucideIcon from '@/components/LucideIcon.vue';

const notification = useNotificationStore();

const schema = object({
  name: string().required("Item name is required"),
  default_unit: string()
    .required("Default unit is required")
    .oneOf(["PCS", "M", "KG", "BOX", "ROLL"], "Invalid unit"),
  category: string().optional(),
  description: string().optional(),
  asset_id: string().optional(),
});

const state = reactive<CreateItemRequest & { loading: boolean }>({
  name: "",
  default_unit: "PCS",
  category: undefined,
  description: undefined,
  asset_id: undefined,
  loading: false,
});

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false,
    default: false,
  },
  data: {
    type: Object as () => Item | null,
    default: () => null,
  },
  assets: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["success", "close"]);

const unitOptions = [
  { value: "PCS", label: "PCS (Piece)" },
  { value: "M", label: "M (Meter)" },
  { value: "KG", label: "KG (Kilogram)" },
  { value: "BOX", label: "BOX" },
  { value: "ROLL", label: "ROLL" },
];

watch(
  () => props.isEdit && props.data,
  (newValue) => {
    if (newValue && props.data) {
      state.name = props.data.name;
      state.default_unit = props.data.default_unit as any;
      state.category = props.data.category || undefined;
      state.description = props.data.description || undefined;
      state.asset_id = props.data.asset_id || undefined;
    } else {
      clearState();
    }
  },
  { immediate: true }
);

function clearState() {
  state.name = "";
  state.default_unit = "PCS";
  state.category = undefined;
  state.description = undefined;
  state.asset_id = undefined;
}

type Schema = InferType<typeof schema>;

async function onSubmit(event: FormSubmitEvent<Schema>) {
  state.loading = true;

  try {
    const submitData: CreateItemRequest = {
      name: state.name,
      default_unit: state.default_unit,
      category: state.category || undefined,
      description: state.description || undefined,
      asset_id: state.asset_id || undefined,
    };

    if (props.isEdit && props.data) {
      await itemsCatalogAdminApi().updateItem(props.data.id, submitData);
      notification.success("Success", "Item updated successfully");
    } else {
      await itemsCatalogAdminApi().createItem(submitData);
      notification.success("Success", "Item created successfully");
    }

    emit("success");
  } catch (error: any) {
    console.error("Error saving item:", error);
    notification.error("Error", error.message || "Failed to save item");
  } finally {
    state.loading = false;
  }
}
</script>

<template>
  <UModal>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? "Edit" : "Add New" }} Item
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="emit('close')"
          />
        </div>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormGroup label="Item Name" name="name" required>
          <UInput
            v-model="state.name"
            placeholder="e.g., Drop 1C, Patchcore, Router TOTOLINK"
            required
          />
        </UFormGroup>

        <UFormGroup label="Default Unit" name="default_unit" required>
          <USelectMenu
            v-model="state.default_unit"
            :options="unitOptions"
            placeholder="Select default unit"
            option-attribute="label"
            value-attribute="value"
          />
        </UFormGroup>

        <UFormGroup label="Category (Optional)" name="category">
          <UInput
            v-model="state.category"
            placeholder="e.g., Cable, Connector, Hardware"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Optional: Categorize the item for better organization
          </p>
        </UFormGroup>

        <UFormGroup label="Description (Optional)" name="description">
          <UTextarea
            v-model="state.description"
            placeholder="Additional details about this item"
            :rows="3"
          />
        </UFormGroup>

        <UFormGroup label="Link to Asset (Optional)" name="asset_id">
          <USelectMenu
            v-model="state.asset_id"
            :options="props.assets"
            placeholder="Select an asset to link (optional)"
            option-attribute="label"
            value-attribute="value"
            :clearable="true"
            searchable
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Optional: Link this item to an asset from the asset management system (e.g., routers)
          </p>
        </UFormGroup>

        <div class="flex justify-end gap-3 pt-4">
          <UButton
            type="button"
            color="gray"
            variant="outline"
            @click="emit('close')"
          >
            Cancel
          </UButton>
          <UButton type="submit" color="blue" :loading="state.loading">
            <template #leading>
              <LucideIcon name="save" :size="16" />
            </template>
            {{ isEdit ? "Update" : "Create" }} Item
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

